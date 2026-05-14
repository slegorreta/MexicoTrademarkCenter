import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// Vite copies public/ files using copyFileSync which fails on filenames with
// spaces in some environments. This plugin copies them manually, skipping any
// file whose name contains a space.
function copyPublicSafe() {
  return {
    name: 'copy-public-safe',
    enforce: 'post' as const,
    closeBundle() {
      const publicDir = path.resolve(__dirname, 'public');
      const outDir = path.resolve(__dirname, 'dist');
      function copyDir(src: string, dest: string) {
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src)) {
          if (entry.includes(' ')) continue; // skip filenames with spaces
          const srcPath = path.join(src, entry);
          const destPath = path.join(dest, entry);
          const stat = fs.statSync(srcPath);
          if (stat.isDirectory()) {
            copyDir(srcPath, destPath);
          } else if (!fs.existsSync(destPath)) {
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
      if (fs.existsSync(publicDir)) copyDir(publicDir, outDir);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyPublicSafe()],
  publicDir: false, // disable Vite's built-in public copy; our plugin handles it
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor libraries into separate chunk to reduce main bundle size
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Split Stripe and Supabase into separate chunks as they're only needed on specific pages
          stripe: ['@stripe/react-stripe-js', '@stripe/stripe-js'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
