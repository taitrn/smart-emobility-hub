-- Isolated test database after migrations 001–005. All fixtures roll back.
begin;

create function pg_temp.assert_true(actual boolean, label text) returns void
language plpgsql as $$
begin
  if actual is distinct from true then raise exception 'Failed: %', label; end if;
end;
$$;

insert into auth.users (id, email) values
  ('95000000-0000-4000-8000-000000000001', 'vehicle-a@example.invalid'),
  ('95000000-0000-4000-8000-000000000002', 'vehicle-b@example.invalid'),
  ('95000000-0000-4000-8000-000000000003', 'vehicle-op@example.invalid');
update public.app_users set role = 'OPERATOR' where id = '95000000-0000-4000-8000-000000000003';

insert into public.mobility_hubs (id, code, name, latitude, longitude) values
  ('95000001-0000-4000-8000-000000000001', 'TEST-UC02', 'Vehicle reservation test', 0, 0);
insert into public.parking_spaces (id, hub_id, code, space_kind, occupancy_status) values
  ('95000002-0000-4000-8000-000000000001', '95000001-0000-4000-8000-000000000001',
    'TEST-UC02-S1', 'FLEET', 'OCCUPIED'),
  ('95000002-0000-4000-8000-000000000002', '95000001-0000-4000-8000-000000000001',
    'TEST-UC02-S2', 'FLEET', 'OCCUPIED');
insert into public.shared_vehicles (id, hub_id, slot_id, code, battery_percent) values
  ('95000003-0000-4000-8000-000000000001', '95000001-0000-4000-8000-000000000001',
    '95000002-0000-4000-8000-000000000001', 'TEST-UC02-V1', 75),
  ('95000003-0000-4000-8000-000000000002', '95000001-0000-4000-8000-000000000001',
    '95000002-0000-4000-8000-000000000002', 'TEST-UC02-V2', 50);

select set_config('test.v1', '95000003-0000-4000-8000-000000000001', true);
select set_config('test.v2', '95000003-0000-4000-8000-000000000002', true);
select set_config('test.request', gen_random_uuid()::text, true);
select set_config('request.jwt.claim.sub', '95000000-0000-4000-8000-000000000001', true);
set local role authenticated;

do $$
declare
  created jsonb := public.reserve_vehicle(current_setting('test.v1')::uuid, current_setting('test.request')::uuid);
  reservation jsonb := created->'reservation';
  replay jsonb := public.reserve_vehicle(current_setting('test.v1')::uuid, current_setting('test.request')::uuid);
begin
  perform pg_temp.assert_true(created->>'created' = 'true', 'first request creates a hold');
  perform pg_temp.assert_true(reservation->>'pickupCode' ~ '^[A-HJ-NP-Z2-9]{6}$', 'pickup code format');
  perform pg_temp.assert_true(
    (reservation->>'expiresAt')::timestamptz - (reservation->>'confirmedAt')::timestamptz = interval '15 minutes',
    'database deadline');
  perform pg_temp.assert_true(reservation->>'pickupSlotCode' = 'TEST-UC02-S1', 'pickup location');
  perform pg_temp.assert_true(replay->>'created' = 'false' and replay->'reservation' = reservation, 'retry');
  perform pg_temp.assert_true(
    public.reserve_vehicle(current_setting('test.v2')::uuid, current_setting('test.request')::uuid)->>'error'
      = 'REQUEST_ID_REUSED', 'request reused for another vehicle');
  perform pg_temp.assert_true(
    public.reserve_vehicle(current_setting('test.v2')::uuid, gen_random_uuid())->>'error' = 'ACTIVE_HOLD_EXISTS',
    'second hold');
  perform pg_temp.assert_true(public.list_my_vehicle_reservations() = jsonb_build_array(reservation), 'owner list');
  perform pg_temp.assert_true((select not is_bookable from public.hub_shared_vehicles
    where id = current_setting('test.v1')::uuid), 'held vehicle hidden from availability');
  perform pg_temp.assert_true(
    not has_column_privilege('public.vehicle_reservations', 'pickup_code', 'SELECT'), 'no direct code access');
  perform pg_temp.assert_true(
    not has_table_privilege('public.vehicle_reservations', 'INSERT, UPDATE, DELETE'), 'commands own writes');
  perform set_config('test.a_hold', reservation->>'id', true);
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '95000000-0000-4000-8000-000000000002', true);
set local role authenticated;
do $$
begin
  perform pg_temp.assert_true(public.list_my_vehicle_reservations() = '[]'::jsonb, 'isolated list');
  perform pg_temp.assert_true(not exists (select id from public.vehicle_reservations
    where id = current_setting('test.a_hold')::uuid), 'RLS isolates metadata');
  perform pg_temp.assert_true(public.cancel_vehicle_reservation(current_setting('test.a_hold')::uuid)->>'error'
    = 'NOT_FOUND', 'cannot cancel another owner hold');
  perform pg_temp.assert_true(public.reserve_vehicle(current_setting('test.v1')::uuid, gen_random_uuid())->>'error'
    = 'VEHICLE_UNAVAILABLE', 'competing student cannot reserve held vehicle');
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '95000000-0000-4000-8000-000000000001', true);
set local role authenticated;
do $$
declare
  cancelled jsonb := public.cancel_vehicle_reservation(current_setting('test.a_hold')::uuid)->'reservation';
begin
  perform pg_temp.assert_true(cancelled->>'status' = 'CANCELLED' and not (cancelled ? 'pickupCode'), 'cancel');
  perform pg_temp.assert_true(
    public.cancel_vehicle_reservation(current_setting('test.a_hold')::uuid)->'reservation' = cancelled, 'cancel retry');
  perform pg_temp.assert_true(
    (select is_bookable from public.hub_shared_vehicles where id = current_setting('test.v1')::uuid),
    'cancel releases vehicle without changing occupancy');
end;
$$;

reset role;
select set_config('request.jwt.claim.sub', '95000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select set_config('test.b_hold',
  public.reserve_vehicle(current_setting('test.v1')::uuid, gen_random_uuid())->'reservation'->>'id', true);
reset role;
update public.vehicle_reservations
set confirmed_at = statement_timestamp() - interval '16 minutes',
    expires_at = statement_timestamp() - interval '1 minute'
where id = current_setting('test.b_hold')::uuid;

set local role authenticated;
do $$
declare r jsonb := public.list_my_vehicle_reservations()->0;
begin
  perform pg_temp.assert_true(r->>'status' = 'EXPIRED' and not (r ? 'pickupCode'), 'expired view hides the code');
end;
$$;
reset role;
set local role anon;
select pg_temp.assert_true((select is_bookable from public.hub_shared_vehicles
  where id = current_setting('test.v1')::uuid), 'public availability after expiry without a write');
select pg_temp.assert_true(not has_function_privilege('public.reserve_vehicle(uuid,uuid)', 'EXECUTE'),
  'anonymous cannot execute booking');

reset role;
select set_config('request.jwt.claim.sub', '95000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select set_config('test.a_new_hold',
  public.reserve_vehicle(current_setting('test.v1')::uuid, gen_random_uuid())->'reservation'->>'id', true);
reset role;
select pg_temp.assert_true((select status = 'EXPIRED' and pickup_code is null from public.vehicle_reservations
  where id = current_setting('test.b_hold')::uuid), 'takeover persists expiry of previous hold');

select set_config('request.jwt.claim.sub', '95000000-0000-4000-8000-000000000002', true);
set local role authenticated;
select pg_temp.assert_true(public.cancel_vehicle_reservation(current_setting('test.b_hold')::uuid)->>'error'
  = 'RESERVATION_EXPIRED', 'expiry takes precedence over cancel');
select pg_temp.assert_true((select not is_bookable from public.hub_shared_vehicles
  where id = current_setting('test.v1')::uuid), 'late cancel keeps the new hold');
reset role;

update public.shared_vehicles set status = 'OUT_OF_SERVICE' where id = current_setting('test.v1')::uuid;
update public.vehicle_reservations
set confirmed_at = statement_timestamp() - interval '16 minutes',
    expires_at = statement_timestamp() - interval '1 minute'
where id = current_setting('test.a_new_hold')::uuid;
select set_config('request.jwt.claim.sub', '95000000-0000-4000-8000-000000000001', true);
set local role authenticated;
select pg_temp.assert_true(public.cancel_vehicle_reservation(current_setting('test.a_new_hold')::uuid)->>'error'
  = 'RESERVATION_EXPIRED', 'cancel persists overdue hold');
select pg_temp.assert_true((select status = 'OUT_OF_SERVICE' and not is_bookable from public.hub_shared_vehicles
  where id = current_setting('test.v1')::uuid), 'expiry preserves faulty vehicle status');
select set_config('test.a_trip_hold',
  public.reserve_vehicle(current_setting('test.v2')::uuid, gen_random_uuid())->'reservation'->>'id', true);

reset role;
update public.vehicle_reservations set status = 'FULFILLED', pickup_code = null
where id = current_setting('test.a_trip_hold')::uuid;
insert into public.trips (reservation_id, owner_id, vehicle_id, started_at)
select id, owner_id, vehicle_id, clock_timestamp() from public.vehicle_reservations
where id = current_setting('test.a_trip_hold')::uuid;
set local role authenticated;
select pg_temp.assert_true(public.reserve_vehicle(current_setting('test.v1')::uuid, gen_random_uuid())->>'error'
  = 'ACTIVE_TRIP_EXISTS', 'active trip blocks reservation');
select pg_temp.assert_true(public.list_my_vehicle_reservations()->0->>'tripStatus' = 'ACTIVE', 'trip linkage');
select pg_temp.assert_true(public.cancel_vehicle_reservation(current_setting('test.a_trip_hold')::uuid)->>'error'
  = 'INVALID_STATE', 'fulfilled hold cannot be cancelled');

reset role;
select set_config('request.jwt.claim.sub', '95000000-0000-4000-8000-000000000003', true);
set local role authenticated;
do $$
begin
  perform public.reserve_vehicle(current_setting('test.v2')::uuid, gen_random_uuid());
  raise exception 'Operator unexpectedly reserved a vehicle';
exception when raise_exception then
  if sqlerrm <> 'FORBIDDEN' then raise; end if;
end;
$$;
reset role;
rollback;
