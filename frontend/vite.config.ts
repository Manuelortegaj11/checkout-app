import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const fromRoot = (path: string): string =>
  fileURLToPath(new URL(path, import.meta.url));

const apiProxy = {
  '/api': { target: 'http://localhost:3001', changeOrigin: true },
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@app': fromRoot('./src/app'),
      '@features': fromRoot('./src/features'),
      '@shared': fromRoot('./src/shared'),
      '@store': fromRoot('./src/store'),
    },
  },
  server: { port: 3000, strictPort: true, proxy: apiProxy },
  preview: { port: 3000, strictPort: true, proxy: apiProxy },
});
