import { defineCollection, z } from 'astro:content';
import { mediaWikiLoader } from './loaders/mediawiki';

const WIKI_ENDPOINTS: Record<string, string> = {
  'genshin-impact': 'https://genshin-impact.fandom.com',
  'honkai-star-rail': 'https://honkai-star-rail.fandom.com',
  'zenless-zone-zero': 'https://zenless-zone-zero.fandom.com',
  'honkai-impact-3rd': 'https://honkaiimpact3.fandom.com',
  'tears-of-themis': 'https://tearsofthemis.fandom.com',
  'guns-girlz': 'https://houkai2nd.fandom.com',
};

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
