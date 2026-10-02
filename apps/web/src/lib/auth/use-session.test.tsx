import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { type CachedSession, db } from '../dexie/db';
import { useSession } from './use-session';

const NOW = new Date('2026-10-02T12:00:00.000Z').getTime();

const makeCachedSession = (
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

beforeEach(async () => {
    await db.authSession.clear();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
});

afterEach(async () => {
    vi.useRealTimers();
    await db.authSession.clear();
});

describe('useSession', () => {
    it('is pending on the first render, then settles', async () => {
        const seen: boolean[] = [];
        const { result } = await renderHook(() => {
            const value = useSession();
            seen.push(value.isPending);
            return value;
        });

        expect(seen[0]).toBe(true);
        await expect.poll(() => result.current.isPending).toBe(false);
    });

    it('has null data while pending', async () => {
        const { result } = await renderHook(() => useSession());

        if (result.current.isPending) {
            expect(result.current.data).toBeNull();
        }
    });

    it('returns only the user once loaded', async () => {
        const cached = makeCachedSession();
        await db.authSession.put(cached);

        const { result } = await renderHook(() => useSession());

        await expect.poll(() => result.current.isPending).toBe(false);
        expect(result.current.data).toEqual({ user: cached.user });
    });

    it('does not leak cache metadata (expiresAt, cachedAt, id)', async () => {
        await db.authSession.put(makeCachedSession());

        const { result } = await renderHook(() => useSession());

        await expect.poll(() => result.current.isPending).toBe(false);
        expect(Object.keys(result.current.data ?? {})).toEqual(['user']);
    });

    it('returns null data and is not pending when nothing is cached', async () => {
        const { result } = await renderHook(() => useSession());

        await expect.poll(() => result.current.isPending).toBe(false);
        expect(result.current.data).toBeNull();
    });

    it('returns null data when the cached session has expired', async () => {
        await db.authSession.put(makeCachedSession({ expiresAt: NOW - 1 }));

        const { result } = await renderHook(() => useSession());

        await expect.poll(() => result.current.isPending).toBe(false);
        expect(result.current.data).toBeNull();
    });

    it('treats a session expiring exactly now as expired', async () => {
        await db.authSession.put(makeCachedSession({ expiresAt: NOW }));

        const { result } = await renderHook(() => useSession());

        await expect.poll(() => result.current.isPending).toBe(false);
        expect(result.current.data).toBeNull();
    });

    it('updates when a session is written after mount', async () => {
        const { result } = await renderHook(() => useSession());
        await expect.poll(() => result.current.isPending).toBe(false);
        expect(result.current.data).toBeNull();

        const cached = makeCachedSession();
        await db.authSession.put(cached);

        await expect
            .poll(() => result.current.data)
            .toEqual({ user: cached.user });
    });

    it('updates when the session is replaced (e.g. a refresh)', async () => {
        await db.authSession.put(makeCachedSession());
        const { result } = await renderHook(() => useSession());
        await expect.poll(() => result.current.data?.user.name).toBe('Steven');

        await db.authSession.put(
            makeCachedSession({
                user: {
                    id: 'u1',
                    name: 'Renamed',
                    email: 's@example.com',
                    image: null,
                },
            })
        );

        await expect.poll(() => result.current.data?.user.name).toBe('Renamed');
    });

    it('goes to null data when the session is cleared (server revoked it)', async () => {
        await db.authSession.put(makeCachedSession());
        const { result } = await renderHook(() => useSession());
        await expect.poll(() => result.current.data).not.toBeNull();

        await db.authSession.clear();

        await expect.poll(() => result.current.data).toBeNull();
        expect(result.current.isPending).toBe(false);
    });

    it('only re-evaluates expiry when something re-renders it', async () => {
        await db.authSession.put(makeCachedSession({ expiresAt: NOW + 1000 }));
        const { result, rerender } = await renderHook(() => useSession());
        await expect.poll(() => result.current.data).not.toBeNull();

        vi.setSystemTime(NOW + 5000); // now past expiresAt

        expect(result.current.data).not.toBeNull();

        await rerender();

        expect(result.current.data).toBeNull();
    });
});
