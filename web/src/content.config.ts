import { defineCollection, z } from 'astro:content';
import { mediaWikiLoader } from './loaders/mediawiki';

const WIKI_ENDPOINT = 'https://hoyodex.miraheze.org';

const wiki = defineCollection({
  loader: mediaWikiLoader({
    endpoint: WIKI_ENDPOINT,
    userAgent: 'HoYoDexBot/0.1 (https://www.hoyodex.com; contact@hoyodex.com)',
    namespaces: [0],
    concurrency: 6,
    // Set HOYODEX_PAGE_LIMIT=50 for a fast local build.
    limit: process.env.HOYODEX_PAGE_LIMIT ? Number(process.env.HOYODEX_PAGE_LIMIT) : undefined,
  }),
  schema: z.object({
    title: z.string(),
    displayTitle: z.string(),
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
