-- =============================================================================
-- OpenDive Atlas — read models (views) and search RPCs
-- All views use security_invoker so the caller's RLS applies.
-- =============================================================================

-- Dive site + aggregated community statistics.
create view public.dive_site_summaries
with (security_invoker = true)
as
select
  s.*,
  coalesce(r.review_count, 0)::int   as review_count,
  r.avg_marine_life,
  r.avg_visibility,
  r.avg_photography,
  r.avg_difficulty,
  r.avg_overall,
  coalesce(si.sighting_count, 0)::int as sighting_count,
  coalesce(sp.species_count, 0)::int  as species_count
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

-- Community sighting statistics per (site, species).
create view public.site_species_sighting_stats
with (security_invoker = true)
as
select
  site_id,
  species_id,
  count(*)::int     as sighting_count,
  max(observed_on)  as last_sighted_on
from public.sightings
where status = 'approved'
group by site_id, species_id;

grant select on public.dive_site_summaries to anon, authenticated;
grant select on public.site_species_sighting_stats to anon, authenticated;

-- Escape LIKE wildcards in user input.
create or replace function public.like_pattern(q text)
returns text
language sql
immutable
set search_path = ''
as $$
  select '%' || replace(replace(replace(coalesce(q, ''), '\', '\\'), '%', '\%'), '_', '\_') || '%';
$$;

-- Search and filter dive sites.
--   q       free-text match on name, country, region
--   types   site matches if it has ANY of these dive types
--   levels  site matches if its experience level is in this list
create or replace function public.search_dive_sites(
  q text default null,
  types public.dive_type[] default null,
  levels public.experience_level[] default null
)
returns setof public.dive_site_summaries
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from public.dive_site_summaries s
  where s.is_published
    and (
      q is null or btrim(q) = ''
      or s.name    ilike public.like_pattern(btrim(q))
      or s.country ilike public.like_pattern(btrim(q))
      or s.region  ilike public.like_pattern(btrim(q))
    )
    and (types is null or cardinality(types) = 0 or s.dive_types && types)
    and (levels is null or cardinality(levels) = 0 or s.experience_level = any (levels))
  order by s.name;
$$;

-- Search and filter species.
create or replace function public.search_species(
  q text default null,
  categories public.species_category[] default null
)
returns setof public.species
language sql
stable
security invoker
set search_path = ''
as $$
  select *
  from public.species sp
  where (
      q is null or btrim(q) = ''
      or sp.common_name     ilike public.like_pattern(btrim(q))
      or sp.scientific_name ilike public.like_pattern(btrim(q))
    )
    and (categories is null or cardinality(categories) = 0 or sp.category = any (categories))
  order by sp.common_name;
$$;

grant execute on function public.search_dive_sites(text, public.dive_type[], public.experience_level[]) to anon, authenticated;
grant execute on function public.search_species(text, public.species_category[]) to anon, authenticated;

-- Helper functions should not be callable directly beyond what RLS needs.
revoke execute on function public.handle_new_user() from anon, authenticated, public;
