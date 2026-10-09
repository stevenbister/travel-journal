import { sharedConfig } from '@repo/vitest-config';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: 'client',
                    browser: {
                        enabled: true,
                        provider: playwright(),
                        instances: [{ browser: 'chromium', headless: true }],
                    },
                    include: ['src/**/*.test.tsx'],
                    exclude: ['src/**/*.test.ts'],
                    setupFiles: ['./vitest-setup.browser.ts'],
                },
            },
            {
                test: {
                    ...sharedConfig.test,
                    name: 'server',
                    environment: 'node',
                    include: ['src/**/*.test.ts'],
                    exclude: ['src/**/*.test.tsx'],
                },
            },
        ],
    },
});
