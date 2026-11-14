-- Isolated test DB only. Apply migrations 001-004 first. Fixtures roll back.
begin;
create function pg_temp.expect_error(statement text,expected text) returns void language plpgsql as $$begin
 begin execute statement;exception when others then if position(expected in sqlerrm)>0 then return;end if;raise;end;
 raise exception 'Expected failure: %',expected;end;$$;
insert into auth.users(id) values('97000000-0000-4000-8000-000000000001'),('97000000-0000-4000-8000-000000000002'),('97000000-0000-4000-8000-000000000003');
update public.app_users set role='OPERATOR' where id='97000000-0000-4000-8000-000000000003';
insert into public.private_vehicles(id,owner_id,plate_number) values('97000001-0000-4000-8000-000000000001','97000000-0000-4000-8000-000000000001','REVIEW-A'),('97000001-0000-4000-8000-000000000002','97000000-0000-4000-8000-000000000002','REVIEW-B');
select set_config('request.jwt.claim.sub','97000000-0000-4000-8000-000000000001',true);
set local role authenticated;
select set_config('test.input',jsonb_build_object('requestId',gen_random_uuid(),'privateVehicleId','97000001-0000-4000-8000-000000000001','slotId','00000002-0000-4000-8000-000000000004','start',now()+interval '1 hour','end',now()+interval '2 hours')::text,true);
select set_config('test.result',public.parking_command('RESERVE',current_setting('test.input')::jsonb)::text,true);
do $$begin if public.parking_command('RESERVE',current_setting('test.input')::jsonb)<>current_setting('test.result')::jsonb then raise exception 'Retry was not identical';end if;end;$$;
set local timezone='Asia/Bangkok';
do $$begin if public.parking_command('RESERVE',current_setting('test.input')::jsonb)<>current_setting('test.result')::jsonb then raise exception 'Retry changed across DB timezone';end if;end;$$;
set local timezone='UTC';
select pg_temp.expect_error($q$select public.parking_command('RESERVE',current_setting('test.input')::jsonb||jsonb_build_object('end',now()+interval '3 hours'))$q$,'REQUEST_ID_REUSED');
select pg_temp.expect_error($q$select public.parking_command('RESERVE',current_setting('test.input')::jsonb||jsonb_build_object('requestId',gen_random_uuid(),'end',now()+interval '400 days'))$q$,'INVALID_INPUT');
select pg_temp.expect_error($q$select public.parking_command('RESERVE',current_setting('test.input')::jsonb||jsonb_build_object('requestId',gen_random_uuid(),'start',now()+interval '31 days','end',now()+interval '31 days 1 hour'))$q$,'INVALID_INPUT');
select pg_temp.expect_error($q$select public.parking_command('RESERVE',current_setting('test.input')::jsonb||jsonb_build_object('requestId',gen_random_uuid(),'privateVehicleId','97000001-0000-4000-8000-000000000002'))$q$,'OWNERSHIP_REQUIRED');
do $$begin if (public.parking_list()->>'total')::int<>1 then raise exception 'Owner list mismatch';end if;end;$$;
reset role;
select set_config('request.jwt.claim.sub','97000000-0000-4000-8000-000000000002',true);
set local role authenticated;
select pg_temp.expect_error($q$select public.parking_list(21,0,null)$q$,'INVALID_INPUT');
select pg_temp.expect_error($q$select public.parking_list(null,0,null)$q$,'INVALID_INPUT');
do $$begin if (public.parking_list()->>'total')::int<>0 then raise exception 'Other student list leak';end if;end;$$;
select pg_temp.expect_error($q$select public.parking_command('CANCEL',jsonb_build_object('reservationId',current_setting('test.result')::jsonb->>'id'))$q$,'OWNERSHIP_REQUIRED');
-- A second Student owns a vehicle and can reuse the same requestId in their own namespace.
do $$declare r jsonb;begin
 r:=public.parking_command('RESERVE',current_setting('test.input')::jsonb||jsonb_build_object('privateVehicleId','97000001-0000-4000-8000-000000000002','slotId','00000002-0000-4000-8000-000000000008'));
 if r->>'id'=current_setting('test.result')::jsonb->>'id' then raise exception 'Cross-owner retry leak';end if;
 if (public.parking_list()->>'total')::int<>1 then raise exception 'Second student isolation failed';end if;
end;$$;

reset role;
select set_config('request.jwt.claim.sub','97000000-0000-4000-8000-000000000003',true);
set local role authenticated;
do $$begin if not exists(select 1 from jsonb_array_elements(public.parking_list()->'reservations') v where v->>'plate_number'='REVIEW-A') then raise exception 'Operator missing vehicle';end if;end;$$;
select pg_temp.expect_error($q$select public.parking_command('RESERVE',current_setting('test.input')::jsonb)$q$,'FORBIDDEN');
reset role;
rollback;
