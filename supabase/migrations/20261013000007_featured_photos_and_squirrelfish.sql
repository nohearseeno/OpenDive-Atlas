-- =============================================================================
-- OpenDive Atlas — featured photos, admin uploads, long-spined squirrelfish
-- =============================================================================

-- Featured photos power the homepage hero. Only moderators/admins can set the
-- flag: the moderation guard below resets it for everyone else.
alter table public.photos add column if not exists is_featured boolean not null default false;
create index if not exists photos_featured_idx on public.photos (created_at desc) where is_featured;

create or replace function public.protect_moderated_row()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  owner_col text := tg_argv[0];
begin
  if (select auth.uid()) is null or private.is_moderator() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'approved';
  else
    new.status := old.status;
  end if;

  if tg_table_name = 'photos' then
    if tg_op = 'INSERT' then
      new.is_featured := false;
    else
      new.is_featured := old.is_featured;
    end if;
  end if;

  if owner_col = 'user_id' then
    if tg_op = 'INSERT' then
      new.user_id := (select auth.uid());
    else
      new.user_id := old.user_id;
    end if;
  elsif owner_col = 'uploaded_by' then
    if tg_op = 'INSERT' then
      new.uploaded_by := (select auth.uid());
    else
      new.uploaded_by := old.uploaded_by;
    end if;
  end if;

  return new;
end;
$$;

-- Admins upload curated photos (credited, separately licensed) under "site/".
create policy "Admins upload curated photos"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = 'site' and (select private.is_admin()));

create policy "Admins manage curated photos"
  on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = 'site' and (select private.is_admin()));

-- Long-spined squirrelfish, common on Caribbean reefs.
insert into public.species (slug, common_name, scientific_name, category, iucn_status, description)
values (
  'longspine-squirrelfish', 'Long-spined Squirrelfish', 'Holocentrus rufus', 'fish', 'LC',
  'A red-and-silver striped reef fish with oversized eyes and a tall dorsal fin whose spines carry white tips. Squirrelfish are nocturnal: by day they hover in holes and under ledges on the reef wall, and at night they come out to hunt crabs and shrimps. They make clicking and grunting sounds when disturbed.'
)
on conflict (slug) do nothing;

insert into public.site_species (site_id, species_id, frequency, notes)
select ds.id, sp.id, v.frequency::public.sighting_frequency, v.notes
from (values
  ('salt-pier',       'common', 'Hovering in the shade between pilings.'),
  ('hilma-hooker',    'common', 'In the wreck''s openings and overhangs.'),
  ('molasses-reef',   'common', 'Under ledges along the spurs.'),
  ('palancar-reef',   'common', 'In holes and swim-throughs.'),
  ('santa-rosa-wall', 'common', 'Look into the wall''s holes and overhangs.')
) as v(site_slug, frequency, notes)
join public.dive_sites ds on ds.slug = v.site_slug
join public.species sp on sp.slug = 'longspine-squirrelfish'
on conflict (site_id, species_id) do nothing;
