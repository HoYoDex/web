export interface NavItem {
  label: string;
  query?: string;
  items?: NavItem[];
}

export interface Game {
  slug: string;
  name: string;
  short: string;
  released: string;
  accent: string;
  blurb: string;
  nav?: NavItem[];
  /** Origin of the wiki, no trailing slash. Single source of truth for the
   * content loader, the on-demand slug fallback, and any theming that needs
   * to know where a game's wiki lives. */
  endpoint: string;
  /**
   * How much bespoke treatment a game gets. `flagship` games render through
   * their own hand-built hero component (see `src/components/heroes/`);
   * `active` and `legacy` share `ArchiveHero.astro`, themed per game via the
   * fields below rather than a from-scratch layout.
   */
  tier: 'flagship' | 'active' | 'legacy';
  /** Secondary accent for two-tone motifs — paired with `accent`. */
  secondaryAccent: string;
  /** Which CSS motif treatment (`global.css`, `.motif-*`) dresses the hero. */
  motif: 'elemental' | 'astral-rail' | 'urban-grid' | 'valkyrie' | 'detective' | 'archive';
  /** Inline SVG path content, 24x24 viewBox, stroke-based to match the rest
   * of the icon set — this game's identity mark in place of a generic dot. */
  icon: string;
  /** One line of in-universe flavour for the hero strap line. */
  tagline: string;
}

const DEFAULT_NAV: NavItem[] = [
  {
    label: 'Explore',
    items: [
      { label: 'Main Page', query: '' },
      { label: 'All Pages', query: '' },
      { label: 'Community', query: 'Community' },
      { label: 'Guidelines', items: [
          { label: 'General Guidelines', query: 'General Guidelines' },
          { label: 'Syntax Guidelines', query: 'Syntax Guidelines' }
      ]}
    ]
  },
  {
    label: 'Characters',
    items: [
      { label: 'Playable Characters', items: [
        { label: '5-Star Characters', query: '5-Star Characters' },
        { label: '4-Star Characters', query: '4-Star Characters' }
      ]},
      { label: 'Upcoming Characters', query: 'Upcoming Characters' },
      { label: 'NPCs', query: 'NPCs' },
    ]
  },
  {
    label: 'The World',
    items: [
      { label: 'Locations', query: 'Locations' },
      { label: 'Quests', items: [
        { label: 'Archon Quests', query: 'Archon Quests' },
        { label: 'Story Quests', query: 'Story Quests' },
        { label: 'World Quests', query: 'World Quests' }
      ]},
      { label: 'Enemies', items: [
        { label: 'Common Enemies', query: 'Common Enemies' },
        { label: 'Elite Enemies', query: 'Elite Enemies' },
        { label: 'Bosses', query: 'Bosses' }
      ]},
      { label: 'Artifacts', query: 'Artifacts' },
    ]
  },
  {
    label: 'Other',
    items: [
      { label: 'Weapons', items: [
        { label: 'Swords', query: 'Swords' },
        { label: 'Bows', query: 'Bows' },
        { label: 'Catalysts', query: 'Catalysts' },
        { label: 'Polearms', query: 'Polearms' },
        { label: 'Claymores', query: 'Claymores' }
      ]},
      { label: 'Items', query: 'Items' },
      { label: 'Achievements', query: 'Achievements' },
    ]
  }
];

export const GAMES: Game[] = [
  {
    slug: 'genshin-impact',
    name: 'Genshin Impact',
    short: 'Genshin',
    released: '2020-09-28',
    accent: '#5bc0eb',
    secondaryAccent: '#fbbf24',
    blurb: 'Open-world action RPG across the seven nations of Teyvat.',
    tagline: 'May all the world be blessed with fortune and joy.',
    nav: DEFAULT_NAV,
    endpoint: 'https://genshin-impact.fandom.com',
    tier: 'flagship',
    motif: 'elemental',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 2l2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6z"/>',
  },
  {
    slug: 'honkai-star-rail',
    name: 'Honkai: Star Rail',
    short: 'Star Rail',
    released: '2023-04-26',
    accent: '#a78bfa',
    secondaryAccent: '#f472b6',
    blurb: 'Turn-based space fantasy aboard the Astral Express.',
    tagline: 'May this trailblaze carry you far.',
    nav: DEFAULT_NAV,
    endpoint: 'https://honkai-star-rail.fandom.com',
    tier: 'flagship',
    motif: 'astral-rail',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16V6a2 2 0 012-2h12a2 2 0 012 2v10M4 16a2 2 0 002 2h12a2 2 0 002-2M4 16l-1.5 4M20 16l1.5 4M8 6v6M16 6v6M7 20h.01M17 20h.01"/>',
  },
  {
    slug: 'zenless-zone-zero',
    name: 'Zenless Zone Zero',
    short: 'ZZZ',
    released: '2024-07-04',
    accent: '#fbbf24',
    secondaryAccent: '#f472b6',
    blurb: 'Urban fantasy action in New Eridu and the Hollows.',
    tagline: 'On air, on time — New Eridu never sleeps.',
    nav: DEFAULT_NAV,
    endpoint: 'https://zenless-zone-zero.fandom.com',
    tier: 'flagship',
    motif: 'urban-grid',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 2L3 14h7l-1 8 11-13h-7l1-7z"/>',
  },
  {
    slug: 'honkai-impact-3rd',
    name: 'Honkai Impact 3rd',
    short: 'Honkai 3rd',
    released: '2016-10-14',
    accent: '#f472b6',
    secondaryAccent: '#a78bfa',
    blurb: 'The long-running action game of Valkyries and the Honkai.',
    tagline: 'Otherworldly beauty, world-ending power.',
    nav: DEFAULT_NAV,
    endpoint: 'https://honkaiimpact3.fandom.com',
    tier: 'active',
    motif: 'valkyrie',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 3c4 2 7 6 7 11a7 7 0 01-14 0c0-5 3-9 7-11zM12 3v17M9 9c1 1 2 1.5 3 1.5M8 13c1.5 1 2.5 1.5 4 1.5M8 17c1.5 1 2.5 1.2 4 1.2"/>',
  },
  {
    slug: 'tears-of-themis',
    name: 'Tears of Themis',
    short: 'Themis',
    released: '2020-07-30',
    accent: '#34d399',
    secondaryAccent: '#fbbf24',
    blurb: 'Romance detective visual novel set in Stellis City.',
    tagline: 'Every case has a truth worth chasing.',
    nav: DEFAULT_NAV,
    endpoint: 'https://tearsofthemis.fandom.com',
    tier: 'active',
    motif: 'detective',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v18M5 8l-2.5 5a2.5 2.5 0 005 0L5 8zm14 0l-2.5 5a2.5 2.5 0 005 0L19 8zM5 8h14M7 21h10"/>',
  },
  {
    slug: 'guns-girlz',
    name: 'Guns GirlZ',
    short: 'Guns GirlZ',
    released: '2014-10-01',
    accent: '#fb7185',
    secondaryAccent: '#94a3b8',
    blurb: 'Honkai Impact 2nd — the side-scrolling predecessor to Honkai Impact 3rd.',
    tagline: 'Where the Honkai saga first took aim.',
    nav: DEFAULT_NAV,
    endpoint: 'https://houkai2nd.fandom.com',
    tier: 'legacy',
    motif: 'archive',
    icon: '<circle cx="12" cy="12" r="8" stroke-width="2"/><path stroke-linecap="round" stroke-width="2" d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  },
  {
    slug: 'honkai-gakuen',
    name: 'Honkai Gakuen',
    short: 'Gakuen',
    released: '2012-01-01',
    accent: '#94a3b8',
    secondaryAccent: '#fb7185',
    blurb: 'The original Honkai Gakuen, where the Kaslana story begins.',
    tagline: 'Where it all began, before the Honkai had a name.',
    nav: DEFAULT_NAV,
    // Shares the Houkai Gakuen 2 wiki — no separate wiki exists for the
    // original game, so it isn't ingested as its own loader endpoint
    // (would just duplicate guns-girlz's pages under the wrong game).
    endpoint: 'https://houkai2nd.fandom.com',
    tier: 'legacy',
    motif: 'archive',
    icon: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3L2 8l10 5 10-5-10-5zM6 10.5V16c0 1 2.5 3 6 3s6-2 6-3v-5.5"/>',
  },
];

export const GAME_BY_SLUG = new Map(GAMES.map((g) => [g.slug, g]));
