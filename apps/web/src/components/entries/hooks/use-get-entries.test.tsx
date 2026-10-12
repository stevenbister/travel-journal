import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { db } from '../../../lib/dexie/db';
import type { Entry } from '../../../lib/dexie/types';
import { useGetEntries } from './use-get-entries';

const makeEntry = (
    id: string,
    tripId: string,
    overrides: Partial<Entry> = {}
): Entry => ({
    id,
    tripId,
    authorId: 'user-1',
    note: id,
    entryDate: '2026-10-09T12:00:00.000Z',
    lat: null,
    lng: null,
    tag: null,
    isDeleted: false,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
});

describe('useGetEntries', () => {
    beforeEach(async () => {
        await db.entries.clear();
    });

    it('is undefined first, then resolves with an empty array', async () => {
        const { result } = await renderHook(() => useGetEntries('trip-1'));

        expect(result.current).toBeUndefined();

        await vi.waitFor(() => expect(result.current).toEqual([]));
    });

    it('returns only entries for the requested trip', async () => {
        await db.entries.bulkAdd([
            makeEntry('a1', 'trip-a'),
            makeEntry('a2', 'trip-a'),
            makeEntry('b1', 'trip-b'),
        ]);

        const { result } = await renderHook(() => useGetEntries('trip-a'));

        await vi.waitFor(() =>
            expect(result.current?.map((e) => e.id).sort()).toEqual([
                'a1',
                'a2',
            ])
        );
    });

    it('updates when an entry is added', async () => {
        const { result } = await renderHook(() => useGetEntries('trip-a'));

        await vi.waitFor(() => expect(result.current).toEqual([]));

        await db.entries.add(makeEntry('a1', 'trip-a'));

        await vi.waitFor(() =>
            expect(result.current?.map((e) => e.id)).toEqual(['a1'])
        );
    });
});
