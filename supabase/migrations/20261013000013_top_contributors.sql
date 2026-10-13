-- =============================================================================
-- OpenDive Atlas — Top Contributor Moderators
--
-- A diver who has more than 50 new-site suggestions approved is invited (in the
-- app and by email) to become a Top Contributor Moderator. Accepting the
-- invitation gives them the avatar badge and, if they are a regular diver,
-- the moderator role. Only approved "Suggest a dive site" submissions count;
-- edits to existing sites do not.
-- =============================================================================

alter table public.profiles add column if not exists is_top_contributor boolean not null default false;

-- Role and badge can only be changed by admins or by trusted SECURITY DEFINER
-- functions (current_user is then the function owner, not a request role).
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or private.is_admin() or current_user not in ('authenticated', 'anon') then
    return new;
  end if;
  new.role := old.role;
  new.is_top_contributor := old.is_top_contributor;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- contributor_invites: one invitation per diver. Rows are written only by the
-- trigger and RPC below (and the email function, via the service role).
-- -----------------------------------------------------------------------------
create type public.invite_status as enum ('pending', 'accepted', 'declined');

create table public.contributor_invites (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references public.profiles (id) on delete cascade,
  approved_sites  int not null,
  status          public.invite_status not null default 'pending',
  email_sent_at   timestamptz,
  responded_at    timestamptz,
  created_at      timestamptz not null default now()
);

create index contributor_invites_unsent_idx on public.contributor_invites (created_at) where email_sent_at is null;

alter table public.contributor_invites enable row level security;

create policy "Divers see their own invitation; moderators see all"
  on public.contributor_invites for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_moderator()));

-- -----------------------------------------------------------------------------
-- Offer the invitation when a new-site suggestion pushes a diver past 50.
-- -----------------------------------------------------------------------------
create or replace function private.offer_top_contributor()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  approved int;
begin
  if new.status <> 'approved' or old.status = 'approved' or new.site_id is not null then
    return new;
  end if;

  select count(*) into approved
  from public.site_suggestions
  where user_id = new.user_id and site_id is null and status = 'approved';

  if approved > 50 and not exists (
    select 1 from public.profiles where id = new.user_id and is_top_contributor
  ) then
    insert into public.contributor_invites (user_id, approved_sites)
    values (new.user_id, approved)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

revoke execute on function private.offer_top_contributor() from public, anon, authenticated;

create trigger site_suggestions_offer_top_contributor
  after update of status on public.site_suggestions
  for each row execute function private.offer_top_contributor();

-- -----------------------------------------------------------------------------
-- Accept or decline. Accepting grants the badge and promotes a regular diver to
-- moderator (moderators and admins keep their role). A declined invitation can
-- still be accepted later.
-- -----------------------------------------------------------------------------
create or replace function public.respond_contributor_invite(invite_id uuid, accept boolean)
returns public.invite_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  inv public.contributor_invites;
begin
  select * into inv
  from public.contributor_invites
  where id = invite_id and user_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Invitation not found' using errcode = 'P0002';
  end if;
  if inv.status = 'accepted' then
    return inv.status;
  end if;

  if accept then
    update public.profiles
    set is_top_contributor = true,
        role = case when role = 'user' then 'moderator'::public.user_role else role end
    where id = inv.user_id;
    update public.contributor_invites set status = 'accepted', responded_at = now() where id = inv.id;
    return 'accepted';
  end if;

  if inv.status = 'pending' then
    update public.contributor_invites set status = 'declined', responded_at = now() where id = inv.id;
  end if;
  return 'declined';
end;
$$;

revoke execute on function public.respond_contributor_invite(uuid, boolean) from public, anon;
grant execute on function public.respond_contributor_invite(uuid, boolean) to authenticated;
