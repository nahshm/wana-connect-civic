import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.png', 'lovable-uploads/**/*'],
      manifest: {
        name: 'ama - Voices United, Actions Amplified',
        short_name: 'ama',
        description: 'Empowering citizens through civic engagement, community discussions, and government accountability',
        theme_color: '#0E1113',
        background_color: '#0E1113',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/pwa-icon-512.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api/],
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/zcnjpczplkbdmmovlrtv\.supabase\.co\/rest\/v1\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-v2',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 300,
              },
            },
          },
          {
            // Cache images from Supabase storage
            urlPattern: /^https:\/\/zcnjpczplkbdmmovlrtv\.supabase\.co\/storage\/v1\/object\/public\/.*\.(png|jpg|jpeg|gif|svg|webp|avif|ico)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-images-v2',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
            },
          },
          {
            // Do NOT cache videos from Supabase storage to support range requests and avoid stale 400s
            urlPattern: /^https:\/\/zcnjpczplkbdmmovlrtv\.supabase\.co\/storage\/v1\/object\/public\/.*\.(mp4|webm|ogg|mov|m4v)$/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@features": path.resolve(__dirname, "./src/features"),
      "@shared": path.resolve(__dirname, "./src/shared"),
    },
  },
  build: {
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'data-vendor': ['@supabase/supabase-js', '@tanstack/react-query']
          // UI vendor, recharts, framer-motion, and tiptap naturally code-split
          // with their lazy-loaded consumers for optimal initial load
        }
      }
    }
  }
}));
