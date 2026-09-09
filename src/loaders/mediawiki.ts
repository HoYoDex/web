import type { Loader, LoaderContext } from 'astro/loaders';
import { MediaWikiClient, rewriteHtml, toSlug, sleep, type MwPageStub } from '../lib/mediawiki';
import { GAMES } from '../lib/games';
import { setCachedPage } from '../lib/pageCache';

/**
 * Bump whenever `rewriteHtml` or the shape of stored data changes.
 * It is part of every page's digest, so bumping it invalidates the whole cache
 * and forces a refetch — without it, a transform fix would silently only apply
 * to pages that happened to be edited upstream since the last build.
 */
const TRANSFORM_VERSION = 3;

export interface MediaWikiLoaderOptions {
  endpoints: Record<string, string>;
  userAgent: string;
  namespaces?: number[];
  concurrency?: number;
  /** Cap pages fetched — useful for fast local iteration. */
  limit?: number;
}

/**
 * Content Layer loader for a MediaWiki install.
 *
 * The expensive call is `action=parse`, one request per page, and this wiki has
 * ~2k articles. So we do a cheap listing pass first and compare each page's
 * revision id against what's already in the store: an unchanged page costs us
 * nothing on rebuild. That turns a ~2000-request cold build into a handful of
 * requests on every subsequent one.
 */
export function mediaWikiLoader(options: MediaWikiLoaderOptions): Loader {
  return {
    name: 'mediawiki',

    async load({ store, meta, logger, parseData, generateDigest }: LoaderContext) {
      let done = 0;
      const live = new Set<string>();
      // Wikis whose listing failed this run — their existing store entries
      // must survive the prune pass below, since we never got a live list
      // to compare against. One flaky wiki must not sink the other five,
      // and must not look like every one of its pages got deleted upstream.
      const failedGames = new Set<string>();
      let firstWiki = true;

      for (const [gameSlug, endpoint] of Object.entries(options.endpoints)) {
        // A cold build hits every wiki's listing pass back-to-back — six
        // distinct hosts, but likely fronted by the same shared Cloudflare,
        // so a burst across all of them can still read as one client
        // hammering the edge. A short pause between wikis spreads that out.
        if (!firstWiki) await sleep(1500);
        firstWiki = false;

        try {
          const client = new MediaWikiClient({
            endpoint,
            userAgent: options.userAgent,
            concurrency: options.concurrency,
          });

          logger.info(`[${gameSlug}] Listing pages on ${endpoint}…`);
          let pages = await client.listPages(options.namespaces ?? [0]);
          if (options.limit) pages = pages.slice(0, options.limit);
          logger.info(`[${gameSlug}] Found ${pages.length} pages.`);

          // Add to live set
          for (const p of pages) {
            live.add(`${gameSlug}/${toSlug(p.title)}`);
          }

          const stale = pages.filter((p) => {
            const id = `${gameSlug}/${toSlug(p.title)}`;
            const existing = store.get(id);
            return (
              !existing ||
              existing.data.revid !== p.revid ||
              existing.data.transformVersion !== TRANSFORM_VERSION
            );
          });

          // Fast category fetch for Game Hubs
          const FEATURED_CATEGORIES = new Set<string>();
          const extractQueries = (items: any[]) => {
            for (const item of items) {
              if (item.query) FEATURED_CATEGORIES.add(item.query);
              if (item.items) extractQueries(item.items);
            }
          };

          const { fetchLiveNavigation } = await import('../lib/navParser');
          const liveNav = await fetchLiveNavigation(gameSlug);
          extractQueries(liveNav);

          const categoryMap = new Map<number, string[]>();
          if (stale.length > 0) {
            for (const p of pages) categoryMap.set(p.pageid, []);
            for (const cat of Array.from(FEATURED_CATEGORIES)) {
              try {
                const members = await client.fetchCategoryMembers(cat);
                for (const id of members) {
                  categoryMap.get(id)?.push(cat);
                }
              } catch (e) {
                // Ignore if category doesn't exist on this specific wiki
              }
            }
          }

          if (!stale.length) {
            logger.info(`[${gameSlug}] No page changed since the last build — using cache.`);
            continue;
          }
          logger.info(`[${gameSlug}] Updating ${stale.length} page stub(s) in store…`);

          // Bounds on the pre-warm pass specifically, so it can never blow up
          // build time the way an unbounded per-page retry loop can: a
          // build that took ~2-3 minutes before this pass existed took over
          // 20 and still hadn't finished the first time this ran, almost
          // certainly retry backoff compounding across many pages in one go.
          // Cap how many pages get warmed per wiki per run (coverage still
          // grows every subsequent build), and stop entirely for this wiki
          // after a few consecutive failures — that's a signal build egress
          // itself is having trouble reaching this wiki right now, and
          // burning the rest of the budget retrying into that isn't useful.
          const PREWARM_LIMIT = 40;
          const MAX_CONSECUTIVE_FAILURES = 3;
          let prewarmed = 0;
          let consecutiveFailures = 0;

          for (const page of stale) {
            const id = `${gameSlug}/${toSlug(page.title)}`;
            const sourceUrl = `${endpoint}/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`;
            const data = await parseData({
              id,
              data: {
                title: page.title,
                displayTitle: page.title,
                game: gameSlug,
                pageid: page.pageid,
                revid: page.revid,
                transformVersion: TRANSFORM_VERSION,
                updated: page.touched,
                categories: categoryMap.get(page.pageid) ?? [],
                sections: [],
                sourceUrl,
              },
            });

            store.set({
              id,
              data,
              digest: generateDigest({ revid: page.revid, v: TRANSFORM_VERSION }),
            });
            done++;

            // Pre-warm the durable page cache from build-time infrastructure
            // rather than leaving it to whichever visitor happens to hit this
            // page first at runtime. This matters specifically because build
            // and serverless-function egress are different IP pools on
            // Vercel — build has been reliably reaching Fandom even during
            // stretches where the SSR runtime got rate-limited/blocked, so
            // warming here makes known pages resilient to that independent
            // of whether live traffic can reach Fandom at all right now.
            // One page's parse failure shouldn't lose the rest of the batch.
            if (prewarmed >= PREWARM_LIMIT) {
              // Leave it uncached this run; next build picks up more.
            } else if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
              // Already established build egress can't reach this wiki right
              // now — don't pay retry backoff on every remaining page too.
            } else {
              try {
                const parsed = await client.parsePage(page.title);
                await setCachedPage(id, {
                  displayTitle: parsed.displaytitle,
                  html: rewriteHtml(parsed.html, endpoint, gameSlug),
                  categories: parsed.categories,
                  sections: parsed.sections.filter((s) => s.level <= 3),
                  sourceUrl,
                  updated: page.touched,
                });
                prewarmed++;
                consecutiveFailures = 0;
              } catch (err) {
                consecutiveFailures++;
                logger.error(`[${gameSlug}] Failed to pre-warm cache for "${page.title}", it'll fetch live on first visit instead: ${err}`);
              }
            }
          }
          logger.info(`[${gameSlug}] Pre-warmed ${prewarmed} of ${stale.length} changed page(s) into the durable cache.`);
        } catch (err) {
          // A transient failure on one wiki (network blip, Fandom outage)
          // must not fail the whole build for the other five — same
          // philosophy as skipping a single unparseable page.
          failedGames.add(gameSlug);
          logger.error(`[${gameSlug}] Sync failed, keeping previous data for this wiki: ${err}`);
        }
      }

      // Drop anything deleted upstream since the last build — but only for
      // wikis we actually got a fresh listing from this run.
      for (const id of store.keys()) {
        const gameSlug = id.split('/')[0];
        if (failedGames.has(gameSlug)) continue;
        if (!live.has(id)) store.delete(id);
      }

      meta.set('lastSync', new Date().toISOString());
      logger.info(`Synced ${done} page(s) across all wikis.${failedGames.size ? ` (${failedGames.size} wiki(s) skipped this run: ${[...failedGames].join(', ')})` : ''}`);
    },
  };
}
