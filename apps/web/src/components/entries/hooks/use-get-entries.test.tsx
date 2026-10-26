import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { makeEntry } from '../../../__fixtures__/entries';
import { db } from '../../../lib/dexie/db';
import { useGetEntries } from './use-get-entries';

describe('useGetEntries', () => {
    beforeEach(async () => {
        await db.entries.clear();
    });

    it('is undefined first, then resolves with an empty array', async () => {
        const { result } = await renderHook(() => useGetEntries('trip-1'));

        expect(result.current.entries).toBeUndefined();

        await vi.waitFor(() => expect(result.current.entries).toEqual([]));
    });

    it('returns only entries for the requested trip', async () => {
        await db.entries.bulkAdd([
            makeEntry('a1', 'trip-a'),
            makeEntry('a2', 'trip-a'),
            makeEntry('b1', 'trip-b'),
        ]);

        const { result } = await renderHook(() => useGetEntries('trip-a'));

        await vi.waitFor(() =>
            expect(result.current.entries?.map((e) => e.id).sort()).toEqual([
                'a1',
                'a2',
            ])
        );
    });

    it('updates when an entry is added', async () => {
        const { result } = await renderHook(() => useGetEntries('trip-a'));

        await vi.waitFor(() => expect(result.current.entries).toEqual([]));

        await db.entries.add(makeEntry('a1', 'trip-a'));

        await vi.waitFor(() =>
            expect(result.current.entries?.map((e) => e.id)).toEqual(['a1'])
        );
    });
});
