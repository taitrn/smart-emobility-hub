-- Run after migration in SQL Editor. No persistent test users or rows.
begin;
insert into auth.users(id, email) values
 ('99000000-0000-4000-8000-000000000001','rls-student@example.invalid'),
 ('99000000-0000-4000-8000-000000000002','rls-operator@example.invalid');
update public.app_users set role='OPERATOR' where id='99000000-0000-4000-8000-000000000002';
insert into public.mobility_hubs(id,code,name,latitude,longitude) values
 ('99000000-0000-4000-8000-000000000003','TEST-RLS','Test Hub',0,0);
set local role anon;
do $$ begin
 if not exists(select 1 from public.mobility_hubs where code='TEST-RLS') then raise exception 'Public read failed'; end if;
 begin perform * from public.app_users; raise exception 'Anon accessed profiles'; exception when insufficient_privilege then null; end;
end $$;
reset role;
select set_config('request.jwt.claim.sub','99000000-0000-4000-8000-000000000001',true);
set local role authenticated;
do $$ begin
 if (select count(*) from public.app_users) <> 1 then raise exception 'Profile owner isolation failed'; end if;
 begin update public.app_users set role='OPERATOR'; raise exception 'Student escalated role'; exception when insufficient_privilege then null; end;
 update public.mobility_hubs set name='BAD' where code='TEST-RLS';
 if found then raise exception 'Student changed resources'; end if;
end $$;
reset role;
select set_config('request.jwt.claim.sub','99000000-0000-4000-8000-000000000002',true);
set local role authenticated;
do $$ begin
 update public.mobility_hubs set name='Operator updated' where code='TEST-RLS';
 if not found then raise exception 'Operator could not update resource'; end if;
end $$;
reset role;
rollback;
