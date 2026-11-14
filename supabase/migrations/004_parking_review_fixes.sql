-- Apply after 002/003, without rerunning them. Legacy rows are preserved.
begin;
alter table public.parking_reservations add column request_id uuid,add column request_payload jsonb,add column request_result jsonb;
alter table public.parking_reservations add constraint parking_owner_request_unique unique(owner_id,request_id);
create or replace function public.parking_command(p_action text,p_payload jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
 actor uuid := auth.uid(); actor_role text; v public.private_vehicles; s public.parking_spaces;
 r public.parking_reservations; t_start timestamptz; t_end timestamptz; rid uuid; payload jsonb; result jsonb;
begin
 if actor is null then raise exception 'UNAUTHENTICATED'; end if;
 select role into actor_role from public.app_users where id=actor;
 if p_action in ('RESERVE','CANCEL') and actor_role is distinct from 'STUDENT' then raise exception 'FORBIDDEN'; end if;
 if p_action in ('ARRIVED','DEPARTED') and actor_role is distinct from 'OPERATOR' then raise exception 'FORBIDDEN'; end if;
 if p_action not in ('RESERVE','CANCEL','ARRIVED','DEPARTED') or p_action is null then raise exception 'INVALID_INPUT'; end if;
 perform pg_catalog.pg_advisory_xact_lock(502605::bigint);
 if p_action='RESERVE' then
  t_start := (p_payload->>'start')::timestamptz; t_end := (p_payload->>'end')::timestamptz;
  rid := nullif(p_payload->>'requestId','')::uuid;
  payload := jsonb_build_object('privateVehicleId',(p_payload->>'privateVehicleId')::uuid,'slotId',(p_payload->>'slotId')::uuid,'start',extract(epoch from t_start),'end',extract(epoch from t_end));
  if rid is not null then
   select * into r from public.parking_reservations where owner_id=actor and request_id=rid;
   if found then
    if r.request_payload is distinct from payload then raise exception 'REQUEST_ID_REUSED';end if;
    return r.request_result;
   end if;
  end if;
  if t_start is null or t_end is null or t_start < clock_timestamp() or not isfinite(t_start) or not isfinite(t_end) or t_start>clock_timestamp()+interval '30 days' or t_end-t_start>interval '24 hours' or t_end-t_start < interval '30 minutes' then raise exception 'INVALID_INPUT'; end if;
  select * into v from public.private_vehicles where id=(p_payload->>'privateVehicleId')::uuid;
  if v.id is null then raise exception 'NOT_FOUND'; end if;
  if v.owner_id<>actor then raise exception 'OWNERSHIP_REQUIRED'; end if;
  select * into s from public.parking_spaces where id=(p_payload->>'slotId')::uuid for update;
  if s.id is null then raise exception 'NOT_FOUND'; end if;
  if s.space_kind<>'PRIVATE' or not s.enabled then raise exception 'SLOT_BUSY'; end if;
  if not exists(select 1 from public.mobility_hubs where id=s.hub_id and status='ACTIVE') then raise exception 'HUB_MAINTENANCE'; end if;
  if exists(select 1 from public.parking_reservations where status in ('CONFIRMED','CHECKED_IN')
    and slot_id=s.id and starts_at<t_end and ends_at>t_start) then raise exception 'PARKING_OVERLAP' using detail='SLOT_OVERLAP'; end if;
  if exists(select 1 from public.parking_reservations where status in ('CONFIRMED','CHECKED_IN') and private_vehicle_id=v.id and starts_at<t_end and ends_at>t_start) then raise exception 'PARKING_OVERLAP' using detail='VEHICLE_OVERLAP';end if;
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
    if r.status<>'CONFIRMED' then raise exception 'INVALID_STATE';end if;
    if clock_timestamp()<r.starts_at then raise exception 'INVALID_STATE' using detail='ARRIVAL_TOO_EARLY';end if;
    if clock_timestamp()>=r.ends_at then raise exception 'INVALID_STATE' using detail='ARRIVAL_TOO_LATE';end if;
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
 result := jsonb_build_object('id',r.id,'status',r.status,'start',r.starts_at,'end',r.ends_at,
   'checkinDeadlineAt',r.ends_at,'privateVehicleId',r.private_vehicle_id,'slotId',r.slot_id);
 if p_action='RESERVE' then
  update public.parking_reservations set request_id=rid,request_payload=payload,request_result=result where id=r.id;
 end if;
 return result;
end; $$;
revoke execute on function public.parking_command(text,jsonb) from public,anon;
grant execute on function public.parking_command(text,jsonb) to authenticated;

create function public.parking_list(p_limit int default 10,p_offset int default 0,p_status text default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare operator boolean; result jsonb; total int;
begin
 if auth.uid() is null then raise exception 'UNAUTHENTICATED';end if;
 select role='OPERATOR' into operator from public.app_users where id=auth.uid();
 if operator is null then raise exception 'FORBIDDEN';end if;
 if p_limit is null or p_offset is null or p_limit not between 1 and 20 or p_offset<0 or (p_status is not null and p_status not in ('CONFIRMED','CHECKED_IN','COMPLETED','CANCELLED')) then raise exception 'INVALID_INPUT';end if;
 select count(*) into total from public.parking_reservations r where (operator or r.owner_id=auth.uid()) and (p_status is null or r.status=p_status);
 select coalesce(jsonb_agg(to_jsonb(page)),'[]'::jsonb) into result from (
 select r.id,r.private_vehicle_id,r.slot_id,r.starts_at,r.ends_at,r.status,v.plate_number,
 coalesce(nullif(u.display_name,''),'Student '||left(r.owner_id::text,8)) as owner_name,h.name as hub_name
 from public.parking_reservations r join public.private_vehicles v on v.id=r.private_vehicle_id
 join public.app_users u on u.id=r.owner_id join public.parking_spaces s on s.id=r.slot_id join public.mobility_hubs h on h.id=s.hub_id
 where (operator or r.owner_id=auth.uid()) and (p_status is null or r.status=p_status)
 order by r.starts_at desc,r.id limit p_limit offset p_offset
 ) page;
 return jsonb_build_object('reservations',result,'total',total);
end;$$;
revoke all on function public.parking_list(int,int,text) from public,anon;
grant execute on function public.parking_list(int,int,text) to authenticated;
commit;
