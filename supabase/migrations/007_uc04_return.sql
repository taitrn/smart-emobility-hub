-- Requires the trips table from UC02.
begin;
-- A privileged demo fixture can mark a slot's simulated lock as failing.
create table app_private.return_lock_failures (
  slot_id uuid primary key references public.parking_spaces(id) on delete cascade
);
revoke all on app_private.return_lock_failures from public, anon, authenticated;

create function public.return_fleet_vehicle(p_trip_id uuid, p_hub_id uuid, p_slot_id uuid)
returns public.trips
language plpgsql security definer set search_path = '' as $$
declare
  caller_id uuid := auth.uid();
  trip public.trips%rowtype;
  vehicle public.shared_vehicles%rowtype;
  slot public.parking_spaces%rowtype;
begin
  if not exists (select 1 from public.app_users where id = caller_id and role = 'STUDENT') then
    raise exception using errcode = 'PT403', message = 'FORBIDDEN';
  end if;

  perform app_private.lock_vehicle_student();

  select * into trip from public.trips
    where id = p_trip_id and owner_id = caller_id for update;
  if not found then
    raise exception using errcode = 'PT404', message = 'TRIP_NOT_FOUND';
  end if;
  if trip.status <> 'ACTIVE' then
    raise exception using errcode = 'PT409', message = 'INVALID_STATE';
  end if;

  select * into vehicle from public.shared_vehicles where id = trip.vehicle_id for update;
  if vehicle.status <> 'IN_USE' or vehicle.slot_id is not null then
    raise exception using errcode = 'PT409', message = 'INVALID_STATE';
  end if;

  perform 1 from public.mobility_hubs
    where id = p_hub_id and status = 'ACTIVE' for share;
  if not found then
    raise exception using errcode = 'PT409', message = 'HUB_MAINTENANCE';
  end if;

  select * into slot from public.parking_spaces where id = p_slot_id for update;
  if not found or slot.hub_id is distinct from p_hub_id or slot.space_kind <> 'FLEET' then
    raise exception using errcode = 'PT400', message = 'INVALID_SLOT';
  end if;
  if not slot.enabled or slot.occupancy_status <> 'FREE'
    or exists (select 1 from public.shared_vehicles where slot_id = slot.id) then
    raise exception using errcode = 'PT409', message = 'SLOT_BUSY';
  end if;

  if exists (select 1 from app_private.return_lock_failures where slot_id = slot.id) then
    raise exception using errcode = 'PT503', message = 'DEVICE_FAILURE';
  end if;

  update public.parking_spaces set occupancy_status = 'OCCUPIED' where id = slot.id;
  update public.shared_vehicles set hub_id = slot.hub_id, slot_id = slot.id, status = 'AVAILABLE'
    where id = vehicle.id;
  update public.trips set status = 'COMPLETED', ended_at = clock_timestamp(),
    return_hub_id = slot.hub_id, return_slot_id = slot.id
    where id = trip.id returning * into trip;
  return trip;
end;
$$;
revoke all on function public.return_fleet_vehicle(uuid, uuid, uuid) from public, anon, authenticated;
grant execute on function public.return_fleet_vehicle(uuid, uuid, uuid) to authenticated;

commit;
