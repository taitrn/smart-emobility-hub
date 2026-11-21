-- Run on a test database after migrations and the base seed. Fixtures roll back.
begin;
insert into auth.users(id, email) values
  ('04000000-0000-4000-8000-000000000001', 'uc04-owner@example.invalid'),
  ('04000000-0000-4000-8000-000000000002', 'uc04-other@example.invalid');

update public.parking_spaces set occupancy_status = 'FREE' where code = 'H01-S1';
update public.shared_vehicles set status = 'IN_USE', slot_id = null where code = 'EV01';
insert into public.trips(id, owner_id, vehicle_id, reservation_id)
select '04000001-0000-4000-8000-000000000001', '04000000-0000-4000-8000-000000000001',
  id, gen_random_uuid() from public.shared_vehicles where code = 'EV01';
insert into app_private.return_lock_failures(slot_id)
select id from public.parking_spaces where code = 'H02-S3';

create function pg_temp.try_return(slot_code text) returns public.trips
language sql as $$
  select public.return_fleet_vehicle(
    '04000001-0000-4000-8000-000000000001',
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
  if exists(select 1 from public.trips where id = '04000001-0000-4000-8000-000000000001') then
    raise exception 'Trip visible to a different owner';
  end if;
end; $$;
select pg_temp.expect_return_error('H03-S3', 'TRIP_NOT_FOUND');

select set_config('request.jwt.claim.sub', '04000000-0000-4000-8000-000000000001', true);
select pg_temp.expect_return_error('H02-S1', 'SLOT_BUSY');
select pg_temp.expect_return_error('H02-S4', 'INVALID_SLOT');
select pg_temp.expect_return_error('H02-S3', 'DEVICE_FAILURE');
do $$
begin
  if not exists(select 1 from public.trips where id = '04000001-0000-4000-8000-000000000001' and status = 'ACTIVE')
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
    where t.id = '04000001-0000-4000-8000-000000000001' and t.status = 'COMPLETED'
      and t.ended_at is not null and v.code = 'EV01' and v.status = 'AVAILABLE'
      and p.code = 'H03-S3' and p.occupancy_status = 'OCCUPIED'
  ) then raise exception 'Successful return did not update trip, vehicle and slot'; end if;
end; $$;
rollback;
