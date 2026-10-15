-- =============================================================================
-- Fix: species.cover_photo_id must not be a foreign key to photos.
--
-- The FK added a second relationship between photos and species, so PostgREST
-- could no longer resolve embeds like photos?select=*,species(common_name)
-- (PGRST201), breaking the homepage featured photo, Admin -> Photos and
-- Admin -> Moderation. The column stays; integrity is kept by triggers:
-- the existing check that a cover is a photo of that species, and this one
-- that clears a cover when its photo is deleted.
-- =============================================================================

alter table public.species drop constraint species_cover_photo_id_fkey;

create or replace function private.clear_species_cover_photo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.species set cover_photo_id = null where cover_photo_id = old.id;
  return old;
end;
$$;

revoke execute on function private.clear_species_cover_photo() from public, anon, authenticated;

create trigger photos_clear_species_cover
  after delete on public.photos
  for each row execute function private.clear_species_cover_photo();

-- Tell PostgREST to drop the stale relationship from its schema cache now.
notify pgrst, 'reload schema';
