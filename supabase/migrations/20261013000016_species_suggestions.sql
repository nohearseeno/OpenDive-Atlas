-- =============================================================================
-- OpenDive Atlas — community species suggestions
--
-- Divers propose a missing species (species_id null) or corrections to an
-- existing one. Moderators review them with review_species_suggestion(), which
-- applies approved changes itself, so editing species directly stays
-- admin-only. Approved species suggestions do not count toward the Top
-- Contributor invitation (that trigger only watches site_suggestions).
-- =============================================================================

create table public.species_suggestions (
  id           uuid primary key default gen_random_uuid(),
  species_id   uuid references public.species (id) on delete cascade,
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  payload      jsonb not null check (jsonb_typeof(payload) = 'object' and pg_column_size(payload) < 20000),
  note         text check (char_length(note) <= 2000),
  status       public.moderation_status not null default 'pending',
  reviewed_by  uuid references public.profiles (id) on delete set null,
  reviewed_at  timestamptz,
  review_note  text check (char_length(review_note) <= 1000),
  created_at   timestamptz not null default now()
);

create index species_suggestions_status_idx on public.species_suggestions (status, created_at desc);
create index species_suggestions_species_idx on public.species_suggestions (species_id);
create index species_suggestions_user_idx on public.species_suggestions (user_id, created_at desc);
create index species_suggestions_reviewed_by_idx on public.species_suggestions (reviewed_by);

-- Same guard as site suggestions: non-admins submit as themselves, as pending.
create trigger species_suggestions_protect
  before insert on public.species_suggestions
  for each row execute function public.protect_site_suggestion();

alter table public.species_suggestions enable row level security;

create policy "Divers see their own species suggestions; moderators see all"
  on public.species_suggestions for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_moderator()));

create policy "Divers submit species suggestions"
  on public.species_suggestions for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Divers withdraw pending species suggestions; admins delete any"
  on public.species_suggestions for delete to authenticated
  using ((user_id = (select auth.uid()) and status = 'pending') or (select private.is_admin()));

-- No UPDATE policy: reviews go through the function below.

-- -----------------------------------------------------------------------------
-- Approve (and apply) or reject a species suggestion. Moderators and admins.
-- Payload keys: commonName, scientificName, category, description, iucnStatus.
-- For edits only the keys present are changed. Constraint violations (for
-- example a scientific name that already exists) abort the whole review.
-- -----------------------------------------------------------------------------
create or replace function public.review_species_suggestion(suggestion_id uuid, approve boolean, reviewer_note text default null)
returns public.moderation_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  s public.species_suggestions;
  p jsonb;
  base text;
  new_slug text;
  n int := 1;
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
    p := s.payload;
    if s.species_id is not null then
      update public.species set
        common_name     = case when p ? 'commonName' then p->>'commonName' else common_name end,
        scientific_name = case when p ? 'scientificName' then p->>'scientificName' else scientific_name end,
        category        = case when p ? 'category' then (p->>'category')::public.species_category else category end,
        description     = case when p ? 'description' then coalesce(p->>'description', '') else description end,
        iucn_status     = case when p ? 'iucnStatus' then p->>'iucnStatus' else iucn_status end
      where id = s.species_id;
    else
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
      values (
        new_slug,
        p->>'commonName',
        p->>'scientificName',
        (p->>'category')::public.species_category,
        coalesce(p->>'description', ''),
        p->>'iucnStatus',
        s.user_id
      );
    end if;
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

revoke execute on function public.review_species_suggestion(uuid, boolean, text) from public, anon;
grant execute on function public.review_species_suggestion(uuid, boolean, text) to authenticated;
