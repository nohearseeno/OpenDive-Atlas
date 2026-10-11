-- =============================================================================
-- OpenDive Atlas — Storage
-- Public "photos" bucket. Objects live under "<user_id>/<uuid>.<ext>".
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'photos',
  'photos',
  true,
  10485760, -- 10 MiB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Public bucket: files are served via the public URL without a SELECT policy.
-- These SELECT policies only allow owners/moderators to list objects via the API.
create policy "Owners can list their photo objects"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_moderator())
    )
  );

create policy "Divers upload photos into their own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Owners and moderators delete photo objects"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or (select public.is_moderator())
    )
  );
