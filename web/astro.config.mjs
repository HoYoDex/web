// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.hoyodex.com',
  adapter: cloudflare({ imageService: 'compile' }),
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwind()] },
  // Astro 7: src/fetch.ts is reserved for advanced routing. We don't use it.
  fetchFile: null,
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
});
