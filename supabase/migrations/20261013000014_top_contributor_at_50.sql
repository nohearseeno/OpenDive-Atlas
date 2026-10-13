-- =============================================================================
-- OpenDive Atlas — Top Contributor invitation on the 50th approved new site
-- (previously the 51st). Same function as migration 0013 with `>= 50`.
-- =============================================================================

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

  if approved >= 50 and not exists (
    select 1 from public.profiles where id = new.user_id and is_top_contributor
  ) then
    insert into public.contributor_invites (user_id, approved_sites)
    values (new.user_id, approved)
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;
