import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { flushPendingSignOut, getSession } from './session';

const mocks = vi.hoisted(() => ({
    checkIsOnline: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    db: {
        authMeta: { get: vi.fn(), delete: vi.fn() },
        authSession: { get: vi.fn(), put: vi.fn(), clear: vi.fn() },
    },
}));

vi.mock('@repo/core/auth/client', () => ({
    authClient: { signOut: mocks.signOut, getSession: mocks.getSession },
}));
vi.mock('../dexie/db', () => ({ db: mocks.db }));
vi.mock('../online/check-is-online', () => ({
    checkIsOnline: mocks.checkIsOnline,
}));

const NOW = new Date('2026-10-02T12:00:00.000Z').getTime();

const setPendingSignOut = (pending: boolean) =>
    mocks.db.authMeta.get.mockImplementation(async (key: string) =>
        key === 'pendingSignOut' && pending
            ? { key: 'pendingSignOut' }
            : undefined
    );

const makeCachedSession = (overrides = {}) => ({
    id: 'current',
    user: { id: 'u1', name: 'Steven', email: 's@example.com', image: null },
    expiresAt: NOW + 60_000,
    cachedAt: NOW - 1000,
    ...overrides,
});

const serverSession = {
    data: {
        session: { expiresAt: '2026-10-09T12:00:00.000Z' },
        user: {
            id: 'u1',
            name: 'Steven',
            email: 's@example.com',
            image: 'https://example.com/a.png',
            // extra fields that must NOT end up in the cache
            emailVerified: true,
            role: 'admin',
        },
    },
};

beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    setPendingSignOut(false);
    mocks.checkIsOnline.mockResolvedValue(true);
    mocks.signOut.mockResolvedValue({});
    mocks.getSession.mockResolvedValue(serverSession);
    mocks.db.authSession.get.mockResolvedValue(undefined);
    mocks.db.authSession.put.mockResolvedValue(undefined);
    mocks.db.authSession.clear.mockResolvedValue(undefined);
    mocks.db.authMeta.delete.mockResolvedValue(undefined);
});

afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    Object.values(mocks.db.authMeta).forEach((m) => m.mockReset());
    Object.values(mocks.db.authSession).forEach((m) => m.mockReset());
    mocks.checkIsOnline.mockReset();
    mocks.signOut.mockReset();
    mocks.getSession.mockReset();
});

describe('flushPendingSignOut', () => {
    it('returns true without any network work when nothing is pending', async () => {
        await expect(flushPendingSignOut()).resolves.toBe(true);

        expect(mocks.checkIsOnline).not.toHaveBeenCalled();
        expect(mocks.signOut).not.toHaveBeenCalled();
    });

    it('returns false and keeps the flag when offline', async () => {
        setPendingSignOut(true);
        mocks.checkIsOnline.mockResolvedValue(false);

        await expect(flushPendingSignOut()).resolves.toBe(false);

        expect(mocks.signOut).not.toHaveBeenCalled();
        expect(mocks.db.authMeta.delete).not.toHaveBeenCalled();
    });

    it('signs out, clears the flag and returns true when online', async () => {
        setPendingSignOut(true);

        await expect(flushPendingSignOut()).resolves.toBe(true);

        expect(mocks.signOut).toHaveBeenCalledTimes(1);
        expect(mocks.db.authMeta.delete).toHaveBeenCalledWith('pendingSignOut');
    });

    it('passes an AbortSignal to signOut', async () => {
        setPendingSignOut(true);

        await flushPendingSignOut();

        expect(mocks.signOut).toHaveBeenCalledWith({
            fetchOptions: { signal: expect.any(AbortSignal) },
        });
    });

    it('returns false and keeps the flag when signOut throws', async () => {
        setPendingSignOut(true);
        mocks.signOut.mockRejectedValue(new Error('boom'));

        await expect(flushPendingSignOut()).resolves.toBe(false);

        expect(mocks.db.authMeta.delete).not.toHaveBeenCalled();
    });
});

describe('getSession', () => {
    describe('pending sign-out', () => {
        it('flushes, returns null and never touches the session or cache', async () => {
            setPendingSignOut(true);

            await expect(getSession()).resolves.toBeNull();

            expect(mocks.signOut).toHaveBeenCalledTimes(1);
            expect(mocks.getSession).not.toHaveBeenCalled();
            expect(mocks.db.authSession.put).not.toHaveBeenCalled();
        });

        it('still returns null when the flush fails (offline)', async () => {
            setPendingSignOut(true);
            mocks.checkIsOnline.mockResolvedValue(false);
            mocks.db.authSession.get.mockResolvedValue(makeCachedSession());

            await expect(getSession()).resolves.toBeNull();
        });
    });

    describe('offline', () => {
        beforeEach(() => mocks.checkIsOnline.mockResolvedValue(false));

        it('returns the cached session if it is still valid', async () => {
            const cached = makeCachedSession();
            mocks.db.authSession.get.mockResolvedValue(cached);

            await expect(getSession()).resolves.toEqual(cached);
            expect(mocks.getSession).not.toHaveBeenCalled();
        });

        it('returns null when there is no cached session', async () => {
            await expect(getSession()).resolves.toBeNull();
        });

        it('returns null when the cached session has expired', async () => {
            mocks.db.authSession.get.mockResolvedValue(
                makeCachedSession({ expiresAt: NOW - 1 })
            );

            await expect(getSession()).resolves.toBeNull();
        });

        it('treats a session expiring exactly now as still valid', async () => {
            const cached = makeCachedSession({ expiresAt: NOW });
            mocks.db.authSession.get.mockResolvedValue(cached);

            await expect(getSession()).resolves.toEqual(cached);
        });

        it('does not clear the cache', async () => {
            await getSession();

            expect(mocks.db.authSession.clear).not.toHaveBeenCalled();
        });
    });

    describe('online with a server session', () => {
        it('caches and returns only the whitelisted fields', async () => {
            const expected = {
                id: 'current',
                user: {
                    id: 'u1',
                    name: 'Steven',
                    email: 's@example.com',
                    image: 'https://example.com/a.png',
                },
                expiresAt: new Date('2026-10-09T12:00:00.000Z').getTime(),
                cachedAt: NOW,
            };

            await expect(getSession()).resolves.toEqual(expected);
            expect(mocks.db.authSession.put).toHaveBeenCalledWith(expected);
        });

        it('passes an AbortSignal to the session request', async () => {
            await getSession();

            expect(mocks.getSession).toHaveBeenCalledWith({
                fetchOptions: { signal: expect.any(AbortSignal) },
            });
        });
    });

    describe('online with no server session', () => {
        it.each([
            ['null data', { data: null }],
            ['data without a session', { data: { session: null, user: null } }],
        ])(
            'clears the cache and returns null for %s',
            async (_label, response) => {
                mocks.getSession.mockResolvedValue(response);

                await expect(getSession()).resolves.toBeNull();

                expect(mocks.db.authSession.clear).toHaveBeenCalledTimes(1);
                expect(mocks.db.authSession.put).not.toHaveBeenCalled();
            }
        );
    });

    describe('online but the request throws', () => {
        beforeEach(() => {
            vi.spyOn(console, 'error').mockImplementation(() => {});
            mocks.getSession.mockRejectedValue(new Error('network down'));
        });

        it('falls back to a valid cached session and logs the failure', async () => {
            const cached = makeCachedSession();
            mocks.db.authSession.get.mockResolvedValue(cached);

            await expect(getSession()).resolves.toEqual(cached);
            expect(console.error).toHaveBeenCalled();
        });

        it('returns null when the fallback cache is expired', async () => {
            mocks.db.authSession.get.mockResolvedValue(
                makeCachedSession({ expiresAt: NOW - 1 })
            );

            await expect(getSession()).resolves.toBeNull();
        });

        it('does not clear the cache', async () => {
            await getSession();

            expect(mocks.db.authSession.clear).not.toHaveBeenCalled();
        });
    });
});
