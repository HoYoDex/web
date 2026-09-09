import type { Loader, LoaderContext } from 'astro/loaders';
import { MediaWikiClient, rewriteHtml, toSlug, sleep, type MwPageStub } from '../lib/mediawiki';
import { GAMES } from '../lib/games';

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

          for (const page of stale) {
            const id = `${gameSlug}/${toSlug(page.title)}`;
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
                sourceUrl: `${endpoint}/wiki/${encodeURIComponent(page.title.replace(/ /g, '_'))}`,
              },
            });

            store.set({
              id,
              data,
              digest: generateDigest({ revid: page.revid, v: TRANSFORM_VERSION }),
            });
            done++;
          }
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
