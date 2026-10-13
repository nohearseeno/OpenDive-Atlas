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
| 🐠 **Marine life catalog** | 300+ species profiles with common/scientific name, category, IUCN status, description, photos and where to see them; divers can suggest missing species and corrections |
| 🔗 **Site ↔ species** | Curated "commonly sighted" list (with frequency) merged with live community sighting counts |
| 👤 **Authentication** | Email/password sign-up & login (Supabase Auth), profile management |
| 📸 **Community sightings** | Log sightings with date, count, depth, notes and up to 6 photos uploaded to Supabase Storage |
| ⭐ **Ratings & reviews** | Rate marine life, visibility, photography and difficulty; aggregated per site |
| 📏 **Metric or imperial** | A header switch (m / ft) shows depths, visibility, temperatures and distances in metric or imperial across the site, forms included. First visits follow the browser's region (US → imperial); data and the API stay metric |
| 📱 **Responsive** | Mobile-first layouts, collapsible map list, accessible forms and lightbox |
| ✍️ **Community site data** | 200+ starter dive sites flagged as unverified; signed-in divers confirm or correct details and suggest new sites, reviewed by moderators |
| 🤖 **AI moderator** | Claude checks every site and species suggestion (with web search). Confident approvals go live as *Digitally reviewed*; a human moderator then marks them *Human reviewed* |
| ✨ **Find my dive** | Describe the dive you want in plain words and get site recommendations from the atlas |
| 🧭 **Trip planner** | Pick sites (from the map, site pages, Find my dive or a description) and get the best route, airports, a day-by-day plan with a topside day before every flight, and AI notes on seasons and logistics; save and share trips |
| 🐟 **Top Contributors** | Divers with 50 approved new sites are invited by email to become Top Contributor Moderators, with a squirrelfish avatar badge |
| 🛡️ **Moderation & admin** | Moderators review site and species suggestions, add/edit dive sites and moderate community content; admins also manage species, curated photos and roles — see [User roles](#user-roles) |
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

See [User roles](#user-roles) for what each role can do and how to promote a moderator.

## Two-tier review and the AI moderator

Every dive site shows how far its details have been checked:

| Label | Meaning |
| --- | --- |
| **Unverified** | Starter entry, or details no one has checked yet |
| **Digitally reviewed** | Approved by the AI moderator, not yet confirmed by a person |
| **Human reviewed** | Confirmed by a moderator |

When a diver suggests a new site, an edit, a new species or a species correction, the **AI moderator** (Claude, with web search) reviews it in the background within a few minutes:

- **Approve:** it confirmed the details (for sites, from independent sources such as dive operators). The change goes live straight away. A new or edited site is marked *Digitally reviewed*.
- **Needs a human:** plausible but unconfirmed, or anything it is unsure about. The suggestion stays in the queue with the AI's notes, checks and sources.
- **Reject:** clearly spam, abusive, nonsensical or a duplicate. The diver sees the reason on their profile.

The AI never applies edits to a site that is already *Human reviewed*; those always wait for a person.

Moderators work in **Admin → Suggestions**:

- **Dive sites** and **Species** tabs list suggestions. Each shows the AI verdict, with a button to run or re-run the AI review.
- **Awaiting human check** lists digitally reviewed sites. *Mark human reviewed* completes the second tier; *Unpublish* takes a site down.

Divers can also use **Find my dive** (`/recommend`): describe what you're after ("warm water, sharks, beginner, December") and Claude suggests matching sites from the atlas, limited to 10 requests an hour per visitor. Answers are cached for 24 hours, so a repeated search (or Back from a site page) shows the same results without calling Claude again or using up the limit. Signed-in divers also get their 30 most recent searches saved on the page, and reopening one costs nothing.

The **trip planner** (`/trip`) turns a list of sites into a travel plan. Add sites with *Add to trip* on the map, site pages and cards, Find my dive results, the planner's search box, or by describing the trip ("a week of cenote diving"). The app then works out, without AI:

- the shortest route: nearby sites (within 150 km) are grouped into areas, areas are ordered for the least travel (a round trip from your home airport if you give one), and easier sites come first in each area
- the airport for each area, from [OurAirports](https://ourairports.com/data/) data (public domain), with nearby alternatives
- a day-by-day schedule with a **topside day before every flight**, in line with Divers Alert Network guidance on flying after diving
- warnings for sites above your experience level and areas far from an airport

Claude then adds local notes, best months for each site, tips, and warnings when your dates fall outside a site's season. These notes are cached for 24 hours per route and share Find my dive's hourly limit. Anyone can plan a trip in their browser; signed-in divers can save up to 50 trips and share a read-only link.

These features need Claude API access, either keyless through workload identity federation (recommended) or with `ANTHROPIC_API_KEY`; the AI moderator also needs `AI_REVIEW_TOKEN`; see [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md#ai-features). Without them the site works as before, with human-only review.

## User roles

Every account has one role, stored in `profiles.role`. Each role includes everything the role above it in this table can do. Permissions are enforced by Postgres Row Level Security, not just hidden in the UI.

| | Diver (`user`, default) | Moderator (`moderator`) | Admin (`admin`) |
| --- | :---: | :---: | :---: |
| Browse sites, species, sightings and reviews | ✅ | ✅ | ✅ |
| Log sightings, upload photos, rate sites (own content) | ✅ | ✅ | ✅ |
| Suggest edits to a site or species, or suggest a new one | ✅ | ✅ | ✅ |
| Hide/restore or delete anyone's sightings, reviews and photos | | ✅ | ✅ |
| Review site and species suggestions (approve and apply, or reject) | | ✅ | ✅ |
| Add new dive sites and edit site details, publish, mark verified | | ✅ | ✅ |
| View unpublished (draft) sites | | ✅ | ✅ |
| Delete dive sites | | | ✅ |
| Create, edit and delete species directly | | | ✅ |
| Curate a site's "commonly sighted" species | | | ✅ |
| Add reference photos, upload curated photos, choose the homepage hero | | | ✅ |
| Change users' roles | | | ✅ |

Moderators and admins both reach the staff area at `/admin`. Moderators see Overview, Dive sites, Suggestions and Moderation; admins also see Species and Photos.

**Volunteer moderators.** Signed-in divers can apply at `/contribute/moderate`. Admins review applications under **Admin → Volunteers**, where each one shows the diver's approved site suggestions and sightings; approving promotes them to `moderator` straight away. `/contribute` explains every way to help and is the page to share when inviting people.

There is no general role-management screen. An admin can also change a role in the Supabase SQL editor:

```sql
update public.profiles set role = 'moderator' where username = 'their_username';  -- promote
update public.profiles set role = 'user'      where username = 'their_username';  -- demote
```

A database trigger stops anyone who isn't an admin from changing a role, including their own.

### Top Contributor Moderators

Divers can also earn the moderator role. Once 50 of a diver's **new dive site** suggestions have been approved, they are invited to become a **Top Contributor Moderator**. Approved edits to existing sites don't count.

1. **Invitation.** The 50th approval creates the invitation automatically. They get an email (via [Resend](https://resend.com), see [DEPLOYMENT.md](docs/DEPLOYMENT.md#top-contributor-invitation-emails)), and the invitation also appears on their profile page.
2. **Accepting.** The email link opens `/contributor/invite/<id>`. After signing in, they click **Accept invitation**. Nothing changes until they do; opening the link alone doesn't accept.
3. **Result.** Accepting adds a squirrelfish badge to their avatar wherever it appears, and promotes them from `user` to `moderator`. A diver who is already a moderator or admin keeps their role and just gets the badge.

Top Contributor Moderators have exactly the moderator permissions in the table above. Their profile page shows progress toward the invitation. An admin can remove the badge or the role with SQL:

```sql
update public.profiles set is_top_contributor = false, role = 'user' where username = 'their_username';
```

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

**Starter species (migration `…0015`):** 277 commonly encountered fish, sharks and rays, reptiles, mammals, cephalopods, crustaceans, molluscs, corals and invertebrates. They have descriptions and IUCN statuses but no photos or site links yet; sites pick up species from community sightings, and divers can suggest corrections.

**Reference seed (`seed.sql`):** ten fully described dive sites across Florida (Blue Heron Bridge, Molasses Reef, USS Oriskany), Bonaire (Salt Pier, Hilma Hooker), Cozumel (Palancar Reef, Santa Rosa Wall), Hawaii (Molokini Crater) and Australia (Cod Hole, Osprey Reef), 33 species, 64 site–species links and reference photos from Wikimedia Commons.

Coordinates are approximate and for orientation only. **Always confirm entry points, conditions and permits with a local operator.**

## Licence

- **Code:** [MIT](LICENSE).
- **Photographs are not covered by the MIT licence.** Featured photography (such as the homepage photo of a long-spined squirrelfish by Michael Davis) is © its photographer, all rights reserved, and is stored in Supabase Storage rather than in this repository.
- Photos uploaded by divers with sightings are contributed under CC BY 4.0. Reference photos keep their original Wikimedia Commons licences (see each photo's source link).
- Map data © OpenStreetMap contributors.
