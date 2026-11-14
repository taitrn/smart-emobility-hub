-- The shared project has already applied this revoke manually.
-- Some new/local projects do not install the optional RLS event trigger.
begin;
do $$
begin
 if to_regprocedure('public.rls_auto_enable()') is not null then
  if (select prorettype from pg_proc where oid=to_regprocedure('public.rls_auto_enable()')) <> 'event_trigger'::regtype then
   raise exception 'rls_auto_enable exists but is not an event trigger function; inspect before changing privileges';
  end if;
  revoke execute on function public.rls_auto_enable() from public,anon,authenticated;
 end if;
end; $$;
commit;
