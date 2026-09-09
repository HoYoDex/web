# Deploying on Vercel

This project deploys through Vercel's Git integration — connect the repo in
the dashboard and it builds on every push to `main`.

## Project settings

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `pnpm build` (auto-detected) |
| Output directory | `.vercel/output` (auto-detected via `@astrojs/vercel`) |
| Install command | `pnpm install` |
| Node.js version | 22.x |

The `@astrojs/vercel` adapter is already wired into `astro.config.mjs`. No
`vercel.json` build config is needed beyond what's committed — that file only
carries security headers and the apex→www redirect.

## Custom domain

The site is served from **`www.hoyodex.com`**, not the apex. `site` in
`astro.config.mjs`, the sitemap, `robots.txt` and `security.txt` all assume
`www` — if that ever changes, update them together or canonical URLs split
across two hostnames.

In **Project → Settings → Domains**:

1. Add `www.hoyodex.com` and set it as the **primary** domain.
2. Add `hoyodex.com` (the apex) as a secondary domain — Vercel will redirect
   it to `www` automatically once a primary is set. The redirect rule in
   `vercel.json` is a backstop in case that's ever reconfigured.

## Environment variables

| Variable | Purpose |
|---|---|
| `HOYODEX_PAGE_LIMIT` | Caps pages ingested per wiki. Leave unset in production. |

Set these under **Project → Settings → Environment Variables**, not in
`vercel.json` — secrets don't belong in a committed file.

## SSR and caching

Wiki article pages (`src/pages/wiki/[...slug].astro`) render on demand via
Vercel's Node runtime rather than being fully static — see
[ARCHITECTURE.md](ARCHITECTURE.md) for why. With 40k+ articles on some wikis,
most pages get too little traffic to stay warm in Vercel's own edge cache, so
without a second cache layer nearly every view would re-fetch from Fandom —
expensive in function invocations, CPU time, and load on someone else's
infrastructure.

That second layer is a Redis-backed durable cache
(`src/lib/pageCache.ts`, via `@upstash/redis`), keyed by page/nav, surviving
across edges, regions and deploys. A page is served straight from Redis with
no Fandom call at all once cached; entries older than an hour (articles) or
six hours (nav trees) are still served instantly but trigger a background
refresh via `waitUntil` (`@vercel/functions`) so the *next* visitor gets the
update, without the current request paying for it.

**Setup:** in the Vercel dashboard, **Storage → Create Database → Upstash →
Redis** (or connect an existing Upstash database), then attach it to this
project — Vercel wires in `KV_REST_API_URL`/`KV_REST_API_TOKEN` (or
`UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN`, either name is
supported) automatically, no manual env var entry needed. Until that's done,
`pageCache.ts` degrades to a no-op — every request live-fetches from Fandom
exactly like before this cache existed, so the site keeps working either way.

## Content freshness

Unlike a fully static build, SSR pages fetch on request, so wiki edits appear
without a redeploy for those routes, and a brand-new page created upstream
resolves on first request via a live title search
(`src/pages/wiki/[...slug].astro`) even before the next build. Statically-
generated routes (the homepage, game listings, the search index) still only
refresh on a new deployment.

`.github/workflows/rebuild.yml` triggers a redeploy hourly to keep those
routes close to current. To wire it up:

1. In the Vercel dashboard: **Project → Settings → Git → Deploy Hooks**,
   create a hook targeting `main` and copy its URL.
2. In the GitHub repo: **Settings → Secrets and variables → Actions**, add
   `VERCEL_DEPLOY_HOOK_URL` with that value.

Without the secret set, the workflow fails loudly (rather than silently
no-op'ing) so a missing hook doesn't go unnoticed. Adjust the cron schedule
in the workflow file if hourly is more or less than you need.
