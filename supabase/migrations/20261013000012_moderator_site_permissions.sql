-- =============================================================================
-- OpenDive Atlas — moderator site permissions
--
-- Moderators (and admins) can now add and edit dive sites and review
-- community site suggestions. Deleting sites, curating species/site species,
-- curated photo uploads and role changes stay admin-only.
--
-- These are additional permissive policies: they OR with the existing
-- admin-only policies, so nothing needs to be dropped.
-- =============================================================================

create policy "Moderators read all dive sites"
  on public.dive_sites for select to authenticated
  using ((select private.is_moderator()));

create policy "Moderators insert dive sites"
  on public.dive_sites for insert to authenticated
  with check ((select private.is_moderator()));

create policy "Moderators update dive sites"
  on public.dive_sites for update to authenticated
  using ((select private.is_moderator()))
  with check ((select private.is_moderator()));

create policy "Moderators review suggestions"
  on public.site_suggestions for update to authenticated
  using ((select private.is_moderator()))
  with check ((select private.is_moderator()));
