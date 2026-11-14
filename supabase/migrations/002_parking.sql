-- Review first; run once after 001. No changes to existing demo accounts/data.
begin;
create table public.parking_reservations (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.app_users,
 private_vehicle_id uuid not null references public.private_vehicles, slot_id uuid not null references public.parking_spaces,
 starts_at timestamptz not null, ends_at timestamptz not null,
 status text not null default 'CONFIRMED' check(status in ('CONFIRMED','CHECKED_IN','COMPLETED','CANCELLED')),
 check(starts_at + interval '30 minutes' <= ends_at)
);
create index on public.parking_reservations(slot_id,starts_at,ends_at);
create index on public.parking_reservations(private_vehicle_id,starts_at,ends_at);
alter table public.parking_reservations enable row level security;
revoke all on public.parking_reservations from public,anon,authenticated;
grant select on public.parking_reservations to authenticated;
create policy parking_read on public.parking_reservations for select to authenticated
 using(owner_id=(select auth.uid()) or (select app_private.is_operator()));
-- Serialize demo parking mutations. Direct writes are not granted; all changes use this transaction.
create function public.parking_command(p_action text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid(); actor_role text; v public.private_vehicles; s public.parking_spaces;
 r public.parking_reservations; t_start timestamptz; t_end timestamptz;
begin
 if actor is null then raise exception 'UNAUTHENTICATED'; end if;
 select role into actor_role from public.app_users where id=actor;
 if p_action in ('RESERVE','CANCEL') and actor_role is distinct from 'STUDENT' then raise exception 'FORBIDDEN'; end if;
 if p_action in ('ARRIVED','DEPARTED') and actor_role is distinct from 'OPERATOR' then raise exception 'FORBIDDEN'; end if;
 if p_action not in ('RESERVE','CANCEL','ARRIVED','DEPARTED') or p_action is null then raise exception 'INVALID_INPUT'; end if;
 perform pg_catalog.pg_advisory_xact_lock(502605::bigint);
 if p_action='RESERVE' then
  t_start := (p_payload->>'start')::timestamptz; t_end := (p_payload->>'end')::timestamptz;
  if t_start is null or t_end is null or t_start < clock_timestamp() or t_end-t_start < interval '30 minutes' then raise exception 'INVALID_INPUT'; end if;
  select * into v from public.private_vehicles where id=(p_payload->>'privateVehicleId')::uuid;
  if v.id is null then raise exception 'NOT_FOUND'; end if;
  if v.owner_id<>actor then raise exception 'OWNERSHIP_REQUIRED'; end if;
  select * into s from public.parking_spaces where id=(p_payload->>'slotId')::uuid for update;
  if s.id is null then raise exception 'NOT_FOUND'; end if;
  if s.space_kind<>'PRIVATE' or not s.enabled then raise exception 'SLOT_BUSY'; end if;
  if not exists(select 1 from public.mobility_hubs where id=s.hub_id and status='ACTIVE') then raise exception 'HUB_MAINTENANCE'; end if;
  if exists(select 1 from public.parking_reservations where status in ('CONFIRMED','CHECKED_IN')
    and (slot_id=s.id or private_vehicle_id=v.id) and starts_at<t_end and ends_at>t_start) then raise exception 'PARKING_OVERLAP'; end if;
  insert into public.parking_reservations(owner_id,private_vehicle_id,slot_id,starts_at,ends_at)
   values(actor,v.id,s.id,t_start,t_end) returning * into r;
 else
  select * into r from public.parking_reservations where id=(p_payload->>'reservationId')::uuid for update;
  if r.id is null then raise exception 'NOT_FOUND'; end if;
  if p_action='CANCEL' then
   if r.owner_id<>actor then raise exception 'OWNERSHIP_REQUIRED'; end if;
   if r.status<>'CONFIRMED' then raise exception 'INVALID_STATE'; end if;
   update public.parking_reservations set status='CANCELLED' where id=r.id returning * into r;
  else
   select * into s from public.parking_spaces where id=r.slot_id for update;
   if p_action='ARRIVED' then
    if r.status<>'CONFIRMED' or clock_timestamp()<r.starts_at or clock_timestamp()>=r.ends_at then raise exception 'INVALID_STATE'; end if;
    if not s.enabled or s.occupancy_status<>'FREE' then raise exception 'SLOT_BUSY'; end if;
    if not exists(select 1 from public.mobility_hubs where id=s.hub_id and status='ACTIVE') then raise exception 'HUB_MAINTENANCE'; end if;
    if exists(select 1 from public.parking_reservations where private_vehicle_id=r.private_vehicle_id and status='CHECKED_IN') then raise exception 'SLOT_BUSY'; end if;
    update public.parking_spaces set occupancy_status='OCCUPIED' where id=s.id;
    update public.parking_reservations set status='CHECKED_IN' where id=r.id returning * into r;
   else
    if r.status<>'CHECKED_IN' then raise exception 'INVALID_STATE'; end if;
    update public.parking_spaces set occupancy_status='FREE' where id=s.id;
    update public.parking_reservations set status='COMPLETED' where id=r.id returning * into r;
   end if;
  end if;
 end if;
 return jsonb_build_object('id',r.id,'status',r.status,'start',r.starts_at,'end',r.ends_at,
   'checkinDeadlineAt',r.ends_at,'privateVehicleId',r.private_vehicle_id,'slotId',r.slot_id);
end; $$;
revoke all on function public.parking_command(text,jsonb) from public,anon;
grant execute on function public.parking_command(text,jsonb) to authenticated;
commit;
