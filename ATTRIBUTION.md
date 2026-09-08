# Attribution and licensing

Three distinct things carry three distinct licences. Getting this wrong is the
easiest way to create a real legal problem for the project, so it is spelled out
here.

## 1. The code — AGPL-3.0-or-later

Everything in this repository that is not wiki content or brand assets.
See [LICENSE](LICENSE).

The AGPL's network clause matters: **if you run a modified version of this site
as a public service, you must offer your users its complete source code.**
Deploying an unmodified copy is fine; deploying a modified one without publishing
the changes is not.

## 2. The wiki content — CC BY-SA 4.0

Article text and structure come from the
[HoYoverse Universe Index](https://hoyodex.miraheze.org), licensed
[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).

Our obligations, all of which the site currently meets:

- **Attribution** — every article page links back to its source page and names
  the licence. This is rendered from `sourceUrl` in the page footer; do not
  remove it.
- **ShareAlike** — adaptations of that content must carry the same licence.
- **Indication of changes** — content is reformatted for the web (HTML rewriting,
  restyling) but not edited for meaning.

If you add a new content source, it must be licence-compatible and must get the
same treatment. Do not add sources whose terms forbid automated access.

## 3. Brand — all rights reserved

The HoYoDex name and logo are **not** covered by the AGPL. They live in a
separate private repository. A fork of this site must replace the branding in
`public/` and the wordmark in the layout.

This is normal for free software (Firefox and Chromium do the same) and is not
a restriction on your right to fork the code.

## Game assets and trademarks

Genshin Impact, Honkai: Star Rail, Zenless Zone Zero, Honkai Impact 3rd, Tears
of Themis, their characters, names, artwork and trademarks are the property of
**COGNOSPHERE PTE. LTD. / miHoYo / HoYoverse**.

HoYoDex is an unofficial fan project, not affiliated with, endorsed by, or
sponsored by any of them. Game imagery is used for identification and commentary.
Images are hotlinked from the wiki's CDN rather than rehosted.

If you are a rights holder with a concern, contact **tech@hoyodex.com**.

## Third-party dependencies

Runtime and build dependencies carry their own licences — see `pnpm-lock.yaml`
and each package. The notable ones (Astro, React, Tailwind) are MIT.

Rajdhani and Inter are served from Google Fonts under the SIL Open Font License.
