-- Run after migrations 001/002 on a test project only. All fixtures roll back.
begin;
create function pg_temp.expect_error(statement text, expected text) returns void language plpgsql as $$
begin
 begin execute statement; exception when others then
  if position(expected in sqlerrm)>0 then return; end if; raise;
 end;
 raise exception 'Expected error: %', expected;
end; $$;
insert into auth.users(id,email) values
 ('98000000-0000-4000-8000-000000000001','parking-test-a@example.invalid'),
 ('98000000-0000-4000-8000-000000000002','parking-test-b@example.invalid'),
 ('98000000-0000-4000-8000-000000000003','parking-test-op@example.invalid');
update public.app_users set role='OPERATOR' where id='98000000-0000-4000-8000-000000000003';
insert into public.mobility_hubs(id,code,name,latitude,longitude) values('98000001-0000-4000-8000-000000000001','TEST-PARK','Test',0,0);
insert into public.parking_spaces(id,hub_id,code,space_kind) values('98000002-0000-4000-8000-000000000001','98000001-0000-4000-8000-000000000001','TEST-P1','PRIVATE');
insert into public.private_vehicles(id,owner_id,plate_number) values('98000003-0000-4000-8000-000000000001','98000000-0000-4000-8000-000000000001','TEST-PARK-A');
insert into public.parking_spaces(id,hub_id,code,space_kind) values('98000002-0000-4000-8000-000000000002','98000001-0000-4000-8000-000000000001','TEST-P2','PRIVATE');
select set_config('request.jwt.claim.sub','98000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select set_config('test.parking_input',jsonb_build_object('privateVehicleId','98000003-0000-4000-8000-000000000001','slotId','98000002-0000-4000-8000-000000000001','start',clock_timestamp()+interval '1 hour','end',clock_timestamp()+interval '2 hours')::text,true);
select pg_temp.expect_error($q$select public.parking_command('RESERVE',current_setting('test.parking_input')::jsonb || jsonb_build_object('end',(current_setting('test.parking_input')::jsonb->>'start')::timestamptz+interval '29 minutes'))$q$,'INVALID_INPUT');
select set_config('test.parking_id',(public.parking_command('RESERVE',current_setting('test.parking_input')::jsonb)->>'id'),true);
select pg_temp.expect_error($q$select public.parking_command('RESERVE',current_setting('test.parking_input')::jsonb)$q$,'PARKING_OVERLAP');
do $$begin
 if (select occupancy_status from public.parking_spaces where code='TEST-P1')<>'FREE' then raise exception 'Future reservation changed occupancy'; end if;
end;$$;
reset role;
select set_config('request.jwt.claim.sub','98000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$begin
 if exists(select 1 from public.parking_reservations where id=current_setting('test.parking_id')::uuid) then raise exception 'RLS leaked another owner reservation'; end if;
end;$$;
select pg_temp.expect_error($q$select public.parking_command('CANCEL',jsonb_build_object('reservationId',current_setting('test.parking_id')))$q$,'OWNERSHIP_REQUIRED');
select pg_temp.expect_error($q$select public.parking_command('ARRIVED',jsonb_build_object('reservationId',current_setting('test.parking_id')))$q$,'FORBIDDEN');
reset role;
update public.parking_reservations set starts_at=clock_timestamp()-interval '1 minute',ends_at=clock_timestamp()+interval '29 minutes' where id=current_setting('test.parking_id')::uuid;
select set_config('request.jwt.claim.sub','98000000-0000-4000-8000-000000000003',true);
set local role authenticated;
select public.parking_command('ARRIVED',jsonb_build_object('reservationId',current_setting('test.parking_id')));
do $$begin if (select occupancy_status from public.parking_spaces where code='TEST-P1')<>'OCCUPIED' then raise exception 'Arrival failed';end if;end;$$;
select pg_temp.expect_error($q$select public.parking_command('ARRIVED',jsonb_build_object('reservationId',current_setting('test.parking_id')))$q$,'INVALID_STATE');
select public.parking_command('DEPARTED',jsonb_build_object('reservationId',current_setting('test.parking_id')));
do $$begin if (select occupancy_status from public.parking_spaces where code='TEST-P1')<>'FREE' then raise exception 'Departure failed';end if;end;$$;
-- The negative helper must reject a statement that unexpectedly succeeds.
select pg_temp.expect_error($q$select pg_temp.expect_error('select 1','FORBIDDEN')$q$,'Expected error: FORBIDDEN');
-- Operator cannot reserve, even when invoking RPC directly.
select pg_temp.expect_error($q$select public.parking_command('RESERVE',current_setting('test.parking_input')::jsonb)$q$,'FORBIDDEN');
reset role;
select set_config('request.jwt.claim.sub','98000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select set_config('test.parking_id',(public.parking_command('RESERVE',current_setting('test.parking_input')::jsonb)->>'id'),true);
-- Same vehicle, different slot must still conflict.
select pg_temp.expect_error($q$select public.parking_command('RESERVE',current_setting('test.parking_input')::jsonb || jsonb_build_object('slotId','98000002-0000-4000-8000-000000000002'))$q$,'PARKING_OVERLAP');
-- Adjacent half-open intervals are allowed.
select public.parking_command('RESERVE',current_setting('test.parking_input')::jsonb || jsonb_build_object('start',current_setting('test.parking_input')::jsonb->>'end','end',(current_setting('test.parking_input')::jsonb->>'end')::timestamptz+interval '1 hour'));
select public.parking_command('CANCEL',jsonb_build_object('reservationId',current_setting('test.parking_id')));
-- The cancelled range is available again.
select public.parking_command('RESERVE',current_setting('test.parking_input')::jsonb);
select pg_temp.expect_error($q$insert into public.parking_reservations(owner_id,private_vehicle_id,slot_id,starts_at,ends_at) values(auth.uid(),'98000003-0000-4000-8000-000000000001','98000002-0000-4000-8000-000000000001',now(),now()+interval '1 hour')$q$,'permission denied');
select pg_temp.expect_error($q$select public.parking_command('RESERVE',current_setting('test.parking_input')::jsonb || jsonb_build_object('start',now()-interval '1 minute'))$q$,'INVALID_INPUT');
reset role;
set local role anon;
select pg_temp.expect_error($q$select public.parking_command('RESERVE','{}'::jsonb)$q$,'permission denied');
reset role;
rollback;
