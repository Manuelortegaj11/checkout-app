import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const fromRoot = (path: string): string =>
  fileURLToPath(new URL(path, import.meta.url));

/**
 * La SPA siempre llama a la API en `/api`, en su mismo origen: en producción
 * Nginx reenvía esa ruta al backend y en local lo hace este proxy.
 */
const apiProxy = {
  '/api': { target: 'http://localhost:3001', changeOrigin: true },
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Los mismos alias que tsconfig.app.json (paths).
    alias: {
      '@app': fromRoot('./src/app'),
      '@features': fromRoot('./src/features'),
      '@shared': fromRoot('./src/shared'),
      '@store': fromRoot('./src/store'),
    },
  },
  // Puerto que el backend admite por CORS (CORS_ORIGIN).
  server: { port: 3000, strictPort: true, proxy: apiProxy },
  preview: { port: 3000, strictPort: true, proxy: apiProxy },
});
