import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  site: 'https://asher-bosiang.github.io',
  base: process.env.PUBLIC_BASE_PATH || '/',
  output: 'static',
  devToolbar: { enabled: false },
  integrations: [react(), mdx()],
  vite: { plugins: [tailwindcss()] },
});
