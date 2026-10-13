-- =============================================================================
-- OpenDive Atlas — Trip planner: saved itineraries
--
-- Anyone can build a trip in their browser; signed-in divers can save trips
-- here and share a read-only link. A trip stores the chosen sites (slug and
-- days at each), the traveller's settings, and the last generated plan.
-- =============================================================================

create table public.trips (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title      text not null check (char_length(title) between 1 and 120),
  sites      jsonb not null default '[]' check (jsonb_typeof(sites) = 'array' and jsonb_array_length(sites) <= 25),
  settings   jsonb not null default '{}' check (jsonb_typeof(settings) = 'object' and pg_column_size(settings) < 2000),
  plan       jsonb check (plan is null or (jsonb_typeof(plan) = 'object' and pg_column_size(plan) < 60000)),
  is_shared  boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index trips_user_idx on public.trips (user_id, updated_at desc);

alter table public.trips enable row level security;

create policy "Divers see their own trips and shared trips"
  on public.trips for select to anon, authenticated
  using (is_shared or user_id = (select auth.uid()));

create policy "Divers create their own trips"
  on public.trips for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Divers update their own trips"
  on public.trips for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Divers remove their own trips"
  on public.trips for delete to authenticated
  using (user_id = (select auth.uid()));

-- Keep updated_at current, and cap saved trips at 50 per diver.
create or replace function public.trips_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' and (select count(*) from public.trips where user_id = new.user_id) >= 50 then
    raise exception 'You can save up to 50 trips. Remove one to save another.' using errcode = 'P0001';
  end if;
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.created_at := old.created_at;
    new.user_id := old.user_id;
  end if;
  return new;
end;
$$;

revoke execute on function public.trips_before_write() from public, anon, authenticated;

create trigger trips_before_write
  before insert or update on public.trips
  for each row execute function public.trips_before_write();
