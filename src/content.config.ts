import { defineCollection, z } from 'astro:content';
import { mediaWikiLoader } from './loaders/mediawiki';
import { GAMES } from './lib/games';

// One loader endpoint per distinct wiki. `honkai-gakuen` shares
// `guns-girlz`'s endpoint (see games.ts) and is deliberately excluded here —
// ingesting it again would duplicate the same pages under the wrong game.
const WIKI_ENDPOINTS: Record<string, string> = Object.fromEntries(
  GAMES.filter((g) => g.slug !== 'honkai-gakuen').map((g) => [g.slug, g.endpoint])
);

const wiki = defineCollection({
  loader: mediaWikiLoader({
    endpoints: WIKI_ENDPOINTS,
    userAgent: 'HoYoDexBot/0.1 (https://www.hoyodex.com; tech@hoyodex.com)',
    namespaces: [0],
    concurrency: 6,
    // Set HOYODEX_PAGE_LIMIT=50 for a fast local build.
    limit: process.env.HOYODEX_PAGE_LIMIT ? Number(process.env.HOYODEX_PAGE_LIMIT) : undefined,
  }),
  schema: z.object({
    title: z.string(),
    displayTitle: z.string(),
    game: z.string(),
    pageid: z.number(),
    revid: z.number(),
    transformVersion: z.number(),
    updated: z.string(),
    categories: z.array(z.string()),
    sections: z.array(z.object({ level: z.number(), line: z.string(), anchor: z.string() })),
    sourceUrl: z.string().url(),
  }),
});

export const collections = { wiki };
