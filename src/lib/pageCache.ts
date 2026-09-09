/**
 * Durable, cross-request cache for rendered wiki pages and live nav trees.
 *
 * Why this exists: `wiki/[...slug].astro` is SSR (article count makes full
 * static generation impractical), and Vercel's edge cache alone isn't enough
 * for a long-tail catalog — most pages get too little traffic to stay warm
 * in any single edge POP, so nearly every view re-fetches from Fandom. This
 * is a second cache layer, backed by Redis, that survives across edges,
 * regions and deploys, so a page only ever costs a live Fandom fetch once
 * per staleness window rather than once per (POP × TTL).
 *
 * Serving policy (stale-while-revalidate, but durable instead of ephemeral):
 *  - No entry: caller must fetch live and `set()` the result.
 *  - Entry younger than FRESH_MS: served as-is, no revalidation.
 *  - Entry older than FRESH_MS but present: served as-is, caller should
 *    kick a background refresh (see `waitUntil` usage at the call site).
 *  - Entry absent from Redis entirely after STALE_TTL_SECONDS: treated as
 *    a miss (Redis expires it for us).
 *
 * Degrades to a no-op cache (always a miss) when Redis env vars aren't
 * configured, so the site keeps working — just at today's live-fetch-every-
 * request cost — until the KV store is wired up in the Vercel dashboard.
 */

import { Redis } from '@upstash/redis';

const FRESH_MS = 60 * 60 * 1000; // 1h: served with no revalidation at all
const STALE_TTL_SECONDS = 30 * 24 * 60 * 60; // 30d: hard expiry in Redis

export interface CachedPage {
  displayTitle: string;
  html: string;
  categories: string[];
  sections: { level: number; line: string; anchor: string }[];
  sourceUrl: string;
  updated: string;
  cachedAt: number;
}

let client: Redis | null | undefined;

function getClient(): Redis | null {
  if (client !== undefined) return client;

  // Support both Vercel KV's env var names and plain Upstash's, since either
  // can end up wired to this project depending on how the store was added.
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

  client = url && token ? new Redis({ url, token }) : null;
  return client;
}

export function isPageCacheConfigured(): boolean {
  return getClient() !== null;
}

export async function getCachedPage(id: string): Promise<{ page: CachedPage; fresh: boolean } | null> {
  const redis = getClient();
  if (!redis) return null;

  const page = await redis.get<CachedPage>(`wiki-page:${id}`);
  if (!page) return null;

  return { page, fresh: Date.now() - page.cachedAt < FRESH_MS };
}

export async function setCachedPage(id: string, page: Omit<CachedPage, 'cachedAt'>): Promise<void> {
  const redis = getClient();
  if (!redis) return;

  await redis.set(`wiki-page:${id}`, { ...page, cachedAt: Date.now() }, { ex: STALE_TTL_SECONDS });
}

const NAV_FRESH_MS = 6 * 60 * 60 * 1000; // 6h — nav trees change far less often than articles
const NAV_TTL_SECONDS = 30 * 24 * 60 * 60;

export async function getCachedNav(gameSlug: string) {
  const redis = getClient();
  if (!redis) return null;

  const entry = await redis.get<{ nav: unknown; cachedAt: number }>(`wiki-nav:${gameSlug}`);
  if (!entry) return null;

  return { nav: entry.nav, fresh: Date.now() - entry.cachedAt < NAV_FRESH_MS };
}

export async function setCachedNav(gameSlug: string, nav: unknown): Promise<void> {
  const redis = getClient();
  if (!redis) return;

  await redis.set(`wiki-nav:${gameSlug}`, { nav, cachedAt: Date.now() }, { ex: NAV_TTL_SECONDS });
}
