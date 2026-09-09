// @ts-check
import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://hoyodex.com',
  adapter: cloudflare({ imageService: 'compile' }),
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwind()] },
  fetchFile: null,
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
});
