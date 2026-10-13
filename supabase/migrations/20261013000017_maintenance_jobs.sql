-- =============================================================================
-- OpenDive Atlas — maintenance jobs
--
-- maintenance_tokens holds one-off secrets that admin-run Edge Functions (such
-- as fill-species-photos) check before doing anything. RLS is on with no
-- policies, so only the service role can read it. Delete a row to switch the
-- matching job off.
--
-- pg_net lets an admin trigger those functions from the SQL editor, e.g.
--   select net.http_post(
--     url := 'https://<project-ref>.supabase.co/functions/v1/fill-species-photos',
--     headers := jsonb_build_object('Authorization', 'Bearer <token>', 'Content-Type', 'application/json'),
--     body := '{}'::jsonb,
--     timeout_milliseconds := 150000);
-- =============================================================================

create extension if not exists pg_net with schema extensions;

create table public.maintenance_tokens (
  job        text primary key,
  token      text not null check (char_length(token) >= 32),
  created_at timestamptz not null default now()
);

alter table public.maintenance_tokens enable row level security;
revoke all on public.maintenance_tokens from anon, authenticated;

-- Edge Functions write with the service role. Triggers on tables such as
-- photos call the role helpers, so the service role needs to reach them.
grant usage on schema private to service_role;
grant execute on function private.is_admin(), private.is_moderator() to service_role;
