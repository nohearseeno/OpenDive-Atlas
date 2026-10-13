-- =============================================================================
-- OpenDive Atlas — Row Level Security
--
-- Model:
--   * Everyone (anon + authenticated) can read published reference data and
--     approved community content.
--   * Authenticated divers can create/edit/delete their own community content.
--   * Moderators can see and moderate all community content.
--   * Admins manage reference data (dive sites, species, site_species).
-- =============================================================================

alter table public.profiles     enable row level security;
alter table public.dive_sites   enable row level security;
alter table public.species      enable row level security;
alter table public.site_species enable row level security;
alter table public.sightings    enable row level security;
alter table public.photos       enable row level security;
alter table public.reviews      enable row level security;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create policy "Profiles are publicly readable"
  on public.profiles for select
  to anon, authenticated
  using (true);

create policy "Users update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Admins update any profile"
  on public.profiles for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- dive_sites
-- -----------------------------------------------------------------------------
create policy "Published dive sites are readable"
  on public.dive_sites for select
  to anon, authenticated
  using (is_published or (select public.is_admin()));

create policy "Admins insert dive sites"
  on public.dive_sites for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admins update dive sites"
  on public.dive_sites for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins delete dive sites"
  on public.dive_sites for delete
  to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- species
-- -----------------------------------------------------------------------------
create policy "Species are readable"
  on public.species for select
  to anon, authenticated
  using (true);

create policy "Admins insert species"
  on public.species for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admins update species"
  on public.species for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins delete species"
  on public.species for delete
  to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- site_species
-- -----------------------------------------------------------------------------
create policy "Site species are readable"
  on public.site_species for select
  to anon, authenticated
  using (true);

create policy "Admins insert site species"
  on public.site_species for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Admins update site species"
  on public.site_species for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "Admins delete site species"
  on public.site_species for delete
  to authenticated
  using ((select public.is_admin()));

-- -----------------------------------------------------------------------------
-- sightings
-- -----------------------------------------------------------------------------
create policy "Approved sightings are readable; owners and moderators see all"
  on public.sightings for select
  to anon, authenticated
  using (
    status = 'approved'
    or user_id = (select auth.uid())
    or (select public.is_moderator())
  );

create policy "Divers create their own sightings"
  on public.sightings for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Divers update their own sightings"
  on public.sightings for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Moderators update any sighting"
  on public.sightings for update
  to authenticated
  using ((select public.is_moderator()))
  with check ((select public.is_moderator()));

create policy "Owners and moderators delete sightings"
  on public.sightings for delete
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_moderator()));

-- -----------------------------------------------------------------------------
-- photos
-- -----------------------------------------------------------------------------
create policy "Approved photos are readable; owners and moderators see all"
  on public.photos for select
  to anon, authenticated
  using (
    status = 'approved'
    or uploaded_by = (select auth.uid())
    or (select public.is_moderator())
  );

-- Divers may only register photos they uploaded into their own storage folder.
create policy "Divers register their own uploaded photos"
  on public.photos for insert
  to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and external_url is null
    and storage_path like ((select auth.uid())::text || '/%')
    and (
      sighting_id is null
      or exists (
        select 1 from public.sightings s
        where s.id = sighting_id and s.user_id = (select auth.uid())
      )
    )
  );

create policy "Admins add any photo"
  on public.photos for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "Owners update photo captions"
  on public.photos for update
  to authenticated
  using (uploaded_by = (select auth.uid()))
  with check (uploaded_by = (select auth.uid()));

create policy "Moderators update any photo"
  on public.photos for update
  to authenticated
  using ((select public.is_moderator()))
  with check ((select public.is_moderator()));

create policy "Owners and moderators delete photos"
  on public.photos for delete
  to authenticated
  using (uploaded_by = (select auth.uid()) or (select public.is_moderator()));

-- -----------------------------------------------------------------------------
-- reviews
-- -----------------------------------------------------------------------------
create policy "Approved reviews are readable; owners and moderators see all"
  on public.reviews for select
  to anon, authenticated
  using (
    status = 'approved'
    or user_id = (select auth.uid())
    or (select public.is_moderator())
  );

create policy "Divers create their own reviews"
  on public.reviews for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Divers update their own reviews"
  on public.reviews for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Moderators update any review"
  on public.reviews for update
  to authenticated
  using ((select public.is_moderator()))
  with check ((select public.is_moderator()));

create policy "Owners and moderators delete reviews"
  on public.reviews for delete
  to authenticated
  using (user_id = (select auth.uid()) or (select public.is_moderator()));
