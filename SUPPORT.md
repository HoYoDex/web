# Getting help

## Something on the site is wrong

**Wrong facts, missing pages, typos in article text** →
[edit the wiki](https://genshin-impact.fandom.com). Article content is not in this
repository; the site renders it. Your edit appears at the next build.

**Broken layout, a page that will not load, a bug** →
[open an issue](https://github.com/HoYoDex/web/issues/new/choose).

## I want to run or modify this

Start with the [README](README.md) for setup, then
[ARCHITECTURE.md](ARCHITECTURE.md) for how the pieces fit.

Use `HOYODEX_PAGE_LIMIT=50 pnpm dev` while developing. A full ingest makes about
2,000 requests to a volunteer-run wiki; there is no reason to do that repeatedly
because you are adjusting CSS.

## I have a question that is not a bug

[GitHub Discussions](https://github.com/HoYoDex/web/discussions).

## Security

Do not open a public issue. See [SECURITY.md](SECURITY.md).

## What is not supported

- Requests to add game data the upstream wiki does not have — write it there
  first.
- Help with datamining, private servers, or account modification.
- Anything requiring redistribution of HoYoverse game assets.
