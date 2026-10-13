-- =============================================================================
-- OpenDive Atlas — Find my dive: shared result cache and per-diver history
--
-- recommendation_results caches each answer for 24 hours, keyed by a hash of
-- the normalised query, so repeated or shared searches don't call Claude again.
-- It holds what visitors typed, so nobody can read it directly: the app reads
-- and writes it through two functions that require the 'ai-review' token.
--
-- recommendation_history keeps each signed-in diver's own searches (with a
-- copy of the result, so they still open after the cache expires).
-- =============================================================================

create table public.recommendation_results (
  query_hash text primary key check (char_length(query_hash) = 64),
  query      text not null check (char_length(query) <= 600),
  result     jsonb not null check (jsonb_typeof(result) = 'object' and pg_column_size(result) < 20000),
  created_at timestamptz not null default now()
);

create index recommendation_results_created_idx on public.recommendation_results (created_at);

alter table public.recommendation_results enable row level security;
revoke all on public.recommendation_results from anon, authenticated;

create or replace function public.get_cached_recommendation(p_token text, p_hash text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.job_token_ok('ai-review', p_token) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return (
    select result from public.recommendation_results
    where query_hash = p_hash and created_at > now() - interval '24 hours'
  );
end;
$$;

create or replace function public.save_recommendation(p_token text, p_hash text, p_query text, p_result jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.job_token_ok('ai-review', p_token) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  delete from public.recommendation_results where created_at < now() - interval '2 days';
  insert into public.recommendation_results (query_hash, query, result)
  values (p_hash, left(p_query, 600), p_result)
  on conflict (query_hash) do update set query = excluded.query, result = excluded.result, created_at = now();
end;
$$;

revoke execute on function public.get_cached_recommendation(text, text) from public;
revoke execute on function public.save_recommendation(text, text, text, jsonb) from public;
grant execute on function public.get_cached_recommendation(text, text) to anon, authenticated;
grant execute on function public.save_recommendation(text, text, text, jsonb) to anon, authenticated;

create table public.recommendation_history (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  query      text not null check (char_length(query) between 1 and 600),
  result     jsonb not null check (jsonb_typeof(result) = 'object' and pg_column_size(result) < 20000),
  created_at timestamptz not null default now()
);

create index recommendation_history_user_idx on public.recommendation_history (user_id, created_at desc);

alter table public.recommendation_history enable row level security;

create policy "Divers see their own recommendation history"
  on public.recommendation_history for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Divers add to their own recommendation history"
  on public.recommendation_history for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Divers delete their own recommendation history"
  on public.recommendation_history for delete to authenticated
  using (user_id = (select auth.uid()));

-- Keep the 30 most recent searches per diver.
create or replace function public.trim_recommendation_history()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.recommendation_history
  where user_id = new.user_id
    and id not in (
      select id from public.recommendation_history
      where user_id = new.user_id
      order by created_at desc
      limit 30
    );
  return new;
end;
$$;

revoke execute on function public.trim_recommendation_history() from public, anon, authenticated;

create trigger recommendation_history_trim
  after insert on public.recommendation_history
  for each row execute function public.trim_recommendation_history();
