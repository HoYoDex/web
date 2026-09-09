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
[ARCHITECTURE.md](ARCHITECTURE.md) for why. Vercel's edge cache handles
repeat-request caching for these automatically; nothing extra to configure.

## Content freshness

Unlike a fully static build, SSR pages fetch on request, so wiki edits appear
without a redeploy for those routes. Statically-generated routes (the
homepage, game listings, the search index) still only refresh on a new
deployment — trigger one manually or on a schedule if those need to stay current
between code pushes.
