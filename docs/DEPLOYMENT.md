# Deployment guide

Production runs on **Vercel** (Next.js) and **Supabase** (database, auth, storage).

## 1. Create the Supabase project

1. Create a project at [supabase.com/dashboard](https://supabase.com/dashboard) (choose a region close to your users).
2. Install the CLI locally (`npx supabase --version`) and link the repo:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   ```

3. Apply migrations:

   ```bash
   npm run db:push
   ```

4. Load the seed data (idempotent — safe to re-run):

   ```bash
   psql "postgresql://postgres:<db-password>@db.<project-ref>.supabase.co:5432/postgres" -f supabase/seed.sql
   ```

   Or paste `supabase/seed.sql` into **SQL Editor → New query → Run**.

5. Configure **Authentication → URL Configuration**:
   - **Site URL:** `https://opendiveatlas.org`
   - **Redirect URLs:** `https://opendiveatlas.org/auth/callback`, plus `https://*-nohearseeno.vercel.app/auth/callback` for preview deployments.
6. (Recommended) **Authentication → Emails:** configure custom SMTP for production email delivery; the built-in sender is rate-limited.
7. Check **Advisors → Security / Performance** in the dashboard — there should be no RLS warnings.

## 2. Deploy to Vercel

1. Import the GitHub repository at [vercel.com/new](https://vercel.com/new). Framework preset: **Next.js** (build `npm run build`, install `npm ci` — also set in `vercel.json`).
2. Add environment variables (see [ENVIRONMENT.md](ENVIRONMENT.md)) for Production and Preview:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (production domain)
3. Deploy. Every push to `main` deploys to production; pull requests get preview URLs.

Alternatively, install the **Supabase integration** from the Vercel Marketplace to sync the Supabase env vars automatically.

## 3. Custom domains

Production is served at **https://opendiveatlas.org**. Domains on the Vercel project:

| Domain | Behaviour |
| --- | --- |
| `opendiveatlas.org` | Primary production domain |
| `www.opendiveatlas.org` | 308 redirect → `opendiveatlas.org` |
| `opendiveatlas.com` | 308 redirect → `opendiveatlas.org` |
| `www.opendiveatlas.com` | 308 redirect → `opendiveatlas.org` |

DNS is hosted at Squarespace (the registrar). For **both** `opendiveatlas.org` and `opendiveatlas.com`, replace the default Squarespace records with:

| Host | Type | Value |
| --- | --- | --- |
| `@` | A | `216.198.79.1` |
| `@` | A | `64.29.17.1` |
| `www` | CNAME | `4024278de1ec317d.vercel-dns-017.com.` |

Remove the existing Squarespace `@` A records (`198.185.159.144/145`, `198.49.23.144/145`) and the `www` CNAME to `ext-sq.squarespace.com`. Vercel issues HTTPS certificates automatically once DNS resolves. Check status under Vercel → Project → Settings → Domains.

Set `NEXT_PUBLIC_SITE_URL=https://opendiveatlas.org` for Production, and in Supabase → Authentication → URL Configuration set **Site URL** to `https://opendiveatlas.org` and add `https://opendiveatlas.org/auth/callback` to the redirect URLs.

## 4. Create the first admin

Sign up on the deployed site, then in Supabase SQL Editor:

```sql
update public.profiles set role = 'admin' where username = '<your_username>';
```

## 5. Post-deploy checklist

- [ ] `https://opendiveatlas.org/api/health` returns `"supabaseConfigured": true`
- [ ] Map loads markers; site and species pages render
- [ ] Sign-up email arrives and the link returns to `/auth/callback` successfully
- [ ] Logging a sighting with a photo works and the photo appears in the gallery
- [ ] `/admin` is reachable for your admin account only
- [ ] Run `npm run seed:verify-photos` and apply the generated credits SQL
- [ ] Switch `NEXT_PUBLIC_MAP_TILE_URL` to a production tile provider if you expect significant traffic

## Database changes after launch

1. Add a new migration in `supabase/migrations/` (never edit applied ones).
2. Test locally with `npm run db:reset`.
3. Merge, then run `npm run db:push` (or automate it in CI with `supabase db push` using `SUPABASE_ACCESS_TOKEN` and `SUPABASE_DB_PASSWORD` secrets).

## Rollback

- **App:** Vercel → Deployments → promote a previous deployment.
- **Database:** write a forward-fixing migration; use Supabase point-in-time recovery (paid plans) for disasters.
