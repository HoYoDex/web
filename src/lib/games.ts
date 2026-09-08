export interface NavItem {
  label: string;
  items?: { label: string, query: string }[];
}

export interface Game {
  slug: string;
  name: string;
  short: string;
  released: string;
  accent: string;
  blurb: string;
  nav?: NavItem[];
}

const DEFAULT_NAV: NavItem[] = [
  {
    label: 'Explore',
    items: [
      { label: 'Main Page', query: '' },
      { label: 'All Pages', query: '' },
      { label: 'Community', query: 'Community' },
    ]
  },
  {
    label: 'Characters',
    items: [
      { label: 'Playable Characters', query: 'Playable Characters' },
      { label: 'Upcoming Characters', query: 'Upcoming Characters' },
      { label: 'NPCs', query: 'NPCs' },
    ]
  },
  {
    label: 'The World',
    items: [
      { label: 'Locations', query: 'Locations' },
      { label: 'Quests', query: 'Quests' },
      { label: 'Enemies', query: 'Enemies' },
      { label: 'Artifacts', query: 'Artifacts' },
    ]
  },
  {
    label: 'Other',
    items: [
      { label: 'Weapons', query: 'Weapons' },
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
    blurb: 'Open-world action RPG across the seven nations of Teyvat.',
    nav: DEFAULT_NAV,
  },
  {
    slug: 'honkai-star-rail',
    name: 'Honkai: Star Rail',
    short: 'Star Rail',
    released: '2023-04-26',
    accent: '#a78bfa',
    blurb: 'Turn-based space fantasy aboard the Astral Express.',
    nav: DEFAULT_NAV,
  },
  {
    slug: 'zenless-zone-zero',
    name: 'Zenless Zone Zero',
    short: 'ZZZ',
    released: '2024-07-04',
    accent: '#fbbf24',
    blurb: 'Urban fantasy action in New Eridu and the Hollows.',
    nav: DEFAULT_NAV,
  },
  {
    slug: 'honkai-impact-3rd',
    name: 'Honkai Impact 3rd',
    short: 'Honkai 3rd',
    released: '2016-10-14',
    accent: '#f472b6',
    blurb: 'The long-running action game of Valkyries and the Honkai.',
    nav: DEFAULT_NAV,
  },
  {
    slug: 'tears-of-themis',
    name: 'Tears of Themis',
    short: 'Themis',
    released: '2020-07-30',
    accent: '#34d399',
    blurb: 'Romance detective visual novel set in Stellis City.',
    nav: DEFAULT_NAV,
  },
  {
    slug: 'guns-girlz',
    name: 'Guns GirlZ',
    short: 'Guns GirlZ',
    released: '2014-10-01',
    accent: '#fb7185',
    blurb: 'Honkai Impact 2nd — the side-scrolling predecessor to Honkai Impact 3rd.',
    nav: DEFAULT_NAV,
  },
  {
    slug: 'honkai-gakuen',
    name: 'Honkai Gakuen',
    short: 'Gakuen',
    released: '2012-01-01',
    accent: '#94a3b8',
    blurb: 'The original Honkai Gakuen, where the Kaslana story begins.',
    nav: DEFAULT_NAV,
  },
];

export const GAME_BY_SLUG = new Map(GAMES.map((g) => [g.slug, g]));
