# Security policy

Thank you for helping keep OpenDive Atlas and its contributors safe.

## Reporting a vulnerability

**Please don't open a public issue for security problems.** Instead, report them privately through GitHub:

1. Go to the repository's **Security** tab.
2. Choose **Report a vulnerability** to open a private advisory.

Include what you found, how to reproduce it, and the impact you think it has. We'll acknowledge your report within a few days, keep you updated, and credit you when the fix is released (unless you'd rather stay anonymous).

## Scope

In scope:

- The website at [opendiveatlas.org](https://opendiveatlas.org) and the code in this repository
- The database access rules (Row Level Security policies and database functions in `supabase/migrations`)
- The Supabase Edge Functions in `supabase/functions`

Out of scope:

- Denial-of-service or load testing against the live site
- Social engineering, spam, or physical attacks
- Reports from automated scanners without a demonstrated impact
- Missing security headers or best-practice suggestions with no concrete exploit (feel free to open a normal issue for these)

## Good faith

Please test only against your own accounts and data, don't access or change other people's data, and give us reasonable time to fix an issue before sharing details. We won't take legal action against research done in good faith under these guidelines.

## How the app is secured

For context when reviewing the code:

- All data access goes through Supabase with **Row Level Security** on every table; the public (anon) key is meant to be public.
- Roles (`user`, `moderator`, `admin`) are enforced in the database, and a trigger blocks role changes except by admins or trusted database functions.
- Server-only jobs (the AI moderator, AI rate limits and caching, invitation emails) use a job token stored in `public.maintenance_tokens`, which no client role can read.
- Claude is accessed through workload identity federation, so no long-lived API key is stored.
