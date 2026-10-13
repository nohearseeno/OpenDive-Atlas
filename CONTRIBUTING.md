# Contributing to OpenDive Atlas

Thanks for helping build an open atlas of the underwater world! Contributions of all kinds are welcome: code, dive site data, species information, photos, translations, docs and bug reports.

## Ways to contribute

- **Report a bug / suggest a feature** — open a GitHub issue with steps to reproduce or a clear use case.
- **Add or correct data** — dive sites and species live in `supabase/seed.sql` (for the reference dataset) or can be added through the admin UI on a running instance. Cite your sources in the PR.
- **Write code** — pick an issue labelled `good first issue` or something from the [roadmap](ROADMAP.md).

## Development setup

See the [README quick start](README.md#quick-start-local). In short: `npm install`, `npx supabase start`, copy `.env.example` to `.env.local`, `npm run dev`.

## Project structure

The app follows a layered (clean) architecture — please keep dependencies pointing inwards:

```
domain  ←  infrastructure  ←  application  ←  app/components (presentation)
```

- `src/domain` — entities, constants and Zod schemas. **No framework or Supabase imports.**
- `src/infrastructure` — Supabase clients and repositories (all database access). Map rows to domain entities.
- `src/application` — session/authorisation guards, server actions, filter parsing.
- `src/app`, `src/components` — routes and UI. Pages call repositories/actions; components never query the database directly.

Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Database changes

1. Create a migration: `npx supabase migration new describe_change` and write SQL in `supabase/migrations/`.
2. **Every new table must enable RLS and have explicit policies.** Never rely on the client for authorisation.
3. Apply locally with `npm run db:reset` and verify with `npx supabase db lint`.
4. Update `src/infrastructure/supabase/database.types.ts` (`npm run db:types`) and `docs/DATABASE.md`.
5. Never edit a migration that has already been merged — add a new one.

## Coding guidelines

- TypeScript strict mode; avoid `any`.
- Validate all user input with Zod schemas in `src/domain/schemas.ts`, on the server.
- Prefer Server Components; add `"use client"` only for interactivity.
- Use shadcn/ui primitives in `src/components/ui` and Tailwind tokens (`bg-primary`, `text-muted-foreground`, …) rather than hard-coded colours.
- Accessibility: label every control, keep keyboard navigation working, provide alt text.
- Run `npm run lint && npm run typecheck && npm run build` before pushing.

## Commit & PR process

1. Fork and create a branch: `feat/short-description` or `fix/short-description`.
2. Keep PRs focused; include screenshots for UI changes.
3. Use clear commit messages (Conventional Commits encouraged: `feat:`, `fix:`, `docs:`…).
4. CI must pass (lint, typecheck, build, database migrations).
5. A maintainer will review; please respond to feedback within a couple of weeks.

## Data & photo licensing

- Only submit text you wrote or that is openly licensed, with attribution.
- Reference photos must be openly licensed (e.g. CC BY, CC BY-SA, public domain) and include author, licence and source URL.
- Photos uploaded through the app are licensed CC BY 4.0 by the uploader.

## Code of conduct

Be kind and constructive. Harassment, discrimination or personal attacks are not tolerated. Maintainers may remove content or contributors that violate this.

## Security

Please **do not** open public issues for security vulnerabilities. Email the maintainers or use GitHub's private vulnerability reporting.
