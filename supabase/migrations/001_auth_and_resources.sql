-- Run once in Supabase SQL Editor as project administrator.
begin;
create table public.app_users (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'STUDENT' check (role in ('STUDENT','OPERATOR'))
);
create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to authenticated;
create function app_private.is_operator() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.app_users where id = auth.uid() and role = 'OPERATOR');
$$;
revoke all on function app_private.is_operator() from public, anon;
grant execute on function app_private.is_operator() to authenticated;
create function app_private.create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.app_users(id) values (new.id) on conflict do nothing;
  return new;
end; $$;
revoke all on function app_private.create_profile() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
for each row execute function app_private.create_profile();
insert into public.app_users(id) select id from auth.users on conflict do nothing;

create table public.mobility_hubs (
 id uuid primary key default gen_random_uuid(), code text unique not null,
 name text not null, latitude double precision not null, longitude double precision not null,
 status text not null default 'ACTIVE' check(status in ('ACTIVE','MAINTENANCE')),
 updated_at timestamptz not null default now()
);
create table public.parking_spaces (
 id uuid primary key default gen_random_uuid(), hub_id uuid not null references public.mobility_hubs(id),
 code text unique not null, space_kind text not null check(space_kind in ('FLEET','PRIVATE')),
 occupancy_status text not null default 'FREE' check(occupancy_status in ('FREE','OCCUPIED')),
 enabled boolean not null default true
);
create table public.shared_vehicles (
 id uuid primary key default gen_random_uuid(), hub_id uuid not null references public.mobility_hubs(id),
 slot_id uuid unique references public.parking_spaces(id), code text unique not null,
 vehicle_type text not null default 'E_BIKE', battery_percent integer not null check(battery_percent between 0 and 100),
 status text not null default 'AVAILABLE' check(status in ('AVAILABLE','RESERVED','IN_USE','WAITING_CHARGE','CHARGING','OUT_OF_SERVICE')),
 enabled boolean not null default true
);
create table public.charging_points (
 id uuid primary key default gen_random_uuid(), hub_id uuid not null references public.mobility_hubs(id),
 code text unique not null, status text not null default 'AVAILABLE' check(status in ('AVAILABLE','IN_USE','OUT_OF_SERVICE')),
 enabled boolean not null default true
);
create table public.private_vehicles (
 id uuid primary key default gen_random_uuid(), owner_id uuid not null references public.app_users(id),
 plate_number text unique not null, battery_percent integer not null default 50 check(battery_percent between 0 and 100)
);
alter table public.app_users enable row level security;
alter table public.mobility_hubs enable row level security;
alter table public.parking_spaces enable row level security;
alter table public.shared_vehicles enable row level security;
alter table public.charging_points enable row level security;
alter table public.private_vehicles enable row level security;
-- Explicit grants are needed because automatic exposure was disabled at project creation.
revoke all on public.app_users, public.mobility_hubs, public.parking_spaces, public.shared_vehicles, public.charging_points, public.private_vehicles from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.mobility_hubs, public.parking_spaces, public.shared_vehicles, public.charging_points to anon, authenticated;
grant select on public.app_users, public.private_vehicles to authenticated;
grant insert, update, delete on public.mobility_hubs, public.parking_spaces, public.shared_vehicles, public.charging_points to authenticated;
create policy profile_owner on public.app_users for select to authenticated using(id = (select auth.uid()));
create policy private_vehicle_owner on public.private_vehicles for select to authenticated using(owner_id = (select auth.uid()));
create policy public_read on public.mobility_hubs for select to anon, authenticated using(true);
create policy operator_write on public.mobility_hubs for all to authenticated using((select app_private.is_operator())) with check((select app_private.is_operator()));
create policy public_read on public.parking_spaces for select to anon, authenticated using(true);
create policy operator_write on public.parking_spaces for all to authenticated using((select app_private.is_operator())) with check((select app_private.is_operator()));
create policy public_read on public.shared_vehicles for select to anon, authenticated using(true);
create policy operator_write on public.shared_vehicles for all to authenticated using((select app_private.is_operator())) with check((select app_private.is_operator()));
create policy public_read on public.charging_points for select to anon, authenticated using(true);
create policy operator_write on public.charging_points for all to authenticated using((select app_private.is_operator())) with check((select app_private.is_operator()));
commit;
