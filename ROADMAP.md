# Roadmap

What is planned, roughly ordered. Nothing here is a commitment or a date — this
is a volunteer project. It exists so contributors can find something worth doing
instead of guessing.

Issues labelled [`good first issue`](https://github.com/HoYoDex/web/labels/good%20first%20issue)
are the best entry point.

## Now

- **Attribution coverage.** ~81% of pages resolve to a game via universe codes.
  The remainder are voice actors, staff and meta pages — most correctly have no
  game, but some are misses worth recovering. See `src/lib/games.ts`.
- **Content freshness.** Wiki edits do not trigger a rebuild, because Cloudflare
  builds on git push. Needs a scheduled deploy hook — see [CLOUDFLARE.md](CLOUDFLARE.md).
- **Upstream HTML edge cases.** `.wiki-body` styles markup we do not control.
  Tabbers, some galleries and a few templates still render inertly or awkwardly.

## Next

- **Structured game data.** The wiki is prose. Character stats, weapons,
  artifacts and materials are better taken from open datasets
  (Dimbreath/AnimeGameData, Enka.Network, ambr.top, StarRailRes) as typed
  collections alongside the wiki content.
- **Per-game landing pages** that are more than a page list — characters by
  element and rarity, a timeline, region navigation.
- **Better search.** Currently title and category matching over a flat index.
  Full-text would need a real index (Pagefind builds one at compile time and
  stays static).
- **i18n.** The wiki is English-only today, so this is blocked upstream.

## Later

- **Community layer.** Comments, corrections, and page watchlists. This is the
  first feature that needs state, and would bring in Cloudflare D1. The
  encyclopedia itself stays static regardless.
- **Offline support** via a service worker.

## Explicitly not planned

- **Ads or trackers.** Ever. This is the point of the project.
- **Rehosting game assets.** Images stay hotlinked to the wiki's CDN. Mirroring
  would mean gigabytes and taking on the licensing of every file.
- **Scraping Fandom.** Their terms forbid automated access and their content is
  CC BY-SA 3.0, which complicates redistribution. Not worth the risk.
- **Accounts for reading.** Nothing on this site will require a login to read.
