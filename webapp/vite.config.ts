import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    watch: {
      usePolling: true,
    },
    hmr: {
      clientPort: 5173,
      host: '0.0.0.0',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Алиас для правильного разрешения Prisma Client из backend
      '@visarun/backend/node_modules/@prisma/client': path.resolve(
        __dirname,
        '../backend/node_modules/@prisma/client/index-browser.js'
      ),
    },
  },
  define: {
    // Определяем переменные окружения для Prisma
    global: 'globalThis',
  },
});
