# Environment variables

Copy `.env.example` to `.env.local` for local development. On Vercel, set these in **Project → Settings → Environment Variables** for Production, Preview and Development.

| Variable | Required | Exposed to browser | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | yes | Supabase API URL, e.g. `https://abcd1234.supabase.co` (local: `http://127.0.0.1:54321`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | yes | Supabase **anon / publishable** key. Safe to expose: all data access is protected by Row Level Security. |
| `NEXT_PUBLIC_SITE_URL` | recommended | yes | Canonical public URL — production is `https://opendiveatlas.org`. Used for auth email redirect links, sitemap and metadata. Falls back to `VERCEL_URL`, then `http://localhost:3000`. |
| `NEXT_PUBLIC_MAP_TILE_URL` | optional | yes | Leaflet tile URL template. Defaults to `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. For production traffic use a provider that permits your volume (e.g. MapTiler, Stadia, Thunderforest) per the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/). |
| `NEXT_PUBLIC_MAP_TILE_ATTRIBUTION` | optional | yes | HTML attribution for your tile provider. Defaults to OpenStreetMap contributors. |

### AI features

Set these in Vercel (Project → Settings → Environment Variables). They're server-only; never prefix them with `NEXT_PUBLIC_`.

| Variable | Required | Description |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | for AI features | Claude API key from [console.anthropic.com](https://console.anthropic.com). Turns on **Find my dive** recommendations and, with the token below, the AI moderator. |
| `AI_REVIEW_TOKEN` | for the AI moderator | A random string (32+ characters) that must match `public.maintenance_tokens` for job `ai-review`. It lets the AI moderator record verdicts through `apply_ai_review()`; it grants nothing else. Set it in the database with `insert into public.maintenance_tokens (job, token) values ('ai-review', '<token>') on conflict (job) do update set token = excluded.token;` |

Both features use `claude-opus-5-5`. A review with web search typically costs a few cents; a recommendation costs less than a cent once the site catalogue is cached. Recommendations are limited to 10 per visitor per hour and 1,000 per day in total.

### Edge Function secrets

Set these in Supabase → Edge Functions → Secrets (or `npx supabase secrets set NAME=value`). They are used only by the `send-contributor-invites` function, never by the Next.js app.

| Secret | Required | Description |
| --- | --- | --- |
| `RESEND_API_KEY` | for invite emails | [Resend](https://resend.com) API key. Without it, Top Contributor invitations are still created and shown on the diver's profile page, but no email is sent. Unsent invitations are emailed after the next new-site approval once the key is set. |
| `INVITE_FROM_EMAIL` | optional | Sender, default `OpenDive Atlas <invites@opendiveatlas.org>`. The domain must be verified in Resend. |
| `SITE_URL` | optional | Base URL for the invitation link, default `https://opendiveatlas.org`. |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided to Edge Functions automatically.

### Not needed

- **No service-role key** is used by the Next.js app (only the Supabase-hosted Edge Function has one). Never add `SUPABASE_SERVICE_ROLE_KEY` to a `NEXT_PUBLIC_` variable.
- `VERCEL_URL` is set automatically by Vercel.

### Where to find Supabase values

- **Local:** run `npx supabase status` — use `API URL` and `anon key`.
- **Hosted:** Supabase Dashboard → Project Settings → API (Project URL and the `anon` / publishable key).

### Behaviour when unset

If the Supabase variables are missing the app still builds and runs, showing a setup notice instead of data, and `/api/*` returns `503`.
