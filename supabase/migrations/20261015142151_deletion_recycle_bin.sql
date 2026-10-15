-- =============================================================================
-- Recycle bin for staff deletions
--
-- When an admin deletes a species or dive site, or a moderator or admin
-- deletes a photo, they must give a short reason. The item and everything
-- removed with it (site links, sightings, photos, reviews, suggestions) is
-- saved as a snapshot in deletion_log, then deleted. Admins can review the log
-- and restore an item within 14 days. After that the snapshot is purged, and
-- the app removes any uploaded photo files that went with it.
--
-- Divers removing their own content is unaffected (not logged).
-- =============================================================================

create table public.deletion_log (
  id            uuid primary key default gen_random_uuid(),
  kind          text not null check (kind in ('species', 'dive_site', 'photo')),
  record_id     uuid not null,
  label         text not null check (char_length(label) <= 300),
  reason        text not null check (char_length(reason) between 5 and 500),
  deleted_by    uuid references public.profiles (id) on delete set null,
  deleted_at    timestamptz not null default now(),
  restore_until timestamptz not null default now() + interval '14 days',
  -- Rows removed, keyed by table; null once purged.
  snapshot      jsonb,
  -- Uploaded photo files kept in Storage until the item is purged.
  storage_paths text[] not null default '{}',
  restored_by   uuid references public.profiles (id) on delete set null,
  restored_at   timestamptz,
  purged_at     timestamptz
);

create index deletion_log_deleted_at_idx on public.deletion_log (deleted_at desc);

alter table public.deletion_log enable row level security;

create policy "Admins read the deletion log"
  on public.deletion_log for select to authenticated
  using ((select private.is_admin()));

-- No insert/update/delete policies: all writes go through the functions below.

-- -----------------------------------------------------------------------------
-- Delete with a reason. Species and dive sites: admins. Photos: moderators.
-- Returns the deletion_log id.
-- -----------------------------------------------------------------------------
create or replace function public.delete_with_log(p_kind text, p_id uuid, p_reason text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason    text := btrim(coalesce(p_reason, ''));
  v_label     text;
  v_sightings uuid[];
  v_photos    jsonb;
  v_snapshot  jsonb;
  v_log_id    uuid;
begin
  if p_kind not in ('species', 'dive_site', 'photo') then
    raise exception 'Unknown item type' using errcode = 'P0001';
  end if;
  if p_kind in ('species', 'dive_site') and not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_kind = 'photo' and not private.is_moderator() then
    raise exception 'Moderator access required' using errcode = '42501';
  end if;
  if char_length(v_reason) < 5 then
    raise exception 'Give a short reason for the deletion (at least 5 characters)' using errcode = 'P0001';
  end if;
  if char_length(v_reason) > 500 then
    raise exception 'Keep the reason under 500 characters' using errcode = 'P0001';
  end if;

  if p_kind = 'species' then
    select common_name into v_label from public.species where id = p_id for update;
    if not found then
      raise exception 'Species not found' using errcode = 'P0001';
    end if;
    select coalesce(array_agg(id), '{}') into v_sightings from public.sightings where species_id = p_id;
    select coalesce(jsonb_agg(to_jsonb(p)), '[]') into v_photos
      from public.photos p where p.species_id = p_id or p.sighting_id = any (v_sightings);
    v_snapshot := jsonb_build_object(
      'species', (select jsonb_agg(to_jsonb(t)) from public.species t where t.id = p_id),
      'site_species', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from public.site_species t where t.species_id = p_id),
      'sightings', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from public.sightings t where t.id = any (v_sightings)),
      'photos', v_photos,
      'species_suggestions', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from public.species_suggestions t where t.species_id = p_id)
    );

  elsif p_kind = 'dive_site' then
    select name into v_label from public.dive_sites where id = p_id for update;
    if not found then
      raise exception 'Dive site not found' using errcode = 'P0001';
    end if;
    select coalesce(array_agg(id), '{}') into v_sightings from public.sightings where site_id = p_id;
    select coalesce(jsonb_agg(to_jsonb(p)), '[]') into v_photos
      from public.photos p where p.site_id = p_id or p.sighting_id = any (v_sightings);
    v_snapshot := jsonb_build_object(
      'dive_sites', (select jsonb_agg(to_jsonb(t)) from public.dive_sites t where t.id = p_id),
      'site_species', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from public.site_species t where t.site_id = p_id),
      'sightings', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from public.sightings t where t.id = any (v_sightings)),
      'photos', v_photos,
      'reviews', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from public.reviews t where t.site_id = p_id),
      'site_suggestions', (select coalesce(jsonb_agg(to_jsonb(t)), '[]') from public.site_suggestions t where t.site_id = p_id)
    );

  else
    select coalesce(p.caption, sp.common_name, ds.name, 'Photo') into v_label
      from public.photos p
      left join public.species sp on sp.id = p.species_id
      left join public.dive_sites ds on ds.id = p.site_id
      where p.id = p_id;
    if not found then
      raise exception 'Photo not found' using errcode = 'P0001';
    end if;
    select jsonb_agg(to_jsonb(p)) into v_photos from public.photos p where p.id = p_id;
    v_snapshot := jsonb_build_object('photos', v_photos);
  end if;

  -- Species whose cover is one of the removed photos (the FK clears it).
  v_snapshot := v_snapshot || jsonb_build_object('covers', (
    select coalesce(jsonb_agg(jsonb_build_object('species_id', s.id, 'photo_id', s.cover_photo_id)), '[]')
    from public.species s
    where s.cover_photo_id in (select (e->>'id')::uuid from jsonb_array_elements(v_photos) e)
  ));

  insert into public.deletion_log (kind, record_id, label, reason, deleted_by, snapshot, storage_paths)
  values (
    p_kind, p_id, left(coalesce(v_label, 'Untitled'), 300), v_reason, (select auth.uid()), v_snapshot,
    coalesce(
      (select array_agg(e->>'storage_path') from jsonb_array_elements(v_photos) e where e->>'storage_path' is not null),
      '{}'
    )
  )
  returning id into v_log_id;

  if p_kind = 'species' then
    delete from public.species where id = p_id;
  elsif p_kind = 'dive_site' then
    delete from public.dive_sites where id = p_id;
  else
    delete from public.photos where id = p_id;
  end if;

  return v_log_id;
end;
$$;

-- Re-inserts snapshot rows into a table, skipping generated columns.
create or replace function private.restore_rows(p_table text, p_rows jsonb)
returns void
language plpgsql
set search_path = ''
as $$
declare
  cols text;
begin
  if p_rows is null or jsonb_typeof(p_rows) <> 'array' or jsonb_array_length(p_rows) = 0 then
    return;
  end if;
  select string_agg(quote_ident(a.attname), ', ' order by a.attnum) into cols
  from pg_catalog.pg_attribute a
  where a.attrelid = ('public.' || quote_ident(p_table))::regclass
    and a.attnum > 0 and not a.attisdropped and a.attgenerated = '' and a.attidentity <> 'a';
  execute format(
    'insert into public.%I (%s) select %s from jsonb_populate_recordset(null::public.%I, $1)',
    p_table, cols, cols, p_table
  ) using p_rows;
end;
$$;

revoke execute on function private.restore_rows(text, jsonb) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Restore a deleted item and everything removed with it. Admins, within 14 days.
-- -----------------------------------------------------------------------------
create or replace function public.restore_deleted(p_log_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  l public.deletion_log;
  s jsonb;
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;

  select * into l from public.deletion_log where id = p_log_id for update;
  if not found then
    raise exception 'Deletion not found' using errcode = 'P0001';
  end if;
  if l.restored_at is not null then
    raise exception 'This item was already restored' using errcode = 'P0001';
  end if;
  if l.purged_at is not null or l.snapshot is null or now() > l.restore_until then
    raise exception 'The 14-day recovery period for this item has ended' using errcode = 'P0001';
  end if;

  s := l.snapshot;

  if l.kind = 'photo' and exists (
    select 1 from jsonb_array_elements(s->'photos') e
    where (e->>'species_id' is not null and not exists (select 1 from public.species x where x.id = (e->>'species_id')::uuid))
       or (e->>'site_id' is not null and not exists (select 1 from public.dive_sites x where x.id = (e->>'site_id')::uuid))
       or (e->>'sighting_id' is not null and not exists (select 1 from public.sightings x where x.id = (e->>'sighting_id')::uuid))
  ) then
    raise exception 'The species, dive site or sighting this photo belonged to is gone; restore that first' using errcode = 'P0001';
  end if;

  begin
    -- Covers are put back last, once their photos exist again.
    perform private.restore_rows('species',
      (select jsonb_agg(e || '{"cover_photo_id": null}'::jsonb) from jsonb_array_elements(s->'species') e));
    perform private.restore_rows('dive_sites', s->'dive_sites');
    perform private.restore_rows('site_species', s->'site_species');
    perform private.restore_rows('sightings', s->'sightings');
    perform private.restore_rows('photos', s->'photos');
    perform private.restore_rows('reviews', s->'reviews');
    perform private.restore_rows('site_suggestions', s->'site_suggestions');
    perform private.restore_rows('species_suggestions', s->'species_suggestions');
  exception
    when unique_violation then
      raise exception 'Cannot restore: something with the same name or address was added since (%)', sqlerrm
        using errcode = 'P0001';
    when foreign_key_violation then
      raise exception 'Cannot restore: something it depends on was deleted since (%)', sqlerrm
        using errcode = 'P0001';
  end;

  -- Put covers back unless an admin has chosen a different one since.
  update public.species sp
  set cover_photo_id = (c->>'photo_id')::uuid
  from jsonb_array_elements(s->'covers') c
  where sp.id = (c->>'species_id')::uuid
    and sp.cover_photo_id is null
    and exists (select 1 from public.photos p where p.id = (c->>'photo_id')::uuid and p.species_id = sp.id);

  -- The snapshot is no longer needed once the rows are back.
  update public.deletion_log
  set restored_at = now(), restored_by = (select auth.uid()), snapshot = null
  where id = l.id;
end;
$$;

-- -----------------------------------------------------------------------------
-- Purge items past their recovery period. Returns the Storage paths of their
-- uploaded photos so the app can remove the files. Admins.
-- -----------------------------------------------------------------------------
create or replace function public.purge_expired_deletions()
returns text[]
language plpgsql
security definer
set search_path = ''
as $$
declare
  paths text[];
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  with expired as (
    update public.deletion_log
    set snapshot = null, purged_at = now()
    where purged_at is null and restored_at is null and restore_until < now()
    returning storage_paths
  )
  select coalesce(array_agg(p), '{}') into paths from expired, unnest(expired.storage_paths) p;
  return paths;
end;
$$;

revoke execute on function public.delete_with_log(text, uuid, text) from public, anon;
revoke execute on function public.restore_deleted(uuid) from public, anon;
revoke execute on function public.purge_expired_deletions() from public, anon;
grant execute on function public.delete_with_log(text, uuid, text) to authenticated;
grant execute on function public.restore_deleted(uuid) to authenticated;
grant execute on function public.purge_expired_deletions() to authenticated;
