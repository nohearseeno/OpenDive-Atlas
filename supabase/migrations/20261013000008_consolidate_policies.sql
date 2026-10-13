-- =============================================================================
-- OpenDive Atlas — consolidate permissive policies
-- Merge owner + moderator/admin permissive policies for the same action into
-- single policies so each row is evaluated once (Supabase advisor 0006).
-- =============================================================================

-- profiles: single UPDATE policy
drop policy "Users update their own profile" on public.profiles;
drop policy "Admins update any profile" on public.profiles;
create policy "Users update own profile; admins update any"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id or (select private.is_admin()))
  with check ((select auth.uid()) = id or (select private.is_admin()));

-- sightings
drop policy "Divers update their own sightings" on public.sightings;
drop policy "Moderators update any sighting" on public.sightings;
create policy "Owners and moderators update sightings"
  on public.sightings for update to authenticated
  using (user_id = (select auth.uid()) or (select private.is_moderator()))
  with check (user_id = (select auth.uid()) or (select private.is_moderator()));

-- reviews
drop policy "Divers update their own reviews" on public.reviews;
drop policy "Moderators update any review" on public.reviews;
create policy "Owners and moderators update reviews"
  on public.reviews for update to authenticated
  using (user_id = (select auth.uid()) or (select private.is_moderator()))
  with check (user_id = (select auth.uid()) or (select private.is_moderator()));

-- photos: single INSERT and single UPDATE policy
drop policy "Divers register their own uploaded photos" on public.photos;
drop policy "Admins add any photo" on public.photos;
create policy "Divers register own uploads; admins add any photo"
  on public.photos for insert to authenticated
  with check (
    (select private.is_admin())
    or (
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
    )
  );

drop policy "Owners update photo captions" on public.photos;
drop policy "Moderators update any photo" on public.photos;
create policy "Owners and moderators update photos"
  on public.photos for update to authenticated
  using (uploaded_by = (select auth.uid()) or (select private.is_moderator()))
  with check (uploaded_by = (select auth.uid()) or (select private.is_moderator()));
