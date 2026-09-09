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
import { waitUntil } from '@vercel/functions';

/**
 * `waitUntil` requires a Vercel runtime execution context; calling it
 * anywhere that context isn't present throws synchronously. A background
 * cache refresh is an optimization, never worth crashing the page over, so
 * this swallows that failure (and just lets the promise run un-awaited,
 * best-effort, instead).
 */
export function safeWaitUntil(promise: Promise<unknown>): void {
  try {
    waitUntil(promise);
  } catch {
    promise.catch(() => {});
  }
}

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

const CACHE_TIMEOUT_MS = 2500;

/**
 * A misconfigured REST URL/token doesn't necessarily fail fast — it can hang
 * until some underlying default timeout, which may be longer than the
 * function's own execution budget. If the platform kills the function first,
 * no try/catch here ever runs. Race every Redis call against a short local
 * timeout so a bad cache config costs a couple of seconds, not the whole
 * request — this is the actual failure mode that mattered in practice, not
 * just a defensive nicety.
 */
function withTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`pageCache: ${label} timed out after ${CACHE_TIMEOUT_MS}ms`)), CACHE_TIMEOUT_MS)
    ),
  ]);
}

export async function getCachedPage(id: string): Promise<{ page: CachedPage; fresh: boolean } | null> {
  const redis = getClient();
  if (!redis) return null;

  try {
    const page = await withTimeout(redis.get<CachedPage>(`wiki-page:${id}`), 'getCachedPage');
    if (!page) return null;
    return { page, fresh: Date.now() - page.cachedAt < FRESH_MS };
  } catch (err) {
    // A cache failure (bad credentials, Redis outage, malformed value) must
    // degrade to a live Fandom fetch, never take the whole page down — same
    // principle as the per-wiki try/catch in the content loader.
    console.error('pageCache: getCachedPage failed, falling back to live fetch', err);
    return null;
  }
}

export async function setCachedPage(id: string, page: Omit<CachedPage, 'cachedAt'>): Promise<void> {
  const redis = getClient();
  if (!redis) return;

  try {
    await withTimeout(
      redis.set(`wiki-page:${id}`, { ...page, cachedAt: Date.now() }, { ex: STALE_TTL_SECONDS }),
      'setCachedPage'
    );
  } catch (err) {
    console.error('pageCache: setCachedPage failed, page just won\'t be cached this time', err);
  }
}

const NAV_FRESH_MS = 6 * 60 * 60 * 1000; // 6h — nav trees change far less often than articles
const NAV_TTL_SECONDS = 30 * 24 * 60 * 60;

export async function getCachedNav(gameSlug: string) {
  const redis = getClient();
  if (!redis) return null;

  try {
    const entry = await withTimeout(
      redis.get<{ nav: unknown; cachedAt: number }>(`wiki-nav:${gameSlug}`),
      'getCachedNav'
    );
    if (!entry) return null;
    return { nav: entry.nav, fresh: Date.now() - entry.cachedAt < NAV_FRESH_MS };
  } catch (err) {
    console.error('pageCache: getCachedNav failed, falling back to live fetch', err);
    return null;
  }
}

export async function setCachedNav(gameSlug: string, nav: unknown): Promise<void> {
  const redis = getClient();
  if (!redis) return;

  try {
    await withTimeout(redis.set(`wiki-nav:${gameSlug}`, { nav, cachedAt: Date.now() }, { ex: NAV_TTL_SECONDS }), 'setCachedNav');
  } catch (err) {
    console.error('pageCache: setCachedNav failed, nav just won\'t be cached this time', err);
  }
}
