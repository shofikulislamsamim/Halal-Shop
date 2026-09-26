import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    // This repository is deployed at /Halal-Shop/ on GitHub Pages.
    // Use the project URL as Vite's public base so every generated
    // JS/CSS/asset URL resolves from the deployed site root.
    base: '/Halal-Shop/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(process.cwd(), 'index.html'),
          admin: path.resolve(process.cwd(), 'admin.html'),
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
