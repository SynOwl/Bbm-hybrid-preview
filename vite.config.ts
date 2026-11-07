import { cpSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Relative paths work on GitHub Pages project sites and packaged WebView assets.
  base: './',
  plugins: [
    react(),
    {
      name: 'copy-runtime-data-catalog',
      // The app fetches data/*.json at runtime. Vite does not copy a root-level
      // data directory by default, so include it in every production bundle
      // (GitHub Pages and packaged Android/WebView builds).
      closeBundle() {
        const source = resolve(process.cwd(), 'data');
        const target = resolve(process.cwd(), 'dist/data');
        mkdirSync(target, { recursive: true });
        cpSync(source, target, { recursive: true });
        // Seluruh aset H2H (logo, foto grup, dan foto semua member) ikut
        // masuk ke bundle agar APK/WebView dapat membacanya secara lokal.
        const h2hAssetsSource = resolve(process.cwd(), 'assets/h2h');
        const h2hAssetsTarget = resolve(process.cwd(), 'dist/assets/h2h');
        mkdirSync(h2hAssetsTarget, { recursive: true });
        cpSync(h2hAssetsSource, h2hAssetsTarget, { recursive: true });
      },
    },
  ],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
});
