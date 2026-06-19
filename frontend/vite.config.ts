import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [],
      includeManifestIcons: false,
      manifest: {
        id: '/',
        name: 'Ferry & Flight',
        short_name: 'FerryFlight',
        description: 'Check ferry and flight schedules',
        theme_color: '#010102',
        background_color: '#010102',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ['**/*.{js,css,html,webmanifest}'],
        globIgnores: ['**/google*.html'],
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/schedules\/ferry$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'ferry-schedules',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60,
              },
              networkTimeoutSeconds: 10,
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
        ],
      },
    }),
  ],
  server: {
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
