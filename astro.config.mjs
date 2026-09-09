// @ts-check
import { defineConfig } from 'astro/config';
import vercel from '@astrojs/vercel';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.hoyodex.com',
  adapter: vercel(),
  integrations: [react(), sitemap()],
  vite: { plugins: [tailwind()] },
  fetchFile: null,
  prefetch: { prefetchAll: true, defaultStrategy: 'viewport' },
});

