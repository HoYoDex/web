import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { gameForCategories } from '../lib/games';

/**
 * Flat search index, built at compile time and fetched by the search island.
 * Kept deliberately small (title + game + a few categories) so it stays a
 * single cheap download rather than something needing a server.
 */
export const GET: APIRoute = async () => {
  const pages = await getCollection('wiki');

  const index = pages.map((p) => ({
    i: p.id,
    t: p.data.displayTitle,
    g: gameForCategories(p.data.categories, p.data.title)?.slug ?? '',
    c: p.data.categories.slice(0, 6),
  }));

  return new Response(JSON.stringify(index), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
};
