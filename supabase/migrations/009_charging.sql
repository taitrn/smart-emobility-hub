-- Apply once after 001. Charging mutations are serialized by a single RPC.
begin;

create table public.charging_sessions (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.app_users(id),
  vehicle_kind text not null check(vehicle_kind in ('SHARED','PRIVATE')),
  shared_vehicle_id uuid references public.shared_vehicles(id),
  private_vehicle_id uuid references public.private_vehicles(id),
  hub_id uuid not null references public.mobility_hubs(id),
  charging_point_id uuid references public.charging_points(id),
  battery_percent integer not null check(battery_percent between 0 and 100),
  desired_departure_at timestamptz,
  priority text not null check(priority in ('HIGH','NORMAL')),
  status text not null default 'WAITING'
    check(status in ('WAITING','CHARGING','COMPLETED','FAILED','CANCELLED')),
  request_id uuid,
  request_payload jsonb,
  created_at timestamptz not null default clock_timestamp(),
  updated_at timestamptz not null default clock_timestamp(),
  check(
    (vehicle_kind='SHARED' and shared_vehicle_id is not null and private_vehicle_id is null)
    or
    (vehicle_kind='PRIVATE' and private_vehicle_id is not null and shared_vehicle_id is null)
  )
);

create unique index charging_one_request_per_owner
  on public.charging_sessions(requester_id,request_id)
  where request_id is not null;
create index charging_queue_index
  on public.charging_sessions(hub_id,status,priority,created_at,id);
create unique index charging_one_point_session
  on public.charging_sessions(charging_point_id)
  where status='CHARGING';
create unique index charging_one_active_shared_vehicle
  on public.charging_sessions(shared_vehicle_id)
  where shared_vehicle_id is not null and status in ('WAITING','CHARGING');
create unique index charging_one_active_private_vehicle
  on public.charging_sessions(private_vehicle_id)
  where private_vehicle_id is not null and status in ('WAITING','CHARGING');

alter table public.charging_sessions enable row level security;
revoke all on public.charging_sessions from public,anon,authenticated;
grant select on public.charging_sessions to authenticated;

create policy charging_read on public.charging_sessions
  for select to authenticated
  using(requester_id=(select auth.uid()) or (select app_private.is_operator()));

create function public.charging_command(p_action text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  actor uuid := auth.uid();
  actor_role text;
  rid uuid;
  payload jsonb;
  existing public.charging_sessions;
  session public.charging_sessions;
  shared public.shared_vehicles;
  private_v public.private_vehicles;
  hub public.mobility_hubs;
  point public.charging_points;
  requested_hub uuid;
  battery integer;
  departure timestamptz;
  priority text;
  now_at timestamptz := clock_timestamp();
  result jsonb;
  processed integer := 0;
begin
  if actor is null then raise exception 'UNAUTHENTICATED'; end if;
  select role into actor_role from public.app_users where id=actor;
  if actor_role is null then raise exception 'FORBIDDEN'; end if;

  perform pg_catalog.pg_advisory_xact_lock(502606::bigint);

  if p_action='REQUEST' then
    if actor_role is distinct from 'STUDENT' then raise exception 'FORBIDDEN'; end if;
    rid := nullif(p_payload->>'requestId','')::uuid;
    if rid is null then raise exception 'INVALID_INPUT'; end if;

    payload := jsonb_build_object(
      'vehicleId',(p_payload->>'vehicleId')::uuid,
      'vehicleKind',p_payload->>'vehicleKind',
      'hubId',(p_payload->>'hubId')::uuid,
      'desiredDepartureAt',p_payload->>'desiredDepartureAt'
    );
    select * into existing
      from public.charging_sessions
      where requester_id=actor and request_id=rid;
    if found then
      if existing.request_payload is distinct from payload then
        raise exception 'REQUEST_ID_REUSED';
      end if;
      return jsonb_build_object('id',existing.id,'status',existing.status);
    end if;

    requested_hub := (p_payload->>'hubId')::uuid;
    select * into hub
      from public.mobility_hubs
      where id=requested_hub;
    if hub.id is null then raise exception 'NOT_FOUND'; end if;
    if hub.status distinct from 'ACTIVE' then raise exception 'HUB_MAINTENANCE'; end if;

    if p_payload->>'vehicleKind'='SHARED' then
      select * into shared
        from public.shared_vehicles
        where id=(p_payload->>'vehicleId')::uuid
        for update;
      if shared.id is null then raise exception 'NOT_FOUND'; end if;
      if shared.hub_id<>requested_hub then raise exception 'OWNERSHIP_REQUIRED'; end if;
      if shared.status distinct from 'AVAILABLE' or not shared.enabled then
        raise exception 'VEHICLE_INELIGIBLE';
      end if;
      if exists(
        select 1
        from public.charging_sessions
        where shared_vehicle_id=shared.id
          and status in ('WAITING','CHARGING')
      ) then raise exception 'VEHICLE_INELIGIBLE'; end if;
      battery := shared.battery_percent;
    elsif p_payload->>'vehicleKind'='PRIVATE' then
      select * into private_v
        from public.private_vehicles
        where id=(p_payload->>'vehicleId')::uuid;
      if private_v.id is null then raise exception 'NOT_FOUND'; end if;
      if private_v.owner_id<>actor then raise exception 'OWNERSHIP_REQUIRED'; end if;
      if exists(
        select 1
        from public.charging_sessions
        where private_vehicle_id=private_v.id
          and status in ('WAITING','CHARGING')
      ) then raise exception 'VEHICLE_INELIGIBLE'; end if;
      battery := private_v.battery_percent;
    else
      raise exception 'INVALID_INPUT';
    end if;

    departure := nullif(p_payload->>'desiredDepartureAt','')::timestamptz;
    if departure is not null and departure < now_at then
      raise exception 'RESERVATION_BLOCKED';
    end if;
    if battery<=20 or (departure is not null and departure-now_at between interval '0 minutes' and interval '60 minutes') then
      priority := 'HIGH';
    else
      priority := 'NORMAL';
    end if;

    insert into public.charging_sessions(
      requester_id,vehicle_kind,shared_vehicle_id,private_vehicle_id,hub_id,
      battery_percent,desired_departure_at,priority,status,request_id,request_payload
    ) values (
      actor,
      p_payload->>'vehicleKind',
      case when p_payload->>'vehicleKind'='SHARED' then (p_payload->>'vehicleId')::uuid else null end,
      case when p_payload->>'vehicleKind'='PRIVATE' then (p_payload->>'vehicleId')::uuid else null end,
      requested_hub,battery,departure,priority,'WAITING',rid,payload
    ) returning * into session;

    if p_payload->>'vehicleKind'='SHARED' then
      update public.shared_vehicles
        set status='WAITING_CHARGE'
        where id=shared.id and status='AVAILABLE';
    end if;

    return jsonb_build_object('id',session.id,'status',session.status);
  elsif p_action='PROCESS' then
    if actor_role is distinct from 'OPERATOR' then raise exception 'FORBIDDEN'; end if;

    for session in
      select s.*
      from public.charging_sessions s
      where s.status='WAITING'
      order by s.priority='NORMAL',s.created_at,s.id
      for update of s
    loop
      perform 1 from public.mobility_hubs
      where id = session.hub_id and status = 'ACTIVE' for share;
      if not found then continue; end if;

      select p.*
        into point
        from public.charging_points p
        where p.hub_id=session.hub_id
          and p.enabled
          and p.status='AVAILABLE'
        order by p.code
        for update
        limit 1;
      if point.id is not null then
        update public.charging_points
          set status='IN_USE'
          where id=point.id;
        update public.charging_sessions
          set status='CHARGING',charging_point_id=point.id,updated_at=now_at
          where id=session.id;
        if session.vehicle_kind='SHARED' then
          update public.shared_vehicles
            set status='CHARGING'
            where id=session.shared_vehicle_id;
        end if;
        processed := processed+1;
      end if;
    end loop;

    return jsonb_build_object('processed',processed);
  elsif p_action='COMPLETE' then
    if actor_role is distinct from 'OPERATOR' then raise exception 'FORBIDDEN'; end if;
    select * into session
      from public.charging_sessions
      where id=(p_payload->>'sessionId')::uuid
      for update;
    if session.id is null then raise exception 'NOT_FOUND'; end if;
    if session.status distinct from 'CHARGING' then raise exception 'INVALID_STATE'; end if;

    select * into point
      from public.charging_points
      where id=session.charging_point_id
      for update;
    update public.charging_points
      set status='AVAILABLE'
      where id=point.id;
    update public.charging_sessions
      set status='COMPLETED',updated_at=now_at
      where id=session.id;
    if session.vehicle_kind='SHARED' then
      update public.shared_vehicles
        set status='AVAILABLE'
        where id=session.shared_vehicle_id;
    end if;

    return jsonb_build_object(
      'id',session.id,
      'status','COMPLETED',
      'chargingPointId',session.charging_point_id
    );
  else
    raise exception 'INVALID_INPUT';
  end if;
end;
$$;

revoke all on function public.charging_command(text,jsonb) from public,anon;
grant execute on function public.charging_command(text,jsonb) to authenticated;

create function public.charging_list(p_status text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  actor_role text;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  select role into actor_role from public.app_users where id=auth.uid();
  if actor_role is null then raise exception 'FORBIDDEN'; end if;
  if p_status is not null and p_status not in ('WAITING','CHARGING','COMPLETED','FAILED','CANCELLED') then
    raise exception 'INVALID_INPUT';
  end if;

  return (
    select jsonb_agg(to_jsonb(rows))
    from (
      select s.id,s.requester_id,s.vehicle_kind,s.shared_vehicle_id,s.private_vehicle_id,
        s.hub_id,s.charging_point_id,s.battery_percent,s.desired_departure_at,
        s.priority,s.status,s.created_at,s.updated_at,
        h.code as hub_code,h.name as hub_name,
        p.code as charging_point_code,
        case
          when s.vehicle_kind='SHARED' then v.code
          else pv.plate_number
        end as vehicle_code
      from public.charging_sessions s
      join public.mobility_hubs h on h.id=s.hub_id
      left join public.charging_points p on p.id=s.charging_point_id
      left join public.shared_vehicles v on v.id=s.shared_vehicle_id
      left join public.private_vehicles pv on pv.id=s.private_vehicle_id
      where (actor_role='OPERATOR' or s.requester_id=auth.uid())
        and (p_status is null or s.status=p_status)
      order by
        s.priority='NORMAL',s.created_at,s.id
    ) rows
  );
end;
$$;

revoke all on function public.charging_list(text) from public,anon;
grant execute on function public.charging_list(text) to authenticated;

commit;
