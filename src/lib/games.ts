/**
 * The HoYoverse catalogue.
 *
 * The upstream wiki does not tag pages with game names. It uses a universe-code
 * suffix on categories — "Albedo (YS-MU)", "Acheron (BX-IZ)", "Luke Pearce (WS-MU)".
 * The first pair of letters is the game; the second identifies the specific
 * universe/timeline within it (MU = main universe, and ~40 others).
 *
 * Matching on those codes is far more reliable than matching on prose, so that
 * is what we do. Codes were derived from all 2,472 categories on the wiki.
 */

export interface Game {
  slug: string;
  name: string;
  short: string;
  /** Universe-code prefixes that identify this game upstream. */
  codes: string[];
  /** Fallback: plain-name fragments used in uncoded category names. */
  nameHints: string[];
  released: string;
  accent: string;
  blurb: string;
}

export const GAMES: Game[] = [
  {
    slug: 'genshin-impact',

    name: 'Genshin Impact',
    short: 'Genshin',
    codes: ['YS'],
    nameHints: ['Genshin Impact', 'Teyvat'],
    released: '2020-09-28',
    accent: '#5bc0eb',
    blurb: 'Open-world action RPG across the seven nations of Teyvat.',
  },
  {
    slug: 'honkai-star-rail',

    name: 'Honkai: Star Rail',
    short: 'Star Rail',
    codes: ['BX'],
    nameHints: ['Honkai: Star Rail', 'Star Rail'],
    released: '2023-04-26',
    accent: '#a78bfa',
    blurb: 'Turn-based space fantasy aboard the Astral Express.',
  },
  {
    slug: 'zenless-zone-zero',

    name: 'Zenless Zone Zero',
    short: 'ZZZ',
    codes: ['ZZ'],
    nameHints: ['Zenless Zone Zero', 'New Eridu'],
    released: '2024-07-04',
    accent: '#fbbf24',
    blurb: 'Urban fantasy action in New Eridu and the Hollows.',
  },
  {
    slug: 'honkai-impact-3rd',

    name: 'Honkai Impact 3rd',
    short: 'Honkai 3rd',
    codes: ['B3'],
    nameHints: ['Honkai Impact 3rd'],
    released: '2016-10-14',
    accent: '#f472b6',
    blurb: 'The long-running action game of Valkyries and the Honkai.',
  },
  {
    slug: 'tears-of-themis',

    name: 'Tears of Themis',
    short: 'Themis',
    codes: ['WS'],
    nameHints: ['Tears of Themis', 'Stellis'],
    released: '2020-07-30',
    accent: '#34d399',
    blurb: 'Romance detective visual novel set in Stellis City.',
  },
  {
    slug: 'guns-girlz',

    name: 'Guns GirlZ',
    short: 'Guns GirlZ',
    codes: ['B2', 'FM'],
    nameHints: ['Guns GirlZ', 'Honkai Impact 2nd'],
    released: '2014-10-01',
    accent: '#fb7185',
    blurb: 'Honkai Impact 2nd — the side-scrolling predecessor to Honkai Impact 3rd.',
  },
  {
    slug: 'honkai-gakuen',

    name: 'Honkai Gakuen',
    short: 'Gakuen',
    codes: ['B1'],
    nameHints: ['Honkai Gakuen'],
    released: '2012-01-01',
    accent: '#94a3b8',
    blurb: 'The original Honkai Gakuen, where the Kaslana story begins.',
  },
];

export const GAME_BY_SLUG = new Map(GAMES.map((g) => [g.slug, g]));

const GAME_BY_CODE = new Map<string, Game>();
for (const g of GAMES) for (const c of g.codes) GAME_BY_CODE.set(c, g);

/** Universe codes like "(YS-MU)", anywhere in a title or category. */
const CODE_RE = /\(([A-Z0-9]{2})-([A-Z0-9]+)\)/g;

export function universeCode(text: string): { game: string; universe: string } | undefined {
  CODE_RE.lastIndex = 0;
  const m = CODE_RE.exec(text);
  return m ? { game: m[1], universe: m[2] } : undefined;
}

/**
 * Attribute a page to a game, in descending order of confidence:
 *
 *   1. A universe code in the page's own title — "Nod-Krai (YS-MU)". This also
 *      covers subpages such as "Fu Hua (B3-MU-0)/Appearance", whose parent
 *      carries the code.
 *   2. A majority vote over universe codes in the page's categories. Pages
 *      legitimately span games (a character with variants in three titles), so
 *      the most-represented game wins rather than the first seen.
 *   3. Plain game names in category text — "Genshin Impact Locations". The wiki
 *      is not fully migrated to codes, so this recovers a long tail.
 *
 * Some pages genuinely belong to no game (voice actors, real staff, meta pages)
 * and correctly return undefined.
 */
export function gameForCategories(categories: string[], title = ''): Game | undefined {
  const byCode = (code: string | undefined) =>
    code ? GAMES.find((g) => g.codes.includes(code)) : undefined;

  const fromTitle = byCode(universeCode(title)?.game);
  if (fromTitle) return fromTitle;

  const votes = new Map<Game, number>();
  for (const c of categories) {
    CODE_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = CODE_RE.exec(c))) {
      const g = byCode(m[1]);
      if (g) votes.set(g, (votes.get(g) ?? 0) + 1);
    }
  }
  let best: Game | undefined;
  let bestCount = 0;
  for (const [game, n] of votes) if (n > bestCount) [best, bestCount] = [game, n];
  if (best) return best;

  const hay = categories.join(' | ').toLowerCase();
  return GAMES.find((g) => g.nameHints.some((h) => hay.includes(h.toLowerCase())));
}

/** Every game a page touches — a character may appear across several. */
export function gamesForCategories(categories: string[], title = ''): Game[] {
  const seen = new Set<Game>();
  for (const text of [title, ...categories]) {
    CODE_RE.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = CODE_RE.exec(text))) {
      const g = GAMES.find((x) => x.codes.includes(m![1]));
      if (g) seen.add(g);
    }
  }
  if (!seen.size) {
    const g = gameForCategories(categories, title);
    if (g) seen.add(g);
  }
  return GAMES.filter((g) => seen.has(g));
}
