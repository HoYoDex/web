# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Security headers on every response (CSP, HSTS, frame-ancestors, permissions
  policy) and an RFC 9116 `security.txt`.
- Initial site: 2,085 static routes generated from the HoYoverse Universe Index.
- MediaWiki Action API client with concurrency limits, `maxlag` handling and
  exponential backoff.
- Content Layer loader with revision-digest caching — cold builds ~5 minutes,
  warm builds ~25 seconds.
- Universe-code taxonomy (`YS`/`BX`/`ZZ`/`B3`/`WS`/`B2`/`B1`) attributing ~81%
  of pages to a game.
- Client-side search over a build-time JSON index, with per-game filtering.
- Per-article table of contents, breadcrumbs and category listings.
- CC BY-SA 4.0 source attribution on every article page.

[Unreleased]: https://github.com/HoYoDex/web/commits/main
