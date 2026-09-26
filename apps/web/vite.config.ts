import { cloudflare } from '@cloudflare/vite-plugin';
import { sharedConfig } from '@repo/vitest-config';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vite';
import { defineConfig as testConfig } from 'vitest/config';

// https://vite.dev/config/
const config = defineConfig({
    server: {
        port: 5174,
    },
    plugins: [
        tanstackRouter({
            target: 'react',
            autoCodeSplitting: true,
        }),
        react(),
        tailwindcss(),
        cloudflare(),
    ],
});

const tstConfig = testConfig({
    ...sharedConfig,
    test: {
        ...sharedConfig.test,
        projects: [
            {
                extends: './vite.config.ts',
                test: {
                    name: 'client',
                    browser: {
                        enabled: true,
                        provider: playwright(),
                        instances: [{ browser: 'chromium', headless: true }],
                    },
                    include: ['src/**/*.test.tsx'],
                    exclude: ['src/**/*.test.ts'],
                },
            },

            {
                extends: './vite.config.ts',
                test: {
                    name: 'server',
                    environment: 'node',
                    include: ['src/**/*.test.ts'],
                    exclude: ['src/**/*.test.tsx'],
                },
            },
        ],
    },
});

export default {
    ...config,
    ...tstConfig,
};
