# Contributing to HoYoDex

Thanks for helping. There are two separate places to contribute, and picking the
right one saves everybody time.

## Content vs. code

**Wrong facts, missing pages, typos in article text** belong on the
[wiki](https://hoyodex.miraheze.org), not here. This repository only *renders*
that content — a fix there flows into the next build automatically. Opening a PR
here to change article text will not work; there is no article text in this repo.

**Bugs in the site, layout problems, the ingest pipeline, new features** belong
here.

## Getting set up

```bash
git clone https://github.com/HoYoDex/web.git
cd web            # the repo is named "web"
pnpm install
HOYODEX_PAGE_LIMIT=50 pnpm dev
```

Always use `HOYODEX_PAGE_LIMIT` while developing. A full ingest hits the wiki
about 2,000 times; there is no reason to do that to someone else's server
because you are adjusting a margin.

## Before you open a PR

- `pnpm build` passes.
- No new console errors in the browser.
- The page works at 375px wide as well as on desktop.
- Wide content (tables, infoboxes) scrolls inside its own box rather than
  stretching the page.

## Style

Match what is already there. A few conventions worth stating:

- Comments explain *why*, not *what*. If the code needs a comment to say what it
  does, the code is the problem.
- The upstream wiki's HTML is arbitrary and occasionally hostile. CSS touching
  `.wiki-body` should be defensive.
- Keep JavaScript off pages that do not need it. The search page is a React
  island precisely so that the other 2,084 pages can ship none.

## Being a good guest

The wiki is run by volunteers on donated infrastructure. The API client sends a
real User-Agent, sets `maxlag`, limits concurrency and backs off on 429s. Do not
remove any of that.

## Licence

Contributions are licensed under AGPL-3.0-or-later, matching the project.
