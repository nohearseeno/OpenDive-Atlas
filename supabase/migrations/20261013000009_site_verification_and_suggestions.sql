-- =============================================================================
-- OpenDive Atlas — verified flag on dive sites + community site suggestions
-- =============================================================================

-- Starter entries are published but flagged until a diver confirms the details.
alter table public.dive_sites add column if not exists is_verified boolean not null default true;
create index if not exists dive_sites_unverified_idx on public.dive_sites (id) where not is_verified;

-- Expose is_verified on the summary view. Columns are listed explicitly so the
-- new column is appended at the end (CREATE OR REPLACE VIEW cannot reorder).
create or replace view public.dive_site_summaries
with (security_invoker = true)
as
select
  s.id, s.slug, s.name, s.country, s.region, s.latitude, s.longitude, s.dive_types,
  s.experience_level, s.visibility_min_m, s.visibility_max_m, s.temp_min_c, s.temp_max_c,
  s.max_depth_m, s.typical_current, s.description, s.access_notes, s.is_published,
  s.created_by, s.updated_by, s.created_at, s.updated_at,
  coalesce(r.review_count, 0)::int    as review_count,
  r.avg_marine_life,
  r.avg_visibility,
  r.avg_photography,
  r.avg_difficulty,
  r.avg_overall,
  coalesce(si.sighting_count, 0)::int as sighting_count,
  coalesce(sp.species_count, 0)::int  as species_count,
  s.is_verified
from public.dive_sites s
left join lateral (
  select
    count(*)                                  as review_count,
    round(avg(rating_marine_life), 1)::float8 as avg_marine_life,
    round(avg(rating_visibility), 1)::float8  as avg_visibility,
    round(avg(rating_photography), 1)::float8 as avg_photography,
    round(avg(rating_difficulty), 1)::float8  as avg_difficulty,
    round(avg((rating_marine_life + rating_visibility + rating_photography) / 3.0), 1)::float8
                                              as avg_overall
  from public.reviews
  where site_id = s.id and status = 'approved'
) r on true
left join lateral (
  select count(*) as sighting_count
  from public.sightings
  where site_id = s.id and status = 'approved'
) si on true
left join lateral (
  select count(*) as species_count
  from public.site_species
  where site_id = s.id
) sp on true;

-- -----------------------------------------------------------------------------
-- site_suggestions: divers propose edits to a site (site_id set) or a new site
-- (site_id null). Admins review and apply them.
-- -----------------------------------------------------------------------------
create table public.site_suggestions (
  id           uuid primary key default gen_random_uuid(),
  site_id      uuid references public.dive_sites (id) on delete cascade,
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  payload      jsonb not null check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) < 20000),
  note         text check (char_length(note) <= 2000),
  status       public.moderation_status not null default 'pending',
  reviewed_by  uuid references public.profiles (id) on delete set null,
  reviewed_at  timestamptz,
  review_note  text check (char_length(review_note) <= 1000),
  created_at   timestamptz not null default now()
);

create index site_suggestions_status_idx on public.site_suggestions (status, created_at desc);
create index site_suggestions_site_idx on public.site_suggestions (site_id);
create index site_suggestions_user_idx on public.site_suggestions (user_id, created_at desc);
create index site_suggestions_reviewed_by_idx on public.site_suggestions (reviewed_by);

-- Non-admins always submit as themselves, as pending, with no review fields.
create or replace function public.protect_site_suggestion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or private.is_admin() then
    return new;
  end if;
  new.user_id := (select auth.uid());
  new.status := 'pending';
  new.reviewed_by := null;
  new.reviewed_at := null;
  new.review_note := null;
  return new;
end;
$$;

create trigger site_suggestions_protect
  before insert on public.site_suggestions
  for each row execute function public.protect_site_suggestion();

alter table public.site_suggestions enable row level security;

create policy "Divers see their own suggestions; moderators see all"
  on public.site_suggestions for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_moderator()));

create policy "Divers submit suggestions"
  on public.site_suggestions for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Admins review suggestions"
  on public.site_suggestions for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

create policy "Divers withdraw pending suggestions; admins delete any"
  on public.site_suggestions for delete to authenticated
  using ((user_id = (select auth.uid()) and status = 'pending') or (select private.is_admin()));
