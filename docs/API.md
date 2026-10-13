# API

OpenDive Atlas exposes a small **public, read-only REST API** for integrations, plus **Server Actions** used by the web UI for all writes.

All responses are JSON. Successful responses are wrapped as `{ "data": ... }`; errors as `{ "error": "message" }` with an appropriate HTTP status. Public endpoints are cacheable (`s-maxage=60`). Data visibility follows Row Level Security exactly as for an anonymous visitor (or the signed-in user if cookies are sent).

## REST endpoints

### `GET /api/health`

Liveness probe.

```json
{ "status": "ok", "supabaseConfigured": true, "time": "2026-10-11T12:00:00.000Z" }
```

### `GET /api/sites`

List published dive sites with aggregated ratings and counts.

| Query | Type | Example | Notes |
| --- | --- | --- | --- |
| `q` | string | `bonaire` | Matches name, country or region (case-insensitive) |
| `type` | csv of `dive_type` | `reef,wreck` | Site matches if it has **any** of these |
| `level` | csv of `experience_level` | `beginner` | |
| `format` | `geojson` | `geojson` | Returns a GeoJSON `FeatureCollection` instead |

```bash
curl "https://<host>/api/sites?type=wreck&level=advanced"
```

```json
{
  "data": [
    {
      "id": "…", "slug": "uss-oriskany", "name": "USS Oriskany",
      "country": "United States", "region": "Florida — Pensacola (Gulf of Mexico)",
      "latitude": 30.0425, "longitude": -87.0064,
      "diveTypes": ["wreck", "boat"], "experienceLevel": "advanced",
      "visibilityM": { "min": 10, "max": 30 }, "temperatureC": { "min": 18, "max": 29 },
      "maxDepthM": 65, "typicalCurrent": "moderate",
      "description": "…", "accessNotes": "…", "isPublished": true, "isVerified": true, "updatedAt": "…",
      "ratings": { "reviewCount": 0, "marineLife": null, "visibility": null, "photography": null, "difficulty": null, "overall": null },
      "sightingCount": 0, "speciesCount": 5
    }
  ]
}
```

### `GET /api/sites/:slug`

A single site (same shape as above) plus:

- `species`: `SiteSpecies[]` — `{ species, frequency, notes, sightingCount, lastSightedOn, curated }`
- `photos`: `Photo[]` — `{ id, url, caption, attribution, license, sourceUrl, … }`

`404` if the site does not exist or is unpublished.

### `GET /api/species`

| Query | Type | Example |
| --- | --- | --- |
| `q` | string | `turtle` |
| `category` | csv of `species_category` | `shark_ray,reptile` |

Returns `Species[]`: `{ id, slug, commonName, scientificName, category, description, iucnStatus }`.

### `GET /api/species/:slug`

A species plus `sites: SpeciesSite[]` (`{ site, frequency, sightingCount }`) and `photos: Photo[]`.

### Direct Supabase access

Because all authorisation lives in RLS, third-party clients can also use the Supabase REST/JS API with the public anon key — e.g. `supabase.rpc('search_dive_sites', { q: 'cozumel' })`.

## Server Actions (UI writes)

Server Actions live in `src/application/actions/`. Each validates input with the Zod schemas in `src/domain/schemas.ts`, checks the session/role, and calls a repository. Form actions return an `ActionState`:

```ts
type ActionState = { ok: boolean; message?: string; fieldErrors?: Record<string, string[]> };
```

| Action | Who | Input (FormData) | Effect |
| --- | --- | --- | --- |
| `signUpAction` | anyone | email, password, username, next | Creates account (+ profile via trigger); redirects or asks to confirm email |
| `signInAction` | anyone | email, password, next | Signs in, redirects to `next` |
| `signOutAction` | signed in | — | Signs out |
| `updateProfileAction` | signed in | username, displayName, bio, homeCountry, certificationLevel, avatarUrl | Updates own profile |
| `createSightingAction` | signed in | siteId, speciesId, observedOn, quantity, depthM, notes, photoPaths[] | Inserts sighting + photo rows; redirects to the site |
| `deleteSightingAction` | owner / moderator | id | Deletes sighting, its photos and storage objects |
| `upsertReviewAction` | signed in | siteId, rating{MarineLife,Visibility,Photography,Difficulty}, body, divedOn | Creates or updates the user's single review for a site |
| `deleteReviewAction` | owner / moderator | id | Deletes review |
| `saveDiveSiteAction` | moderator | all dive site fields (+ id to update) | Creates/updates a site |
| `deleteDiveSiteAction` | admin | id | Deletes a site (cascades) |
| `addSiteSpeciesAction` / `removeSiteSpeciesAction` | admin | siteId, speciesId, frequency, notes | Curates "commonly sighted" list |
| `saveSpeciesAction` / `deleteSpeciesAction` | admin | species fields (+ id) | Manages species |
| `addExternalPhotoAction` | admin | externalUrl, siteId/speciesId, caption, attribution, license, sourceUrl | Adds a licensed reference photo |
| `suggestSiteEditAction` | signed in | siteId, site fields, note, confirm | Stores only the changed fields as a pending suggestion |
| `suggestNewSiteAction` | signed in | site fields, note | Stores a pending new-site suggestion |
| `withdrawSuggestionAction` | author (pending) / admin | id | Deletes the suggestion |
| `suggestSpeciesEditAction` | signed in | speciesId, species fields, note | Stores only the changed fields as a pending species suggestion |
| `suggestNewSpeciesAction` | signed in | commonName, scientificName, category, description, iucnStatus, note | Stores a pending new-species suggestion (rejects scientific names already listed) |
| `withdrawSpeciesSuggestionAction` | author (pending) / admin | id | Deletes the species suggestion |
| `reviewSpeciesSuggestionAction` | moderator | id, decision (`approve`/`reject`), reviewNote | Calls `review_species_suggestion()`, which applies an approved edit or creates the species |
| `reviewSuggestionAction` | moderator | id, decision (`approve`/`reject`), markVerified, reviewNote | Approve applies the edit or creates the site; reject records the decision |
| `respondToInviteAction` | invited diver | id, decision (`accept`/`decline`) | Accepts or declines a Top Contributor invitation; accepting grants the badge and moderator role |
| `runAiReviewAction` | moderator | kind (`site`/`species`), id | Runs or re-runs the AI moderator on a pending suggestion |
| `confirmHumanReviewAction` | moderator | siteId | Marks a digitally reviewed site as human reviewed |
| `unpublishSiteAction` | moderator | siteId | Takes a site off the map |
| `recommendAction` | anyone (rate-limited) | query | Returns up to six recommended sites with reasons |
| `moderateAction` | moderator | kind (`sighting`/`review`/`photo`), id, status | Approve / hide content |
| `deletePhotoAction` | owner / moderator | id | Deletes a photo and its storage object |

### Photo uploads

The browser uploads files directly to the `photos` Storage bucket at `<user_id>/<uuid>.<ext>` (enforced by storage RLS), then passes the paths to `createSightingAction`, which verifies each path belongs to the caller before linking it.
