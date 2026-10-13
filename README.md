# OpenDive Atlas

A community-maintained atlas of the world's dive sites, marine life, and local diving knowledge.

**Live site: [opendiveatlas.org](https://opendiveatlas.org)**

OpenDive Atlas is an open-source web app that helps scuba divers **discover dive sites**, **learn which marine life lives there**, and **contribute sightings, photos and ratings**.

> Open the app → explore the global map → pick a dive site → see what lives there → browse photos → log a sighting → help the community.

## Features

| Area | What you get |
| --- | --- |
| 🗺️ **Global dive map** | Interactive Leaflet + OpenStreetMap map, search, filters (Reef, Wreck, Shore, Boat, Freshwater, Beginner, Advanced), colour-coded by experience level |
| 📍 **Dive site directory** | Name, country, region, coordinates, dive type, experience level, visibility, temperature, max depth, typical current, description, access notes, photo gallery |
| 🐠 **Marine life catalog** | Species profiles with common/scientific name, category, IUCN status, description, photos and where to see them |
| 🔗 **Site ↔ species** | Curated "commonly sighted" list (with frequency) merged with live community sighting counts |
| 👤 **Authentication** | Email/password sign-up & login (Supabase Auth), profile management |
| 📸 **Community sightings** | Log sightings with date, count, depth, notes and up to 6 photos uploaded to Supabase Storage |
| ⭐ **Ratings & reviews** | Rate marine life, visibility, photography and difficulty; aggregated per site |
| 📱 **Responsive** | Mobile-first layouts, collapsible map list, accessible forms and lightbox |
| ✍️ **Community site data** | 200+ starter dive sites flagged as unverified; signed-in divers confirm or correct details and suggest new sites, reviewed by admins |
| 🛡️ **Admin** | Create/edit dive sites & species, curate site species, upload credited photos (incl. the homepage hero), moderate sightings/reviews/photos |
| 🔌 **Public API** | Read-only JSON + GeoJSON endpoints |

## Tech stack

- **Frontend:** Next.js 15 (App Router, Server Components, Server Actions), TypeScript, Tailwind CSS v4, shadcn/ui (Radix)
- **Backend:** Supabase — PostgreSQL, Row Level Security, Auth, Storage
- **Maps:** Leaflet + react-leaflet with OpenStreetMap tiles
- **Validation:** Zod (shared by forms and server actions)
- **Deployment:** Vercel

## Quick start (local)

Prerequisites: Node.js ≥ 20.9 (22 recommended), Docker (for the local Supabase stack).

```bash
git clone https://github.com/nohearseeno/opendive-atlas.git
cd opendive-atlas
npm install

# 1. Start Supabase locally (Postgres, Auth, Storage, Studio) — applies migrations + seed
npx supabase start

# 2. Configure env — copy the "API URL" and "anon key" printed by the previous command
cp .env.example .env.local

# 3. Run the app
npm run dev
```

Open http://localhost:3000. Supabase Studio runs at http://localhost:54323 and the local email inbox (for sign-up confirmations) at http://localhost:54324.

### Make yourself an admin

Sign up in the app, then run in Studio's SQL editor (or `psql`):

```sql
update public.profiles set role = 'admin' where username = 'your_username';
```

Roles: `user` (default), `moderator` (moderate community content), `admin` (moderation + manage sites/species).

### Useful scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run lint` · `npm run typecheck` | ESLint · TypeScript |
| `npm run db:reset` | Re-create the local DB from migrations + `supabase/seed.sql` |
| `npm run db:push` | Apply migrations to the linked remote project |
| `npm run db:types` | Regenerate `database.types.ts` from the local DB |
| `npm run seed:verify-photos` | Check seed Wikimedia Commons photos and fetch author/licence |

## Documentation

- [Architecture & folder structure](docs/ARCHITECTURE.md) — clean architecture layers, component hierarchy diagrams
- [Database](docs/DATABASE.md) — ERD, tables, RLS policies, migrations, seed data
- [API](docs/API.md) — public REST endpoints and server actions
- [Environment variables](docs/ENVIRONMENT.md)
- [Deployment guide](docs/DEPLOYMENT.md) — Supabase + Vercel
- [Contributing](CONTRIBUTING.md) · [Roadmap](ROADMAP.md)

## Seed data

**Starter dataset (migration `…0010`):** 211 well-known dive sites across the Caribbean & Florida, Indo-Pacific, Red Sea & Mediterranean and the Americas/Africa, published as **unverified** starter entries (approximate coordinates and typical conditions) for the community to confirm.

**Reference seed (`seed.sql`):** ten fully described dive sites across Florida (Blue Heron Bridge, Molasses Reef, USS Oriskany), Bonaire (Salt Pier, Hilma Hooker), Cozumel (Palancar Reef, Santa Rosa Wall), Hawaii (Molokini Crater) and Australia (Cod Hole, Osprey Reef), 33 species, 64 site–species links and reference photos from Wikimedia Commons.

Coordinates are approximate and for orientation only. **Always confirm entry points, conditions and permits with a local operator.**

## Licence

- **Code:** [MIT](LICENSE).
- **Photographs are not covered by the MIT licence.** Featured photography (such as the homepage photo of a long-spined squirrelfish by Michael Davis) is © its photographer, all rights reserved, and is stored in Supabase Storage rather than in this repository.
- Photos uploaded by divers with sightings are contributed under CC BY 4.0. Reference photos keep their original Wikimedia Commons licences (see each photo's source link).
- Map data © OpenStreetMap contributors.
