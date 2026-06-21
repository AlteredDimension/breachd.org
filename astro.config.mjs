// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  integrations: [react()],
  vite: {
    build: {
      // three.js is ~865kB minified by nature; it's isolated in three-vendor
      // and lazy-loaded only with the 3D islands, so the size is intentional
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          // split heavy vendors into their own cacheable chunks so page
          // bundles stay small (three.js only loads with the 3D islands)
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('three') || id.includes('@react-three')) return 'three-vendor';
            if (id.includes('gsap')) return 'gsap';
            if (id.includes('/react') || id.includes('/react-dom') || id.includes('/scheduler')) {
              return 'react-vendor';
            }
          },
        },
      },
    },
  },
});
