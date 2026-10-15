-- =============================================================================
-- Species cover photo
--
-- Species cards, site species lists and the "Marine life you may encounter"
-- gallery show one photo per species. Until now that was always the oldest
-- approved photo, so a broken or weak early photo could never be replaced.
-- Admins can now pick the cover; when none is set (or it is not approved),
-- the oldest approved photo is still used.
-- =============================================================================

alter table public.species
  add column cover_photo_id uuid references public.photos (id) on delete set null;

comment on column public.species.cover_photo_id is
  'Photo shown on species cards and galleries. Must be a photo of this species; null = oldest approved photo.';

-- The cover must be a photo of the same species.
create or replace function private.check_species_cover_photo()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.cover_photo_id is not null and not exists (
    select 1 from public.photos p where p.id = new.cover_photo_id and p.species_id = new.id
  ) then
    raise exception 'Cover photo must be a photo of this species' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger species_check_cover_photo
  before insert or update of cover_photo_id on public.species
  for each row execute function private.check_species_cover_photo();
