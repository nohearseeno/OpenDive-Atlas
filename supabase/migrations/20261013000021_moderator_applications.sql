-- =============================================================================
-- OpenDive Atlas — Volunteer moderators
--
-- Signed-in divers can apply to become moderators. Admins review applications
-- and approving one promotes the diver to 'moderator' (via a SECURITY DEFINER
-- function, so the profile role guard still blocks every other role change).
-- =============================================================================

create table public.moderator_applications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  about       text not null check (char_length(about) between 20 and 1500),
  regions     text check (char_length(regions) <= 300),
  status      text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_note text check (char_length(review_note) <= 500),
  created_at  timestamptz not null default now()
);

-- One open application per diver.
create unique index moderator_applications_one_pending
  on public.moderator_applications (user_id) where status = 'pending';
create index moderator_applications_status_idx on public.moderator_applications (status, created_at);

alter table public.moderator_applications enable row level security;

create policy "Divers see their own applications; admins see all"
  on public.moderator_applications for select to authenticated
  using (user_id = (select auth.uid()) or private.is_admin());

-- Only regular divers can apply, only for themselves, and only as 'pending'.
create policy "Divers apply for themselves"
  on public.moderator_applications for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pending'
    and reviewed_by is null and reviewed_at is null and review_note is null
    and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role = 'user')
  );

-- Admins decide; approving promotes a 'user' to 'moderator'.
create or replace function public.review_moderator_application(application_id uuid, approve boolean, reviewer_note text default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  app public.moderator_applications;
begin
  if not private.is_admin() then
    raise exception 'Admin access required' using errcode = 'P0001';
  end if;
  select * into app from public.moderator_applications where id = application_id for update;
  if not found then
    raise exception 'Application not found' using errcode = 'P0001';
  end if;
  if app.status <> 'pending' then
    raise exception 'This application was already reviewed' using errcode = 'P0001';
  end if;

  update public.moderator_applications
  set status = case when approve then 'approved' else 'declined' end,
      reviewed_by = (select auth.uid()),
      reviewed_at = now(),
      review_note = nullif(left(trim(reviewer_note), 500), '')
  where id = application_id;

  if approve then
    update public.profiles set role = 'moderator' where id = app.user_id and role = 'user';
  end if;
  return case when approve then 'approved' else 'declined' end;
end;
$$;

revoke execute on function public.review_moderator_application(uuid, boolean, text) from public, anon;
grant execute on function public.review_moderator_application(uuid, boolean, text) to authenticated;
