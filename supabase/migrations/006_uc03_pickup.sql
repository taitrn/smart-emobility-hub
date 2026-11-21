
-- UC03: Unlock and Pick Up Vehicle
-- Dependencies:
-- 001_auth_and_resources.sql
-- UC02: public.vehicle_reservations
-- UC04: public.trips
--
-- Expected reservation columns:
-- id, owner_id, vehicle_id, hub_id, pickup_code, expires_at, status
--
-- Apply only after dependency schemas are available.

begin;

create table if not exists app_private.pickup_lock_failures (
  vehicle_id uuid primary key
    references public.shared_vehicles(id) on delete cascade
);

revoke all on app_private.pickup_lock_failures
from public, anon, authenticated;

create or replace function public.pickup_command(
  p_reservation_id uuid,
  p_pickup_code text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_role text;
  v_reservation public.vehicle_reservations%rowtype;
  v_vehicle public.shared_vehicles%rowtype;
  v_slot public.parking_spaces%rowtype;
  v_trip public.trips%rowtype;
  v_command_id uuid := gen_random_uuid();
  v_now timestamptz;
begin
  if v_actor is null then
    raise exception using
      errcode = 'PT401',
      message = 'UNAUTHENTICATED';
  end if;

  select role into v_role
  from public.app_users
  where id = v_actor;

  if v_role is distinct from 'STUDENT' then
    raise exception using
      errcode = 'PT403',
      message = 'FORBIDDEN';
  end if;

  if p_reservation_id is null
     or p_pickup_code is null
     or p_pickup_code !~ '^[A-Z2-7]{12,64}$' then
    raise exception using
      errcode = 'PT400',
      message = 'INVALID_INPUT';
  end if;

  select *
  into v_reservation
  from public.vehicle_reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception using
      errcode = 'PT404',
      message = 'NOT_FOUND';
  end if;

  if v_reservation.owner_id is distinct from v_actor then
    raise exception using
      errcode = 'PT403',
      message = 'OWNERSHIP_REQUIRED';
  end if;

  if v_reservation.status is distinct from 'ACTIVE_HOLD' then
    raise exception using
      errcode = 'PT409',
      message = 'INVALID_STATE';
  end if;

  v_now := clock_timestamp();

  if v_reservation.expires_at is null
     or v_reservation.expires_at <= v_now then
    raise exception using
      errcode = 'PT409',
      message = 'RESERVATION_EXPIRED';
  end if;

  if v_reservation.pickup_code is distinct from p_pickup_code then
    raise exception using
      errcode = 'PT409',
      message = 'RESERVATION_BLOCKED';
  end if;

  select *
  into v_vehicle
  from public.shared_vehicles
  where id = v_reservation.vehicle_id
  for update;

  if not found
     or v_vehicle.enabled is distinct from true
     or v_vehicle.status is distinct from 'RESERVED'
     or v_vehicle.hub_id is distinct from v_reservation.hub_id then
    raise exception using
      errcode = 'PT409',
      message = 'VEHICLE_UNAVAILABLE';
  end if;

  if not exists (
    select 1
    from public.mobility_hubs
    where id = v_vehicle.hub_id
      and status = 'ACTIVE'
  ) then
    raise exception using
      errcode = 'PT409',
      message = 'HUB_MAINTENANCE';
  end if;

  if v_vehicle.slot_id is null then
    raise exception using
      errcode = 'PT409',
      message = 'INVALID_STATE';
  end if;

  select *
  into v_slot
  from public.parking_spaces
  where id = v_vehicle.slot_id
  for update;

  if not found
     or v_slot.hub_id is distinct from v_vehicle.hub_id
     or v_slot.space_kind is distinct from 'FLEET'
     or v_slot.enabled is distinct from true
     or v_slot.occupancy_status is distinct from 'OCCUPIED' then
    raise exception using
      errcode = 'PT409',
      message = 'INVALID_STATE';
  end if;

  if exists (
    select 1
    from public.trips
    where reservation_id = v_reservation.id
  ) then
    raise exception using
      errcode = 'PT409',
      message = 'INVALID_STATE';
  end if;

  -- Simulated device failure: no business state changes.
  if exists (
    select 1
    from app_private.pickup_lock_failures
    where vehicle_id = v_vehicle.id
  ) then
    raise exception using
      errcode = 'PT503',
      message = 'DEVICE_FAILURE';
  end if;

  -- A successful simulated unlock starts the trip.
  insert into public.trips (
    owner_id,
    vehicle_id,
    reservation_id,
    status,
    started_at
  )
  values (
    v_actor,
    v_vehicle.id,
    v_reservation.id,
    'ACTIVE',
    v_now
  )
  returning * into v_trip;

  update public.vehicle_reservations
  set status = 'FULFILLED'
  where id = v_reservation.id;

  update public.shared_vehicles
  set status = 'IN_USE',
      slot_id = null
  where id = v_vehicle.id;

  update public.parking_spaces
  set occupancy_status = 'FREE'
  where id = v_slot.id;

  return jsonb_build_object(
    'command', jsonb_build_object(
      'id', v_command_id,
      'kind', 'PICKUP',
      'state', 'SUCCESS',
      'resultId', v_trip.id,
      'updatedAt', v_now
    ),
    'trip', jsonb_build_object(
      'id', v_trip.id,
      'vehicleId', v_trip.vehicle_id,
      'reservationId', v_trip.reservation_id,
      'status', v_trip.status,
      'startedAt', v_trip.started_at
    )
  );
end;
$$;

revoke all on function public.pickup_command(uuid, text)
from public, anon, authenticated;

grant execute on function public.pickup_command(uuid, text)
to authenticated;

commit;
