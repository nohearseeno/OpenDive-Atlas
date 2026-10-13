-- =============================================================================
-- OpenDive Atlas — AI moderator and dive recommendations
--
-- Two review tiers for dive sites:
--   * Digitally reviewed: an AI moderator checked and approved the details
--     (dive_sites.ai_reviewed_at is set, is_verified is false).
--   * Human reviewed: a moderator confirmed them (is_verified is true).
-- Sites with neither are "unverified" (for example the starter entries).
--
-- The AI moderator runs in the Next.js app. It has no special database role:
-- it reads context and writes its verdict through the two functions below,
-- which require the token stored in maintenance_tokens for job 'ai-review'.
-- =============================================================================

alter table public.dive_sites add column if not exists ai_reviewed_at timestamptz;

-- Append ai_reviewed_at to the summary view (CREATE OR REPLACE can only add
-- columns at the end).
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
  s.is_verified,
  s.ai_reviewed_at
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

-- AI verdicts on suggestions. ai_status is null until the AI has run.
alter table public.site_suggestions
  add column if not exists ai_status text check (ai_status in ('approved', 'needs_human', 'rejected', 'failed')),
  add column if not exists ai_confidence real,
  add column if not exists ai_summary text check (char_length(ai_summary) <= 2000),
  add column if not exists ai_checks jsonb,
  add column if not exists ai_sources jsonb,
  add column if not exists ai_reviewed_at timestamptz;

alter table public.species_suggestions
  add column if not exists ai_status text check (ai_status in ('approved', 'needs_human', 'rejected', 'failed')),
  add column if not exists ai_confidence real,
  add column if not exists ai_summary text check (char_length(ai_summary) <= 2000),
  add column if not exists ai_checks jsonb,
  add column if not exists ai_sources jsonb,
  add column if not exists ai_reviewed_at timestamptz;

create index if not exists site_suggestions_ai_idx on public.site_suggestions (ai_status, status);

-- -----------------------------------------------------------------------------
-- Token check shared by the AI functions.
-- -----------------------------------------------------------------------------
create or replace function private.job_token_ok(p_job text, p_token text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.maintenance_tokens
    where job = p_job and p_token is not null and token = p_token
  );
$$;

revoke execute on function private.job_token_ok(text, text) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- What the AI moderator needs to review one suggestion.
-- p_kind: 'site' or 'species'.
-- -----------------------------------------------------------------------------
create or replace function public.ai_review_context(p_token text, p_kind text, p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  if not private.job_token_ok('ai-review', p_token) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;

  if p_kind = 'site' then
    select jsonb_build_object(
      'id', s.id, 'status', s.status, 'payload', s.payload, 'note', s.note,
      'current', case when d.id is null then null else jsonb_build_object(
        'name', d.name, 'country', d.country, 'region', d.region,
        'latitude', d.latitude, 'longitude', d.longitude, 'diveTypes', d.dive_types,
        'experienceLevel', d.experience_level, 'visibilityMinM', d.visibility_min_m,
        'visibilityMaxM', d.visibility_max_m, 'tempMinC', d.temp_min_c, 'tempMaxC', d.temp_max_c,
        'maxDepthM', d.max_depth_m, 'typicalCurrent', d.typical_current,
        'description', d.description, 'accessNotes', d.access_notes,
        'isVerified', d.is_verified) end
    ) into result
    from public.site_suggestions s
    left join public.dive_sites d on d.id = s.site_id
    where s.id = p_id;
  elsif p_kind = 'species' then
    select jsonb_build_object(
      'id', s.id, 'status', s.status, 'payload', s.payload, 'note', s.note,
      'current', case when sp.id is null then null else jsonb_build_object(
        'commonName', sp.common_name, 'scientificName', sp.scientific_name,
        'category', sp.category, 'description', sp.description, 'iucnStatus', sp.iucn_status) end
    ) into result
    from public.species_suggestions s
    left join public.species sp on sp.id = s.species_id
    where s.id = p_id;
  else
    raise exception 'Unknown kind %', p_kind using errcode = '22023';
  end if;

  return result;
end;
$$;

revoke execute on function public.ai_review_context(text, text, uuid) from public;
grant execute on function public.ai_review_context(text, text, uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Apply a species suggestion (shared by human and AI review).
-- -----------------------------------------------------------------------------
create or replace function private.apply_species_suggestion(s public.species_suggestions)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  p jsonb := s.payload;
  base text;
  new_slug text;
  n int := 1;
begin
  if s.species_id is not null then
    update public.species set
      common_name     = case when p ? 'commonName' then p->>'commonName' else common_name end,
      scientific_name = case when p ? 'scientificName' then p->>'scientificName' else scientific_name end,
      category        = case when p ? 'category' then (p->>'category')::public.species_category else category end,
      description     = case when p ? 'description' then coalesce(p->>'description', '') else description end,
      iucn_status     = case when p ? 'iucnStatus' then p->>'iucnStatus' else iucn_status end
    where id = s.species_id;
    return;
  end if;

  if coalesce(p->>'commonName', '') = '' or coalesce(p->>'scientificName', '') = '' or coalesce(p->>'category', '') = '' then
    raise exception 'This suggestion is missing a name or category' using errcode = 'P0001';
  end if;
  base := trim(both '-' from left(regexp_replace(lower(p->>'commonName'), '[^a-z0-9]+', '-', 'g'), 100));
  if base = '' then
    base := 'species';
  end if;
  new_slug := base;
  while exists (select 1 from public.species where slug = new_slug) loop
    n := n + 1;
    new_slug := base || '-' || n;
  end loop;
  insert into public.species (slug, common_name, scientific_name, category, description, iucn_status, created_by)
  values (new_slug, p->>'commonName', p->>'scientificName', (p->>'category')::public.species_category,
          coalesce(p->>'description', ''), p->>'iucnStatus', s.user_id);
end;
$$;

revoke execute on function private.apply_species_suggestion(public.species_suggestions) from public, anon, authenticated;

-- Human review of species suggestions now uses the shared apply function.
create or replace function public.review_species_suggestion(suggestion_id uuid, approve boolean, reviewer_note text default null)
returns public.moderation_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.species_suggestions;
begin
  if not private.is_moderator() then
    raise exception 'Moderator access required' using errcode = '42501';
  end if;
  select * into s from public.species_suggestions where id = suggestion_id for update;
  if not found then
    raise exception 'Suggestion not found' using errcode = 'P0002';
  end if;
  if s.status <> 'pending' then
    raise exception 'This suggestion was already reviewed' using errcode = 'P0001';
  end if;
  if approve then
    perform private.apply_species_suggestion(s);
  end if;
  update public.species_suggestions
  set status = case when approve then 'approved'::public.moderation_status else 'rejected'::public.moderation_status end,
      reviewed_by = (select auth.uid()),
      reviewed_at = now(),
      review_note = nullif(trim(reviewer_note), '')
  where id = s.id;
  return case when approve then 'approved'::public.moderation_status else 'rejected'::public.moderation_status end;
end;
$$;

-- -----------------------------------------------------------------------------
-- Apply a dive-site suggestion as the AI moderator. New sites are published
-- as digitally reviewed; edits are applied only to sites no human has
-- reviewed yet (callers enforce that before choosing 'approved').
-- -----------------------------------------------------------------------------
create or replace function private.apply_site_suggestion_ai(s public.site_suggestions)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  p jsonb := s.payload;
  base text;
  new_slug text;
  n int := 1;
begin
  if s.site_id is not null then
    update public.dive_sites set
      name             = case when p ? 'name' then p->>'name' else name end,
      country          = case when p ? 'country' then p->>'country' else country end,
      region           = case when p ? 'region' then p->>'region' else region end,
      latitude         = case when p ? 'latitude' then (p->>'latitude')::double precision else latitude end,
      longitude        = case when p ? 'longitude' then (p->>'longitude')::double precision else longitude end,
      dive_types       = case when p ? 'diveTypes'
                           then array(select jsonb_array_elements_text(p->'diveTypes'))::public.dive_type[]
                           else dive_types end,
      experience_level = case when p ? 'experienceLevel' then (p->>'experienceLevel')::public.experience_level else experience_level end,
      visibility_min_m = case when p ? 'visibilityMinM' then (p->>'visibilityMinM')::numeric else visibility_min_m end,
      visibility_max_m = case when p ? 'visibilityMaxM' then (p->>'visibilityMaxM')::numeric else visibility_max_m end,
      temp_min_c       = case when p ? 'tempMinC' then (p->>'tempMinC')::numeric else temp_min_c end,
      temp_max_c       = case when p ? 'tempMaxC' then (p->>'tempMaxC')::numeric else temp_max_c end,
      max_depth_m      = case when p ? 'maxDepthM' then (p->>'maxDepthM')::numeric else max_depth_m end,
      typical_current  = case when p ? 'typicalCurrent' then (p->>'typicalCurrent')::public.current_strength else typical_current end,
      description      = case when p ? 'description' then coalesce(p->>'description', '') else description end,
      access_notes     = case when p ? 'accessNotes' then p->>'accessNotes' else access_notes end,
      ai_reviewed_at   = now(),
      updated_by       = s.user_id
    where id = s.site_id and not is_verified;
    return;
  end if;

  if coalesce(p->>'name', '') = '' or coalesce(p->>'country', '') = '' or coalesce(p->>'region', '') = ''
     or p->>'latitude' is null or p->>'longitude' is null or jsonb_array_length(coalesce(p->'diveTypes', '[]')) = 0 then
    raise exception 'This suggestion is missing required details' using errcode = 'P0001';
  end if;
  base := trim(both '-' from left(regexp_replace(lower((p->>'name') || ' ' || (p->>'country')), '[^a-z0-9]+', '-', 'g'), 110));
  if base = '' then
    base := 'dive-site';
  end if;
  new_slug := base;
  while exists (select 1 from public.dive_sites where slug = new_slug) loop
    n := n + 1;
    new_slug := base || '-' || n;
  end loop;
  insert into public.dive_sites (
    slug, name, country, region, latitude, longitude, dive_types, experience_level,
    visibility_min_m, visibility_max_m, temp_min_c, temp_max_c, max_depth_m, typical_current,
    description, access_notes, is_published, is_verified, ai_reviewed_at, created_by, updated_by
  ) values (
    new_slug, p->>'name', p->>'country', p->>'region',
    (p->>'latitude')::double precision, (p->>'longitude')::double precision,
    array(select jsonb_array_elements_text(p->'diveTypes'))::public.dive_type[],
    coalesce(p->>'experienceLevel', 'beginner')::public.experience_level,
    (p->>'visibilityMinM')::numeric, (p->>'visibilityMaxM')::numeric,
    (p->>'tempMinC')::numeric, (p->>'tempMaxC')::numeric, (p->>'maxDepthM')::numeric,
    coalesce(p->>'typicalCurrent', 'mild')::public.current_strength,
    coalesce(p->>'description', ''), p->>'accessNotes',
    true, false, now(), s.user_id, s.user_id
  );
end;
$$;

revoke execute on function private.apply_site_suggestion_ai(public.site_suggestions) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Record the AI moderator's verdict and act on it.
-- p_decision: 'approved' | 'needs_human' | 'rejected' | 'failed'.
-- Returns what happened: 'approved', 'needs_human', 'rejected', 'failed' or
-- 'skipped' (a human already reviewed the suggestion).
-- -----------------------------------------------------------------------------
create or replace function public.apply_ai_review(
  p_token text,
  p_kind text,
  p_id uuid,
  p_decision text,
  p_confidence real,
  p_summary text,
  p_checks jsonb,
  p_sources jsonb
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  ss public.site_suggestions;
  sp public.species_suggestions;
  decision text := p_decision;
  summary text := left(coalesce(p_summary, ''), 2000);
  site_verified boolean;
begin
  if not private.job_token_ok('ai-review', p_token) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  if decision not in ('approved', 'needs_human', 'rejected', 'failed') then
    raise exception 'Unknown decision %', decision using errcode = '22023';
  end if;

  if p_kind = 'site' then
    select * into ss from public.site_suggestions where id = p_id for update;
    if not found then
      raise exception 'Suggestion not found' using errcode = 'P0002';
    end if;
    if ss.status <> 'pending' then
      update public.site_suggestions
      set ai_status = decision, ai_confidence = p_confidence, ai_summary = summary,
          ai_checks = p_checks, ai_sources = p_sources, ai_reviewed_at = now()
      where id = ss.id;
      return 'skipped';
    end if;

    -- Edits to a site a human has already reviewed always go to a human.
    if decision = 'approved' and ss.site_id is not null then
      select is_verified into site_verified from public.dive_sites where id = ss.site_id;
      if coalesce(site_verified, true) then
        decision := 'needs_human';
        summary := left(summary || ' (Held for a human: this site is already human-reviewed.)', 2000);
      end if;
    end if;

    if decision = 'approved' then
      perform private.apply_site_suggestion_ai(ss);
    end if;

    update public.site_suggestions
    set ai_status = decision, ai_confidence = p_confidence, ai_summary = summary,
        ai_checks = p_checks, ai_sources = p_sources, ai_reviewed_at = now(),
        status = case decision when 'approved' then 'approved'::public.moderation_status
                               when 'rejected' then 'rejected'::public.moderation_status
                               else status end,
        reviewed_at = case when decision in ('approved', 'rejected') then now() else reviewed_at end,
        review_note = case decision
                        when 'approved' then 'Approved by the AI moderator (digitally reviewed). A human moderator will also check it.'
                        when 'rejected' then left('Declined by the AI moderator: ' || summary, 1000)
                        else review_note end
    where id = ss.id;
    return decision;

  elsif p_kind = 'species' then
    select * into sp from public.species_suggestions where id = p_id for update;
    if not found then
      raise exception 'Suggestion not found' using errcode = 'P0002';
    end if;
    if sp.status <> 'pending' then
      update public.species_suggestions
      set ai_status = decision, ai_confidence = p_confidence, ai_summary = summary,
          ai_checks = p_checks, ai_sources = p_sources, ai_reviewed_at = now()
      where id = sp.id;
      return 'skipped';
    end if;

    if decision = 'approved' then
      perform private.apply_species_suggestion(sp);
    end if;

    update public.species_suggestions
    set ai_status = decision, ai_confidence = p_confidence, ai_summary = summary,
        ai_checks = p_checks, ai_sources = p_sources, ai_reviewed_at = now(),
        status = case decision when 'approved' then 'approved'::public.moderation_status
                               when 'rejected' then 'rejected'::public.moderation_status
                               else status end,
        reviewed_at = case when decision in ('approved', 'rejected') then now() else reviewed_at end,
        review_note = case decision
                        when 'approved' then 'Approved by the AI moderator. A human moderator may also check it.'
                        when 'rejected' then left('Declined by the AI moderator: ' || summary, 1000)
                        else review_note end
    where id = sp.id;
    return decision;
  end if;

  raise exception 'Unknown kind %', p_kind using errcode = '22023';
end;
$$;

revoke execute on function public.apply_ai_review(text, text, uuid, text, real, text, jsonb, jsonb) from public;
grant execute on function public.apply_ai_review(text, text, uuid, text, real, text, jsonb, jsonb) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Rate limit for AI dive recommendations: 10 per visitor per hour and 1,000
-- per day overall. Visitors are identified by a hash of their IP address.
-- -----------------------------------------------------------------------------
create table public.recommendation_requests (
  id         bigint generated always as identity primary key,
  ip_hash    text not null check (char_length(ip_hash) between 16 and 128),
  created_at timestamptz not null default now()
);

create index recommendation_requests_ip_idx on public.recommendation_requests (ip_hash, created_at desc);
create index recommendation_requests_created_idx on public.recommendation_requests (created_at);

alter table public.recommendation_requests enable row level security;
revoke all on public.recommendation_requests from anon, authenticated;

create or replace function public.take_recommendation_quota(p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.recommendation_requests where created_at < now() - interval '2 days';
  if (select count(*) from public.recommendation_requests
      where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 10 then
    return false;
  end if;
  if (select count(*) from public.recommendation_requests
      where created_at > now() - interval '1 day') >= 1000 then
    return false;
  end if;
  insert into public.recommendation_requests (ip_hash) values (p_ip_hash);
  return true;
end;
$$;

revoke execute on function public.take_recommendation_quota(text) from public;
grant execute on function public.take_recommendation_quota(text) to anon, authenticated;
