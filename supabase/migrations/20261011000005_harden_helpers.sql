-- =============================================================================
-- OpenDive Atlas — harden role helpers
--
-- Move is_admin()/is_moderator() out of the API-exposed "public" schema so
-- they are not callable via /rest/v1/rpc (Supabase advisors 0028/0029).
-- Policies reference functions by OID, so they keep working after the move;
-- plpgsql trigger functions reference them by name and are recreated.
-- =============================================================================

create schema if not exists private;
grant usage on schema private to anon, authenticated;

alter function public.is_admin() set schema private;
alter function public.is_moderator() set schema private;
grant execute on function private.is_admin() to anon, authenticated;
grant execute on function private.is_moderator() to anon, authenticated;

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (select auth.uid()) is null or private.is_admin() then
    return new;
  end if;
  new.role := old.role;
  return new;
end;
$$;

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
