<div align="center">

<img src="public/logo-lockup-800.png" alt="HoYoDex" width="440">

**The open, community-run index of every HoYoverse game.**

[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-38bdf8.svg?style=flat-square)](LICENSE)
[![Content: CC BY-SA 4.0](https://img.shields.io/badge/Content-CC_BY--SA_4.0-a78bfa.svg?style=flat-square)](https://creativecommons.org/licenses/by-sa/4.0/)
[![Astro](https://img.shields.io/badge/Astro-7-fbbf24.svg?style=flat-square)](https://astro.build)
[![Deploy](https://img.shields.io/badge/Vercel-000000.svg?style=flat-square&logo=vercel)](https://vercel.com)

[www.hoyodex.com](https://www.hoyodex.com) · [Wiki](https://genshin-impact.fandom.com) · [Contributing](CONTRIBUTING.md) · [Deploying](VERCEL.md)

</div>

---

## What this is

HoYoDex indexes characters, lore, mechanics and data across the HoYoverse —
Genshin Impact, Honkai: Star Rail, Zenless Zone Zero, Honkai Impact 3rd,
Tears of Themis and the earlier Honkai titles — as a single fast, searchable,
ad-free site.

Everything here is free software and free content. No ads, no trackers, no
paywalls, no login required to read anything.

## How it works

The site is a static build over content pulled from the
[HoYoverse Universe Index](https://genshin-impact.fandom.com) via the MediaWiki
Action API.

```
MediaWiki API  ──▶  Content Layer loader  ──▶  Astro build (SSR + static)  ──▶  Vercel
 (2,000+ pages)      (incremental cache)        (2,085 routes)          (Workers)
```

Two details worth knowing before you touch the pipeline:

**Ingest is incremental.** `src/loaders/mediawiki.ts` lists every page with its
revision id first — cheap, about 5 requests — and only calls the expensive
`action=parse` endpoint for pages whose revision changed since the last build.
A cold build takes ~5 minutes; a warm one takes ~25 seconds. If you change how
HTML is transformed, bump `TRANSFORM_VERSION` in that file or your fix will
silently apply only to pages that happened to be edited upstream.

**Game attribution comes from universe codes.** The wiki tags pages with codes
rather than game names — `Zhongli (YS-MU)`, `Acheron (BX-IZ)`, `Luke Pearce (WS-MU)`.
`src/lib/games.ts` maps the two-letter prefix to a game:

| Code | Game | Code | Game |
|------|------|------|------|
| `YS` | Genshin Impact | `WS` | Tears of Themis |
| `BX` | Honkai: Star Rail | `B2` / `FM` | Guns GirlZ |
| `ZZ` | Zenless Zone Zero | `B1` | Honkai Gakuen |
| `B3` | Honkai Impact 3rd | | |

Resolution is layered — title code, then a majority vote over category codes,
then plain game names in category text. That attributes ~81% of pages; the rest
(voice actors, staff, meta pages) genuinely belong to no single game.

## Running it locally

Requires Node 22.12+ and pnpm.

```bash
pnpm install
pnpm dev                          # full ingest on first run (~5 min)
HOYODEX_PAGE_LIMIT=50 pnpm dev    # 50 pages only — use this while iterating
```

| Command | Does |
|---------|------|
| `pnpm dev` | Dev server at `localhost:4321` |
| `pnpm build` | Production build into `dist/` |
| `pnpm preview` | Serve the build through Workers locally |

The content cache lives in `.astro/`. Delete it to force a full refetch.

## Layout

```
src/
├── lib/mediawiki.ts       MediaWiki API client — rate limited, maxlag aware
├── lib/games.ts           Universe-code → game taxonomy
├── loaders/mediawiki.ts   Content Layer loader with revision caching
├── content.config.ts      Collection schema
├── components/            Astro components + the React search island
├── pages/                 Routes
└── styles/global.css      Tailwind theme + rendered-wiki-HTML styling

public/                    Static assets, including the served brand marks
vercel.json                Vercel headers + redirects config
```

## Deploying

Vercel builds this repo directly on push to `main` — see [VERCEL.md](VERCEL.md)
for build settings and a note on keeping content fresh.

## Documentation

| | |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | How the ingest pipeline and rendering work, and why |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Setup, conventions, and what belongs here vs. the wiki |
| [ATTRIBUTION.md](ATTRIBUTION.md) | The three licences that apply and our obligations |
| [VERCEL.md](VERCEL.md) | Deployment settings and content freshness |
| [GOVERNANCE.md](GOVERNANCE.md) | How decisions get made |
| [SUPPORT.md](SUPPORT.md) | Where to ask for help |
| [SECURITY.md](SECURITY.md) | Reporting vulnerabilities |
| [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) | Expected behaviour |
| [ROADMAP.md](ROADMAP.md) | What is planned, and what deliberately is not |
| [PRIVACY.md](PRIVACY.md) | What the site collects (nothing) and who else sees traffic |
| [CHANGELOG.md](CHANGELOG.md) | What changed |

## Licensing

Two licences apply, and the distinction matters:

- **Code** — [AGPL-3.0-or-later](LICENSE). If you run a modified version of this
  site as a network service, you must offer your users its source.
- **Wiki content** — [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/),
  inherited from the upstream wiki. Every page links back to its source and
  states the licence.

Game assets, names and trademarks belong to COGNOSPHERE PTE. LTD. / HoYoverse
and are used here under fair use for identification and commentary.

## Not affiliated

HoYoDex is an unofficial fan project. It is not affiliated with, endorsed by, or
sponsored by COGNOSPHERE PTE. LTD., miHoYo, or HoYoverse.
