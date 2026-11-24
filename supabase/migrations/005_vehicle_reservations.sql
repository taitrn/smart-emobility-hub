begin;

create table public.vehicle_reservations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.app_users(id),
  vehicle_id uuid not null references public.shared_vehicles(id),
  hub_id uuid not null references public.mobility_hubs(id),
  pickup_slot_id uuid not null references public.parking_spaces(id),
  request_id uuid not null,
  status text not null default 'ACTIVE_HOLD'
    check (status in ('ACTIVE_HOLD', 'FULFILLED', 'CANCELLED', 'EXPIRED')),
  confirmed_at timestamptz not null,
  expires_at timestamptz not null,
  pickup_code text,
  unique (owner_id, request_id),
  unique (id, owner_id, vehicle_id),
  check (expires_at = confirmed_at + interval '15 minutes'),
  check (pickup_code is null or pickup_code ~ '^[A-HJ-NP-Z2-9]{6}$'),
  check ((status = 'ACTIVE_HOLD') = (pickup_code is not null))
);

create unique index vehicle_reservations_active_owner
  on public.vehicle_reservations (owner_id) where status = 'ACTIVE_HOLD';
create unique index vehicle_reservations_active_vehicle
  on public.vehicle_reservations (vehicle_id) where status = 'ACTIVE_HOLD';

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique,
  owner_id uuid not null,
  vehicle_id uuid not null,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'COMPLETED')),
  started_at timestamptz not null,
  ended_at timestamptz,
  return_hub_id uuid references public.mobility_hubs(id),
  return_slot_id uuid references public.parking_spaces(id),
  foreign key (reservation_id, owner_id, vehicle_id)
    references public.vehicle_reservations (id, owner_id, vehicle_id),
  check (
    (status = 'ACTIVE' and ended_at is null and return_hub_id is null and return_slot_id is null)
    or (status = 'COMPLETED' and ended_at is not null and ended_at >= started_at
      and return_hub_id is not null and return_slot_id is not null)
  )
);

create unique index trips_active_owner on public.trips (owner_id) where status = 'ACTIVE';
create unique index trips_active_vehicle on public.trips (vehicle_id) where status = 'ACTIVE';

alter table public.vehicle_reservations enable row level security;
alter table public.trips enable row level security;
revoke all on public.vehicle_reservations, public.trips from public, anon, authenticated;
grant select (id, owner_id, vehicle_id, hub_id, pickup_slot_id, status, confirmed_at, expires_at)
  on public.vehicle_reservations to authenticated;
grant select on public.trips to authenticated;

create policy vehicle_reservation_owner on public.vehicle_reservations
  for select to authenticated using (owner_id = (select auth.uid()));
create policy trip_owner on public.trips
  for select to authenticated using (owner_id = (select auth.uid()));

-- This public view deliberately projects across owners. It exposes neither
-- reservation rows nor the identity, code or deadline of any reservation.
create view public.hub_shared_vehicles with (security_barrier = true) as
select v.id, v.hub_id, v.code, v.vehicle_type, v.battery_percent,
  case
    when v.status = 'RESERVED' and r.expires_at <= statement_timestamp() then 'AVAILABLE'
    else v.status
  end as status,
  (
    h.status = 'ACTIVE' and coalesce(s.enabled and s.hub_id = v.hub_id
      and s.space_kind = 'FLEET' and s.occupancy_status = 'OCCUPIED', false)
    and (r.id is null or r.expires_at <= statement_timestamp())
    and (v.status = 'AVAILABLE' or (v.status = 'RESERVED' and r.id is not null))
  ) as is_bookable
from public.shared_vehicles v
join public.mobility_hubs h on h.id = v.hub_id
left join public.parking_spaces s on s.id = v.slot_id
left join public.vehicle_reservations r on r.vehicle_id = v.id and r.status = 'ACTIVE_HOLD'
where v.enabled;
revoke all on public.hub_shared_vehicles from public, anon, authenticated;
grant select on public.hub_shared_vehicles to anon, authenticated;

-- Called within a booking mutation by the owning role. Pickup and return
-- use the same Student lock before vehicle and parking-space locks.
create function app_private.lock_vehicle_student() returns uuid
language plpgsql set search_path = '' as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then raise exception 'UNAUTHENTICATED'; end if;
  perform 1 from public.app_users where id = actor and role = 'STUDENT' for no key update;
  if not found then raise exception 'FORBIDDEN'; end if;
  return actor;
end;
$$;

-- The caller already holds the vehicle lock and has authorized the operation.
create function app_private.close_vehicle_hold(p_id uuid, p_status text) returns void
language plpgsql set search_path = '' as $$
declare
  released_vehicle uuid;
begin
  update public.vehicle_reservations
  set status = p_status, pickup_code = null
  where id = p_id and status = 'ACTIVE_HOLD'
  returning vehicle_id into released_vehicle;

  update public.shared_vehicles set status = 'AVAILABLE'
  where id = released_vehicle and status = 'RESERVED';
end;
$$;

create function app_private.vehicle_reservation_view(
  p_reservation public.vehicle_reservations, p_at timestamptz
) returns jsonb
language sql stable set search_path = '' set timezone = 'UTC' as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'id', p_reservation.id,
    'vehicleId', p_reservation.vehicle_id,
    'vehicleCode', v.code,
    'hubId', p_reservation.hub_id,
    'hubName', h.name,
    'pickupSlotId', p_reservation.pickup_slot_id,
    'pickupSlotCode', s.code,
    'status', case
      when p_reservation.status = 'ACTIVE_HOLD' and p_reservation.expires_at <= p_at
        then 'EXPIRED'
      else p_reservation.status
    end,
    'confirmedAt', p_reservation.confirmed_at,
    'expiresAt', p_reservation.expires_at,
    'pickupCode', case
      when p_reservation.status = 'ACTIVE_HOLD' and p_reservation.expires_at > p_at
        then p_reservation.pickup_code
    end,
    'tripId', t.id,
    'tripStatus', t.status
  ))
  from public.shared_vehicles v
  join public.mobility_hubs h on h.id = p_reservation.hub_id
  join public.parking_spaces s on s.id = p_reservation.pickup_slot_id
  left join public.trips t on t.reservation_id = p_reservation.id
  where v.id = p_reservation.vehicle_id;
$$;

create function app_private.reserve_vehicle(p_vehicle_id uuid, p_request_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := app_private.lock_vehicle_student();
  reservation public.vehicle_reservations;
  vehicle public.shared_vehicles;
  held_vehicle_id uuid;
  expired_id uuid;
  check_at timestamptz;
  code text;
  entropy bytea;
begin
  if p_vehicle_id is null or p_request_id is null then
    raise exception 'INVALID_INPUT';
  end if;

  select * into reservation from public.vehicle_reservations
  where owner_id = actor and request_id = p_request_id;
  if reservation.id is not null and reservation.vehicle_id <> p_vehicle_id then
    return jsonb_build_object('error', 'REQUEST_ID_REUSED');
  end if;

  select vehicle_id into held_vehicle_id from public.vehicle_reservations
  where owner_id = actor and status = 'ACTIVE_HOLD';

  perform 1 from public.shared_vehicles
  where id in (p_vehicle_id, held_vehicle_id)
  order by id for no key update;
  check_at := clock_timestamp();

  -- Locks on the requested and previously held vehicles cover any expiry
  -- below, including an old hold on the requested vehicle by another owner.
  for expired_id in
    select id from public.vehicle_reservations
    where (owner_id = actor or vehicle_id = p_vehicle_id)
      and status = 'ACTIVE_HOLD' and expires_at <= check_at
  loop
    perform app_private.close_vehicle_hold(expired_id, 'EXPIRED');
  end loop;

  if reservation.id is not null then
    select * into reservation from public.vehicle_reservations where id = reservation.id;
    return jsonb_build_object('created', false,
      'reservation', app_private.vehicle_reservation_view(reservation, check_at));
  end if;

  select * into vehicle from public.shared_vehicles where id = p_vehicle_id;
  if not found then return jsonb_build_object('error', 'NOT_FOUND'); end if;

  if exists (select 1 from public.trips where owner_id = actor and status = 'ACTIVE') then
    return jsonb_build_object('error', 'ACTIVE_TRIP_EXISTS');
  end if;
  if exists (
    select 1 from public.vehicle_reservations where owner_id = actor and status = 'ACTIVE_HOLD'
  ) then
    return jsonb_build_object('error', 'ACTIVE_HOLD_EXISTS');
  end if;
  if not vehicle.enabled or vehicle.status <> 'AVAILABLE' or exists (
    select 1 from public.vehicle_reservations where vehicle_id = p_vehicle_id and status = 'ACTIVE_HOLD'
  ) then
    return jsonb_build_object('error', 'VEHICLE_UNAVAILABLE');
  end if;

  perform 1 from public.mobility_hubs where id = vehicle.hub_id and status = 'ACTIVE' for share;
  if not found then return jsonb_build_object('error', 'HUB_MAINTENANCE'); end if;

  perform 1 from public.parking_spaces
  where id = vehicle.slot_id and hub_id = vehicle.hub_id
    and space_kind = 'FLEET' and occupancy_status = 'OCCUPIED' and enabled
  for share;
  if not found then return jsonb_build_object('error', 'VEHICLE_UNAVAILABLE'); end if;

  -- The first six UUID v4 bytes are random. Omit easily confused characters.
  entropy := uuid_send(gen_random_uuid());
  select string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    get_byte(entropy, byte_index) % 32 + 1, 1), '' order by byte_index)
  into code
  from generate_series(0, 5) as byte_index;

  check_at := clock_timestamp();
  insert into public.vehicle_reservations (
    owner_id, vehicle_id, hub_id, pickup_slot_id, request_id, confirmed_at, expires_at, pickup_code
  ) values (
    actor, vehicle.id, vehicle.hub_id, vehicle.slot_id, p_request_id,
    check_at, check_at + interval '15 minutes', code
  ) returning * into reservation;
  update public.shared_vehicles set status = 'RESERVED' where id = vehicle.id;

  return jsonb_build_object('created', true,
    'reservation', app_private.vehicle_reservation_view(reservation, check_at));
end;
$$;

create function app_private.cancel_vehicle_reservation(p_reservation_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := app_private.lock_vehicle_student();
  reservation public.vehicle_reservations;
  check_at timestamptz;
begin
  if p_reservation_id is null then raise exception 'INVALID_INPUT'; end if;
  select * into reservation from public.vehicle_reservations
  where id = p_reservation_id and owner_id = actor;
  if not found then return jsonb_build_object('error', 'NOT_FOUND'); end if;

  perform 1 from public.shared_vehicles where id = reservation.vehicle_id for no key update;
  select * into reservation from public.vehicle_reservations where id = p_reservation_id;
  check_at := clock_timestamp();

  if reservation.status = 'ACTIVE_HOLD' and reservation.expires_at <= check_at then
    perform app_private.close_vehicle_hold(reservation.id, 'EXPIRED');
    -- Return a business error so the expiry commits before the API reports 409.
    return jsonb_build_object('error', 'RESERVATION_EXPIRED');
  end if;
  if reservation.status = 'EXPIRED' then
    return jsonb_build_object('error', 'RESERVATION_EXPIRED');
  end if;
  if reservation.status = 'FULFILLED' then
    return jsonb_build_object('error', 'INVALID_STATE');
  end if;
  if reservation.status = 'ACTIVE_HOLD' then
    perform app_private.close_vehicle_hold(reservation.id, 'CANCELLED');
    select * into reservation from public.vehicle_reservations where id = p_reservation_id;
  end if;

  return jsonb_build_object('reservation', app_private.vehicle_reservation_view(reservation, check_at));
end;
$$;

create function app_private.list_my_vehicle_reservations() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  result jsonb;
begin
  if actor is null then raise exception 'UNAUTHENTICATED'; end if;
  if not exists (select 1 from public.app_users where id = actor and role = 'STUDENT') then
    raise exception 'FORBIDDEN';
  end if;

  select coalesce(jsonb_agg(app_private.vehicle_reservation_view(r, statement_timestamp())
    order by r.confirmed_at desc, r.id), '[]'::jsonb)
  into result
  from public.vehicle_reservations r where r.owner_id = actor;
  return result;
end;
$$;

-- Only these invoker wrappers are exposed to PostgREST.
create function public.reserve_vehicle(p_vehicle_id uuid, p_request_id uuid) returns jsonb
language sql set search_path = '' as $$
  select app_private.reserve_vehicle(p_vehicle_id, p_request_id);
$$;
create function public.cancel_vehicle_reservation(p_reservation_id uuid) returns jsonb
language sql set search_path = '' as $$
  select app_private.cancel_vehicle_reservation(p_reservation_id);
$$;
create function public.list_my_vehicle_reservations() returns jsonb
language sql stable set search_path = '' as $$
  select app_private.list_my_vehicle_reservations();
$$;

revoke all on function app_private.lock_vehicle_student(),
  app_private.close_vehicle_hold(uuid, text),
  app_private.vehicle_reservation_view(public.vehicle_reservations, timestamptz),
  app_private.reserve_vehicle(uuid, uuid), app_private.cancel_vehicle_reservation(uuid),
  app_private.list_my_vehicle_reservations(), public.reserve_vehicle(uuid, uuid),
  public.cancel_vehicle_reservation(uuid), public.list_my_vehicle_reservations()
from public, anon, authenticated;

grant execute on function app_private.reserve_vehicle(uuid, uuid),
  app_private.cancel_vehicle_reservation(uuid), app_private.list_my_vehicle_reservations(),
  public.reserve_vehicle(uuid, uuid), public.cancel_vehicle_reservation(uuid),
  public.list_my_vehicle_reservations() to authenticated;

notify pgrst, 'reload schema';
commit;
