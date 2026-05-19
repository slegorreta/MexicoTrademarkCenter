import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// Vite's built-in public copy fails on filenames with spaces in some
// environments. We disable publicDir and handle copying ourselves,
// skipping problematic filenames. In dev mode we add a static middleware.
function publicSafe() {
  const publicDir = path.resolve(__dirname, 'public');

  return {
    name: 'public-safe',
    enforce: 'post' as const,

    // Dev: serve public files ourselves
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const url = decodeURIComponent(req.url ?? '/').split('?')[0];
        const filePath = path.join(publicDir, url);
        if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
          const ext = path.extname(filePath).toLowerCase();
          const mime: Record<string, string> = {
            '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
            '.svg': 'image/svg+xml', '.gif': 'image/gif', '.webp': 'image/webp',
            '.ico': 'image/x-icon', '.txt': 'text/plain', '.xml': 'application/xml',
          };
          res.setHeader('Content-Type', mime[ext] ?? 'application/octet-stream');
          fs.createReadStream(filePath).pipe(res);
          return;
        }
        next();
      });
    },

    // Build: copy public files, skipping filenames with spaces
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist');
      function copyDir(src: string, dest: string) {
        fs.mkdirSync(dest, { recursive: true });
        for (const entry of fs.readdirSync(src)) {
          if (entry.includes(' ')) continue;
          const srcPath = path.join(src, entry);
          const destPath = path.join(dest, entry);
          if (fs.statSync(srcPath).isDirectory()) {
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

export default defineConfig({
  plugins: [react(), publicSafe()],
  publicDir: false,
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    allowedHosts: true,
    headers: {
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': "frame-ancestors *",
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          stripe: ['@stripe/react-stripe-js', '@stripe/stripe-js'],
          supabase: ['@supabase/supabase-js'],
        },
      },
    },
  },
});
