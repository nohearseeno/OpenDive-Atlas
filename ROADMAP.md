# Roadmap

OpenDive Atlas is built in small, shippable phases. Items are roughly ordered by priority within each phase; contributions welcome.

## ✅ v0.1 — MVP (current)

- Global Leaflet/OpenStreetMap dive map with search and filters
- Dive site directory and detail pages (conditions, description, gallery)
- Marine life catalog and species profiles
- Site ↔ species relationships (curated + community sightings)
- Supabase Auth: sign up, login, profile management
- Community sightings with photo uploads to Supabase Storage
- Ratings for marine life, visibility, photography and difficulty
- Admin: create/edit sites and species, curate site species, moderation queue
- Public read-only JSON/GeoJSON API
- RLS-secured schema, migrations, seed data, CI

## ✅ v0.1.1

- 211 unverified starter dive sites worldwide
- Community "Suggest an edit" and "Suggest a dive site" with admin review
- Map marker clustering and directory pagination

## v0.2 — Quality & trust

- [ ] User-facing "report content" flow feeding the moderation queue
- [ ] Optional pre-moderation for new accounts (status `pending` until approved)
- [ ] Rate limiting on submissions (Postgres function or edge middleware)
- [ ] Automated tests: Vitest for domain/application, Playwright E2E for the core diver journey, pgTAP for RLS
- [ ] Image processing: server-side resizing/thumbnails, EXIF stripping (privacy)

## v0.3 — Richer discovery

- [ ] Searchable species picker (combobox) and "species seen near me"
- [ ] Seasonality: month-by-month sighting charts per species/site
- [ ] Public diver profile pages and contribution stats
- [ ] Full-text search (Postgres `tsvector`) across sites and species
- [ ] Dive site suggestions from the community (submitted → reviewed by admins)
- [ ] Nearby sites and "similar sites" recommendations

## v0.4 — Ecosystem

- [ ] Integrations with WoRMS / GBIF / iNaturalist for taxonomy and occurrence data export
- [ ] Offline-capable PWA for liveaboards
- [ ] Internationalisation (Spanish, Dutch, Japanese first)
- [ ] OAuth providers (Google, Apple, GitHub)
- [ ] Dive logbook import (UDDF / Subsurface)

## Ideas / under discussion

- Dive shop & operator directory (non-commercial, community-maintained)
- Conservation alerts (coral bleaching, closures) per site
- Citizen-science projects (e.g. shark or manta photo-ID)

Have an idea? Open an issue with the `idea` label.
