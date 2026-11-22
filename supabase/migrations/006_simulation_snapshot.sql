-- One statement provides an atomic, operator-only What-if snapshot.
begin;

create function public.simulation_snapshot(p_hub_ids uuid[])
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  snapshot jsonb;
begin
  if auth.uid() is null then raise exception 'UNAUTHENTICATED'; end if;
  if not app_private.is_operator() then raise exception 'FORBIDDEN'; end if;
  if p_hub_ids is null or cardinality(p_hub_ids)=0 then raise exception 'INVALID_INPUT'; end if;
  if (select count(*)<>count(distinct id) from unnest(p_hub_ids) id) then
    raise exception 'INVALID_INPUT';
  end if;
  if (select count(*)<>cardinality(p_hub_ids)
      from public.mobility_hubs h
      where h.id=any(p_hub_ids)) then raise exception 'NOT_FOUND'; end if;

  select jsonb_build_object(
    'asOf',clock_timestamp(),
    'hubs',coalesce(
      jsonb_agg(
        jsonb_build_object(
          'id',h.id,
          'parkedVehicleCount',(
            select count(*)
            from public.shared_vehicles v
            where v.hub_id=h.id
              and v.enabled=true
              and v.status in ('AVAILABLE','RESERVED','WAITING_CHARGE','CHARGING')
          ),
          'availableVehicleCount',(
            select count(*)
            from public.shared_vehicles v
            where v.hub_id=h.id
              and v.enabled=true
              and v.status='AVAILABLE'
          ),
          'freeFleetSpaces',case
            when h.status='ACTIVE' then (
              select count(*)
              from public.parking_spaces s
              where s.hub_id=h.id
                and s.enabled=true
                and s.space_kind='FLEET'
                and s.occupancy_status='FREE'
            )
            else 0
          end,
          'availableChargingPointCount',case
            when h.status='ACTIVE' then (
              select count(*)
              from public.charging_points p
              where p.hub_id=h.id
              and p.enabled=true
              and p.status='AVAILABLE'
            )
            else 0
          end,
          'totalChargingPointCount',(
            select count(*)
            from public.charging_points p
            where p.hub_id=h.id
              and p.enabled=true
          )
        ) order by h.code
      ),
      '[]'::jsonb
    )
  )
  into snapshot
  from public.mobility_hubs h
  where h.id=any(p_hub_ids);

  return snapshot;
end;
$$;

revoke all on function public.simulation_snapshot(uuid[]) from public,anon;
grant execute on function public.simulation_snapshot(uuid[]) to authenticated;

commit;
