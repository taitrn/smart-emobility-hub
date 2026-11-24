-- Run on a test database after migrations and the base seed. Fixtures roll back.
begin;
insert into auth.users(id, email) values
  ('04000000-0000-4000-8000-000000000001', 'uc04-owner@example.invalid'),
  ('04000000-0000-4000-8000-000000000002', 'uc04-other@example.invalid');

select set_config('request.jwt.claim.sub', '04000000-0000-4000-8000-000000000001', true);
set local role authenticated;
with hold as (
  select public.reserve_vehicle(
    (select id from public.shared_vehicles where code = 'EV01'), gen_random_uuid()
  )->'reservation' as reservation
)
select set_config('test.return_trip_id', public.pickup_command(
  (reservation->>'id')::uuid, reservation->>'pickupCode'
)->'trip'->>'id', true) from hold;
reset role;
update public.mobility_hubs set status = 'MAINTENANCE' where code = 'H01';
insert into app_private.return_lock_failures(slot_id)
select id from public.parking_spaces where code = 'H02-S3';

create function pg_temp.try_return(slot_code text) returns public.trips
language sql as $$
  select public.return_fleet_vehicle(
    current_setting('test.return_trip_id')::uuid,
    (select hub_id from public.parking_spaces where code = slot_code),
    (select id from public.parking_spaces where code = slot_code)
  );
$$;

create function pg_temp.expect_return_error(slot_code text, expected text) returns void
language plpgsql as $$
begin
  begin
    perform pg_temp.try_return(slot_code);
  exception when others then
    if sqlerrm = expected then return; end if;
    raise;
  end;
  raise exception 'Expected % for %', expected, slot_code;
end;
$$;

select set_config('request.jwt.claim.sub', '04000000-0000-4000-8000-000000000002', true);
set local role authenticated;
do $$
begin
  if exists(select 1 from public.trips where id = current_setting('test.return_trip_id')::uuid) then
    raise exception 'Trip visible to a different owner';
  end if;
end; $$;
select pg_temp.expect_return_error('H03-S3', 'TRIP_NOT_FOUND');

select set_config('request.jwt.claim.sub', '04000000-0000-4000-8000-000000000001', true);
select pg_temp.expect_return_error('H01-S3', 'HUB_MAINTENANCE');
select pg_temp.expect_return_error('H02-S1', 'SLOT_BUSY');
select pg_temp.expect_return_error('H02-S4', 'INVALID_SLOT');
select pg_temp.expect_return_error('H02-S3', 'DEVICE_FAILURE');
do $$
begin
  if not exists(select 1 from public.trips where id = current_setting('test.return_trip_id')::uuid and status = 'ACTIVE')
    or not exists(select 1 from public.shared_vehicles where code = 'EV01' and status = 'IN_USE' and slot_id is null)
    or not exists(select 1 from public.parking_spaces where code = 'H02-S3' and occupancy_status = 'FREE') then
    raise exception 'A rejected return changed trip, vehicle or slot';
  end if;
end; $$;

select pg_temp.try_return('H03-S3');
select pg_temp.expect_return_error('H01-S3', 'INVALID_STATE');
do $$
begin
  if not exists(
    select 1 from public.trips t
    join public.shared_vehicles v on v.id = t.vehicle_id and v.slot_id = t.return_slot_id
    join public.parking_spaces p on p.id = v.slot_id and p.hub_id = v.hub_id and p.hub_id = t.return_hub_id
    where t.id = current_setting('test.return_trip_id')::uuid and t.status = 'COMPLETED'
      and t.ended_at is not null and v.code = 'EV01' and v.status = 'AVAILABLE'
      and p.code = 'H03-S3' and p.occupancy_status = 'OCCUPIED'
  ) then raise exception 'Successful return did not update trip, vehicle and slot'; end if;
end; $$;
rollback;
