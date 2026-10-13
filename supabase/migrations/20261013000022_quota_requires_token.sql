-- =============================================================================
-- OpenDive Atlas — Require the server's job token for the AI rate limit
--
-- take_recommendation_quota(ip_hash) was callable by anyone with the public
-- API key, so a script could exhaust the shared daily cap and switch off Find
-- my dive and trip notes for everyone. The quota is now only taken by the app
-- server, which holds the 'ai-review' token (like the other AI functions).
-- =============================================================================

create or replace function public.take_recommendation_quota(p_token text, p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.job_token_ok('ai-review', p_token) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  delete from public.recommendation_requests where created_at < now() - interval '2 days';
  if (select count(*) from public.recommendation_requests
      where ip_hash = p_ip_hash and created_at > now() - interval '1 hour') >= 10 then
    return false;
  end if;
  if (select count(*) from public.recommendation_requests
      where created_at > now() - interval '1 day') >= 1000 then
    return false;
  end if;
  insert into public.recommendation_requests (ip_hash) values (p_ip_hash);
  return true;
end;
$$;

revoke execute on function public.take_recommendation_quota(text, text) from public;
grant execute on function public.take_recommendation_quota(text, text) to anon, authenticated;

-- The old, unguarded version.
drop function if exists public.take_recommendation_quota(text);
