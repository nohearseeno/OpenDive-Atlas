# Environment variables

Copy `.env.example` to `.env.local` for local development. On Vercel, set these in **Project → Settings → Environment Variables** for Production, Preview and Development.

| Variable | Required | Exposed to browser | Description |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | yes | Supabase API URL, e.g. `https://abcd1234.supabase.co` (local: `http://127.0.0.1:54321`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | yes | Supabase **anon / publishable** key. Safe to expose: all data access is protected by Row Level Security. |
| `NEXT_PUBLIC_SITE_URL` | recommended | yes | Canonical public URL — production is `https://opendiveatlas.org`. Used for auth email redirect links, sitemap and metadata. Falls back to `VERCEL_URL`, then `http://localhost:3000`. |
| `NEXT_PUBLIC_MAP_TILE_URL` | optional | yes | Leaflet tile URL template. Defaults to `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. For production traffic use a provider that permits your volume (e.g. MapTiler, Stadia, Thunderforest) per the [OSM tile usage policy](https://operations.osmfoundation.org/policies/tiles/). |
| `NEXT_PUBLIC_MAP_TILE_ATTRIBUTION` | optional | yes | HTML attribution for your tile provider. Defaults to OpenStreetMap contributors. |

### Not needed

- **No service-role key** is used by the app. Never add `SUPABASE_SERVICE_ROLE_KEY` to a `NEXT_PUBLIC_` variable.
- `VERCEL_URL` is set automatically by Vercel.

### Where to find Supabase values

- **Local:** run `npx supabase status` — use `API URL` and `anon key`.
- **Hosted:** Supabase Dashboard → Project Settings → API (Project URL and the `anon` / publishable key).

### Behaviour when unset

If the Supabase variables are missing the app still builds and runs, showing a setup notice instead of data, and `/api/*` returns `503`.
