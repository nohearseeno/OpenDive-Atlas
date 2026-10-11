-- =============================================================================
-- OpenDive Atlas — core schema
-- Enums, tables, constraints, indexes and housekeeping triggers.
-- =============================================================================

create extension if not exists "pgcrypto" with schema extensions;

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.user_role as enum ('user', 'moderator', 'admin');

create type public.dive_type as enum (
  'reef', 'wreck', 'shore', 'boat', 'freshwater', 'wall', 'drift', 'muck', 'cavern'
);

create type public.experience_level as enum ('beginner', 'intermediate', 'advanced');

create type public.current_strength as enum ('none', 'mild', 'moderate', 'strong');

create type public.species_category as enum (
  'fish', 'shark_ray', 'reptile', 'mammal', 'cephalopod',
  'crustacean', 'mollusc', 'coral', 'invertebrate'
);

create type public.sighting_frequency as enum ('rare', 'occasional', 'common', 'abundant');

create type public.moderation_status as enum ('pending', 'approved', 'rejected');

-- -----------------------------------------------------------------------------
-- Shared trigger: updated_at
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles: one row per auth.users row
-- -----------------------------------------------------------------------------
create table public.profiles (
  id                  uuid primary key references auth.users (id) on delete cascade,
  username            text not null unique
                        check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name        text check (char_length(display_name) <= 80),
  bio                 text check (char_length(bio) <= 1000),
  avatar_url          text check (char_length(avatar_url) <= 1024),
  home_country        text check (char_length(home_country) <= 80),
  certification_level text check (char_length(certification_level) <= 80),
  role                public.user_role not null default 'user',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.profiles is 'Public diver profile, 1:1 with auth.users.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Role helpers (SECURITY DEFINER so they can be used inside RLS policies
-- without recursive policy evaluation on profiles).
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role in ('moderator', 'admin')
  );
$$;

-- Create a profile automatically when a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested text := lower(coalesce(new.raw_user_meta_data ->> 'username', ''));
  fallback  text := 'diver_' || substr(replace(new.id::text, '-', ''), 1, 10);
  chosen    text;
begin
  if requested ~ '^[a-z0-9_]{3,30}$'
     and not exists (select 1 from public.profiles where username = requested) then
    chosen := requested;
  else
    chosen := fallback;
  end if;

  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    chosen,
    nullif(left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent non-admins from escalating their own role.
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- No JWT subject => trusted context (SQL editor, service role, migrations).
  if (select auth.uid()) is null or public.is_admin() then
    return new;
  end if;
  new.role := old.role;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_profile_role();

-- -----------------------------------------------------------------------------
-- dive_sites
-- -----------------------------------------------------------------------------
create table public.dive_sites (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique
                      check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  name              text not null check (char_length(name) between 2 and 120),
  country           text not null check (char_length(country) between 2 and 80),
  region            text not null check (char_length(region) between 2 and 120),
  latitude          double precision not null check (latitude between -90 and 90),
  longitude         double precision not null check (longitude between -180 and 180),
  dive_types        public.dive_type[] not null default '{}'
                      check (cardinality(dive_types) between 1 and 9),
  experience_level  public.experience_level not null default 'beginner',
  visibility_min_m  numeric(5, 1) check (visibility_min_m >= 0),
  visibility_max_m  numeric(5, 1) check (visibility_max_m >= 0),
  temp_min_c        numeric(4, 1) check (temp_min_c between -2 and 40),
  temp_max_c        numeric(4, 1) check (temp_max_c between -2 and 40),
  max_depth_m       numeric(5, 1) check (max_depth_m between 0 and 350),
  typical_current   public.current_strength not null default 'mild',
  description       text not null default '' check (char_length(description) <= 10000),
  access_notes      text check (char_length(access_notes) <= 2000),
  is_published      boolean not null default true,
  created_by        uuid references public.profiles (id) on delete set null,
  updated_by        uuid references public.profiles (id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint dive_sites_visibility_range check (
    visibility_min_m is null or visibility_max_m is null or visibility_min_m <= visibility_max_m
  ),
  constraint dive_sites_temp_range check (
    temp_min_c is null or temp_max_c is null or temp_min_c <= temp_max_c
  )
);

create index dive_sites_country_idx on public.dive_sites (country);
create index dive_sites_level_idx on public.dive_sites (experience_level);
create index dive_sites_types_idx on public.dive_sites using gin (dive_types);
create index dive_sites_created_by_idx on public.dive_sites (created_by);
create index dive_sites_updated_by_idx on public.dive_sites (updated_by);

create trigger dive_sites_set_updated_at
  before update on public.dive_sites
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- species
-- -----------------------------------------------------------------------------
create table public.species (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique
                     check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 120),
  common_name      text not null check (char_length(common_name) between 2 and 120),
  scientific_name  text not null check (char_length(scientific_name) between 2 and 160),
  category         public.species_category not null,
  description      text not null default '' check (char_length(description) <= 10000),
  iucn_status      text check (iucn_status in ('LC', 'NT', 'VU', 'EN', 'CR', 'EW', 'EX', 'DD', 'NE')),
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create unique index species_scientific_name_key on public.species (lower(scientific_name));
create index species_category_idx on public.species (category);
create index species_created_by_idx on public.species (created_by);

create trigger species_set_updated_at
  before update on public.species
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- site_species: curated "commonly sighted here" relationship
-- -----------------------------------------------------------------------------
create table public.site_species (
  site_id     uuid not null references public.dive_sites (id) on delete cascade,
  species_id  uuid not null references public.species (id) on delete cascade,
  frequency   public.sighting_frequency not null default 'common',
  notes       text check (char_length(notes) <= 500),
  created_at  timestamptz not null default now(),
  primary key (site_id, species_id)
);

create index site_species_species_idx on public.site_species (species_id);

-- -----------------------------------------------------------------------------
-- Moderation guard shared by community content tables.
-- Regular users cannot set status or reassign ownership; moderators can.
-- -----------------------------------------------------------------------------
create or replace function public.protect_moderated_row()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  owner_col text := tg_argv[0];
begin
  if (select auth.uid()) is null or public.is_moderator() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'approved';
  else
    new.status := old.status;
  end if;

  -- Ownership column must always be the caller on insert and immutable on update.
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

-- -----------------------------------------------------------------------------
-- sightings
-- -----------------------------------------------------------------------------
create table public.sightings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  site_id      uuid not null references public.dive_sites (id) on delete cascade,
  species_id   uuid not null references public.species (id) on delete cascade,
  observed_on  date not null default current_date
                 check (observed_on between date '1950-01-01' and current_date + 1),
  quantity     integer not null default 1 check (quantity between 1 and 10000),
  depth_m      numeric(5, 1) check (depth_m between 0 and 350),
  notes        text check (char_length(notes) <= 2000),
  status       public.moderation_status not null default 'approved',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index sightings_site_idx on public.sightings (site_id, created_at desc);
create index sightings_species_idx on public.sightings (species_id, created_at desc);
create index sightings_user_idx on public.sightings (user_id, created_at desc);
create index sightings_status_idx on public.sightings (status, created_at desc);

create trigger sightings_set_updated_at
  before update on public.sightings
  for each row execute function public.set_updated_at();

create trigger sightings_protect
  before insert or update on public.sightings
  for each row execute function public.protect_moderated_row('user_id');

-- -----------------------------------------------------------------------------
-- photos: uploaded to Supabase Storage, or external (openly licensed) URLs
-- -----------------------------------------------------------------------------
create table public.photos (
  id            uuid primary key default gen_random_uuid(),
  storage_path  text unique check (char_length(storage_path) <= 512),
  external_url  text check (external_url ~ '^https://' and char_length(external_url) <= 2048),
  site_id       uuid references public.dive_sites (id) on delete cascade,
  species_id    uuid references public.species (id) on delete cascade,
  sighting_id   uuid references public.sightings (id) on delete cascade,
  uploaded_by   uuid default auth.uid() references public.profiles (id) on delete set null,
  caption       text check (char_length(caption) <= 500),
  attribution   text check (char_length(attribution) <= 500),
  license       text check (char_length(license) <= 120),
  source_url    text check (char_length(source_url) <= 2048),
  status        public.moderation_status not null default 'approved',
  created_at    timestamptz not null default now(),
  constraint photos_has_source check (storage_path is not null or external_url is not null),
  constraint photos_has_subject check (site_id is not null or species_id is not null)
);

create index photos_site_idx on public.photos (site_id, created_at desc);
create index photos_species_idx on public.photos (species_id, created_at desc);
create index photos_sighting_idx on public.photos (sighting_id);
create index photos_uploaded_by_idx on public.photos (uploaded_by);
create index photos_status_idx on public.photos (status, created_at desc);

create trigger photos_protect
  before insert or update on public.photos
  for each row execute function public.protect_moderated_row('uploaded_by');

-- -----------------------------------------------------------------------------
-- reviews: one per diver per site
-- -----------------------------------------------------------------------------
create table public.reviews (
  id                  uuid primary key default gen_random_uuid(),
  site_id             uuid not null references public.dive_sites (id) on delete cascade,
  user_id             uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  rating_marine_life  smallint not null check (rating_marine_life between 1 and 5),
  rating_visibility   smallint not null check (rating_visibility between 1 and 5),
  rating_photography  smallint not null check (rating_photography between 1 and 5),
  rating_difficulty   smallint not null check (rating_difficulty between 1 and 5),
  body                text check (char_length(body) <= 4000),
  dived_on            date check (dived_on between date '1950-01-01' and current_date + 1),
  status              public.moderation_status not null default 'approved',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (site_id, user_id)
);

create index reviews_user_idx on public.reviews (user_id);
create index reviews_status_idx on public.reviews (status, created_at desc);

create trigger reviews_set_updated_at
  before update on public.reviews
  for each row execute function public.set_updated_at();

create trigger reviews_protect
  before insert or update on public.reviews
  for each row execute function public.protect_moderated_row('user_id');
