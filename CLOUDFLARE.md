# Deploying on Cloudflare

This project deploys through Cloudflare's own Git integration — connect the repo
in the dashboard and it builds on every push to `main`. There are no GitHub
Actions workflows here by design.

## Build settings

In **Workers & Pages → Create → Import a repository**, point it at `HoYoDex/web` and set:

| Setting | Value |
|---|---|
| Build command | `pnpm install && pnpm build` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |

Node 22.12+ is required. Set `NODE_VERSION=22` as a build environment variable
if the default image is older.

## Custom domain

The site is served from the apex domain, `hoyodex.com`. There is no `www`
hostname — `site` in `astro.config.mjs`, the sitemap, `robots.txt` and
`security.txt` all assume the apex, so adding one later means changing those
together or you get split canonical URLs.

Add `hoyodex.com` under the Worker's **Domains & Routes**. Cloudflare handles
the apex with CNAME flattening, so no ALIAS record is needed.

Optionally catch `www` anyway — people type it out of habit. A Redirect Rule
with `http.host eq "www.hoyodex.com"` → `https://hoyodex.com${uri}` (301) is
enough, and costs nothing if you never point `www` at anything.

## One thing to know about content freshness

The site is built statically from the wiki. Cloudflare rebuilds on **git push**,
so a wiki edit alone will not update the site — there is no commit to trigger a
build.

Options, in order of simplicity:

1. **Deploy hook + scheduler.** Create a deploy hook URL in the Cloudflare
   dashboard and call it on a schedule (a Cloudflare Cron Trigger, or any cron
   service). This is the least moving parts.
2. **Manual redeploy** from the dashboard when you know the wiki has changed.
3. Re-add a scheduled GitHub Action later if you want it in-repo.

A rebuild is cheap — the loader only refetches pages whose revision changed, so
a no-op rebuild takes about 25 seconds rather than the 5 minutes a cold one does.
Note that Cloudflare build environments start with an empty `.astro` cache,
so builds there are always cold unless you cache that directory.
