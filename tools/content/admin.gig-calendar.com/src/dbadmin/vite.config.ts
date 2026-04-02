import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  base: './', // Ensures relative paths in index.html
  build: {
    outDir: '/home/james/projects/gig-calendar/docs/content/admin.gig-calendar.com/dbadmin/dist/',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'index.html'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:8080' // Adjust to match your Go webserver port
    }
  }
});