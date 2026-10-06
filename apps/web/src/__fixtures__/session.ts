import type { CachedSession } from '../lib/dexie/types';

const NOW = new Date('2026-10-02T12:00:00.000Z').getTime();

export const makeCachedSession = (
    overrides: Partial<CachedSession> = {}
): CachedSession => ({
    id: 'current',
    user: {
        id: 'u1',
        name: 'Steven',
        email: 's@example.com',
        image: null,
    },
    expiresAt: NOW + 60_000,
    cachedAt: NOW - 1000,
    ...overrides,
});
