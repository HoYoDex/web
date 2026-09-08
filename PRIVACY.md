# Privacy

HoYoDex is a static site. This page describes what that means in practice, and
it is short because the honest answer is "almost nothing happens".

## What we collect

**Nothing.** There is no analytics, no tracking pixel, no advertising network,
no fingerprinting, no A/B testing, and no account system. We do not set cookies.

There is no server-side application logic that could log you — every page is a
file generated ahead of time and served from a CDN.

## What your browser stores

Nothing that we put there. The site does not use cookies, `localStorage`,
`sessionStorage` or IndexedDB.

## What third parties see

Three, unavoidably:

| Who | Why | What they can see |
|---|---|---|
| **Cloudflare** | Hosts and serves the site | Standard request data — IP, user agent, requested URL — subject to [Cloudflare's privacy policy](https://www.cloudflare.com/privacypolicy/) |
| **Fandom CDN** | Serves article images | Your IP and referring page when an image loads. Images are hotlinked rather than rehosted |
| **Google Fonts** | Serves the two typefaces | Your IP when the font files load |

We do not receive data from any of them about you.

If you would rather not contact Google Fonts, the site remains fully legible
with fonts blocked — the CSS declares real fallback stacks.

## Search

The search page downloads a JSON index once and runs entirely in your browser.
Your queries are never sent anywhere.

## The wiki

[genshin-impact.fandom.com](https://genshin-impact.fandom.com) is a separate service run
by Fandom, with its own privacy policy. Editing there means creating an
account with them, not with us.

## Contact

Questions about this page: **tech@hoyodex.com**

## Changes

Material changes will be noted in [CHANGELOG.md](CHANGELOG.md). This document
was last updated 2026-09-08.
