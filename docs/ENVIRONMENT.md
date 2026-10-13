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
| `ANTHROPIC_API_KEY` | for AI features, unless you use federation (below) | Claude API key from [console.anthropic.com](https://console.anthropic.com). With the token below, turns on **Find my dive**, trip notes and the AI moderator. |
| `AI_REVIEW_TOKEN` | for all AI features | A random string (32+ characters) that must match `public.maintenance_tokens` for job `ai-review`. Only the server holds it: it lets the app take rate-limit quota, use the shared AI answer cache and record AI moderator verdicts; it grants nothing else. Set it in the database with `insert into public.maintenance_tokens (job, token) values ('ai-review', '<token>') on conflict (job) do update set token = excluded.token;` |

#### Keyless option: workload identity federation (recommended)

Instead of `ANTHROPIC_API_KEY`, the app can authenticate with a short-lived Vercel OIDC token that Anthropic exchanges for a short-lived access token. No long-lived secret is stored anywhere. If `ANTHROPIC_API_KEY` is also set, the key wins, so remove it once federation works.

| Variable | Description |
| --- | --- |
| `ANTHROPIC_FEDERATION_RULE_ID` | `fdrl_...` from Claude Console → Settings → Workload identity |
| `ANTHROPIC_ORGANIZATION_ID` | Your Anthropic organization ID (a UUID) |
| `ANTHROPIC_SERVICE_ACCOUNT_ID` | `svac_...`, the rule's target service account |
| `ANTHROPIC_WORKSPACE_ID` | Optional `wrkspc_...`; needed only if the rule covers more than one workspace |

None of these are secrets. Setup:

1. **Vercel:** Project → Settings → Security → *Secure backend access with OIDC federation*: enabled, issuer mode **Team**.
2. **Claude Console** → Settings → Workload identity → **Connect workload** → **Custom OIDC**:
   - Issuer URL `https://oidc.vercel.com/<team-slug>` (JWKS: discovery).
   - Match subject `owner:<team-slug>:project:opendive-atlas:environment:production`. Use a trailing `*` instead of `production` to also allow preview deployments.
   - Audience `https://api.anthropic.com`.
   - OAuth scope `workspace:developer`.
3. Set the variables above in Vercel for Production (and Preview, if the rule allows it), then redeploy.

The app asks Vercel for a fresh token with audience `https://api.anthropic.com` and a unique `jti` for every exchange, because Anthropic accepts each `jti` once. The SDK caches the resulting access token until shortly before it expires.

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
