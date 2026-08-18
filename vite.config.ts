import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    // No `define` for GEMINI_API_KEY here on purpose: that key is read
    // server-side only (see src/server/services/aiService.ts via
    // process.env, Node's own env — nothing to do with Vite's `define`).
    // Wiring it into `define` would bake the raw key into the public client
    // bundle the moment any source file references
    // `process.env.GEMINI_API_KEY`, silently defeating the server-side proxy
    // this app is built around. Don't add it back.
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
            animations: ['framer-motion', 'canvas-confetti'],
            ui: ['lucide-react', 'zustand']
          }
        }
      }
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
