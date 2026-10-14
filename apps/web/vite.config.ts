import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
    plugins: [
        tanstackRouter({
            target: 'react',
            autoCodeSplitting: true,
        }),
        react(),
        tailwindcss(),
        cloudflare(),
        VitePWA({
            registerType: 'autoUpdate',
            workbox: {
                navigateFallback: '/index.html',
                // Exclude API routes from being handled by the service worker's navigate fallback
                // Ensures the our auth flow works correctly
                navigateFallbackDenylist: [/^\/api\//],
            },
            manifest: {
                name: 'Travel Journal',
                short_name: 'Travel Journal',
                description: 'A place to document your travels.',
                start_url: '/',
                display: 'standalone',
                background_color: '#f7f2e9',
                theme_color: '#f7f2e9',
                icons: [
                    {
                        src: '/favicon-light.svg',
                        sizes: '32x32',
                        type: 'image/svg+xml',
                    },
                    {
                        src: '/icon-light-180x180.png',
                        sizes: '180x180',
                        type: 'image/png',
                    },
                ],
            },
        }),
    ],
    server: {
        proxy: {
            '/api': {
                target: 'http://127.0.0.1:8787',
                changeOrigin: false,
            },
        },
    },
});
