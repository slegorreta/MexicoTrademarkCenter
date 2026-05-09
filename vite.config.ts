import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
