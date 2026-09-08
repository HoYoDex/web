# Architecture

A map of how HoYoDex is put together, for anyone about to change it.

## The shape of the problem

The site is a read-heavy, write-never encyclopedia over ~2,000 wiki articles
that change slowly. There is no user-generated content at request time, no
personalisation, and no reason for a page to be assembled per visitor.

That makes it a static site. Every route is rendered at build time and served
from Cloudflare's edge as a file. The only JavaScript that reaches a reader is
on `/search`.

This shapes every decision below. When you propose a change, the question to ask
is "does this force work to happen per request that could happen once at build?"

## Pipeline

```
  genshin-impact.fandom.com
   MediaWiki Action API
           │
           │  ① list revisions   (~5 requests, cheap)
           │  ② parse changed    (1 request per changed page, expensive)
           ▼
  src/loaders/mediawiki.ts ──── .astro/  (content store, incremental)
           │
           ▼
  Astro build ──▶ 2,085 static routes ──▶ Cloudflare Workers
```

### ① The API client — `src/lib/mediawiki.ts`

A small Action API wrapper. The important parts are not the requests but the
restraint around them:

- **Concurrency cap** (default 6) via an internal slot queue.
- **`maxlag=5`** so the wiki can tell us to back off when replication lags.
  MediaWiki returns these as `200` with an error body, so they are handled
  separately from HTTP status codes.
- **Retry with exponential backoff** on 429/5xx, honouring `Retry-After`.
- **A real User-Agent** with a contact URL, per Wikimedia's UA policy.

We are a guest on volunteer-funded infrastructure. Do not raise the concurrency
or remove the backoff to make builds faster.

`rewriteHtml()` also lives here, and its ordering is load-bearing — see the
comments in the function. Absolutising root-relative URLs must happen *before*
article links are pulled back onto local routes, or it clobbers them.

### ② The loader — `src/loaders/mediawiki.ts`

An Astro Content Layer loader. The design goal is that an unchanged page costs
nothing on rebuild.

It lists all pages with their current revision id first — about five requests —
then compares each against the content store and only calls `action=parse` for
pages whose revision actually moved. Cold build: ~5 minutes. Warm build: ~25
seconds.

**`TRANSFORM_VERSION`** is part of every page's digest. Bump it whenever
`rewriteHtml` or the stored data shape changes, or your fix will silently apply
only to pages that happened to be edited upstream since the last build. This is
the single easiest mistake to make in this codebase.

A page that fails to parse is logged and skipped rather than failing the build —
one bad article must not sink 2,000 good ones.

### Game attribution — `src/lib/games.ts`

The wiki does not tag pages with game names. It uses universe codes appended to
titles and categories: `Zhongli (YS-MU)`, `Acheron (BX-IZ)`, `Luke Pearce (WS-MU)`.

The first two letters identify the game, the rest a specific universe or
timeline within it. These were derived empirically from all 2,472 categories on
the wiki:

| Code | Game | Categories |
|------|------|-----------|
| `YS` | Genshin Impact | 285 |
| `BX` | Honkai: Star Rail | 127 |
| `ZZ` | Zenless Zone Zero | 75 |
| `B3` | Honkai Impact 3rd | 62 |
| `WS` | Tears of Themis | 49 |
| `B2`, `FM` | Guns GirlZ | 21 |
| `B1` | Honkai Gakuen | 1 |

`gameForCategories()` resolves in descending order of confidence: a code in the
page's own title, then a majority vote across coded categories, then plain game
names in category text. Roughly 81% of pages resolve. The remainder — voice
actors, staff, meta pages — genuinely belong to no game and correctly return
`undefined`.

The majority vote matters because pages legitimately span games: a character
with variants across three titles carries codes for all three.

### Rendering

- `src/pages/wiki/[...slug].astro` — one route per article, plus a TOC built
  from the parser's own section list.
- `src/pages/games/[slug].astro` — per-game listings.
- `src/pages/search-index.json.ts` — a flat JSON index (id, title, game, top
  categories) emitted at build time.
- `src/components/Search.tsx` — the only React island. It fetches that JSON once
  and ranks client-side. At ~2,000 entries this is far cheaper than a search
  service, and it works offline after first load.

### Styling

Tailwind v4, configured entirely through `@theme` in `src/styles/global.css` —
there is no `tailwind.config.js`.

`.wiki-body` is the exception to normal component styling. It styles HTML we did
not write and cannot control, including a PortableInfobox (`pi-*`) extension.
Rules there are defensive by necessity: wide content is forced to scroll inside
its own box, and upstream inline colours that assume a light background are
overridden.

## Deployment

Cloudflare builds from git on push. See [CLOUDFLARE.md](CLOUDFLARE.md), including
the caveat that wiki edits alone do not trigger a rebuild.

## Deliberate non-goals

- **No database.** Nothing at request time needs one. A future community layer
  (comments, accounts) would add D1, but the encyclopedia itself stays static.
- **No SSR for article pages.** They change daily at most.
- **No image proxying.** Images are hotlinked to the wiki's CDN, which is what
  it is there for. Rehosting would mean mirroring several GB and taking on the
  licensing of every file.
- **No client-side router.** Astro's prefetch on viewport is enough.
