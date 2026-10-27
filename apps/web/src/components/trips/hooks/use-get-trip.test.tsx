import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { makeEntry } from '../../../__fixtures__/entries';
import { makeTrip } from '../../../__fixtures__/trips';
import { db } from '../../../lib/dexie/db';
import type { TripWithDetails } from '../../../lib/dexie/types';
import { getTripWithDetails, useGetTrip } from './use-get-trip';

describe('getTripWithDetails', () => {
    beforeEach(async () => {
        await Promise.all([
            db.trips.clear(),
            db.entries.clear(),
            db.tripMembers.clear(),
            db.users.clear(),
        ]);

        await db.trips.bulkAdd([makeTrip('t1', 8, 12), makeTrip('t2', 8, 12)]);
        await db.users.bulkAdd([
            { id: 'u1', name: 'Steven', image: null },
            { id: 'u2', name: 'Grace', image: null },
        ]);
        await db.tripMembers.bulkAdd([
            { tripId: 't1', userId: 'u1' },
            { tripId: 't1', userId: 'u2' },
            { tripId: 't2', userId: 'u1' },
        ]);
    });

    it('returns the trip with its entry count and members', async () => {
        await db.entries.bulkAdd([
            makeEntry('e1', 't1'),
            makeEntry('e2', 't1'),
            makeEntry('other', 't2'),
        ]);

        const trip = await getTripWithDetails('t1');

        expect(trip).toMatchObject({
            id: 't1',
            entryCount: 2,
            members: [
                { id: 'u1', name: 'Steven', image: null },
                { id: 'u2', name: 'Grace', image: null },
            ],
        });
    });

    it('returns an empty members list when the trip has no members', async () => {
        await db.tripMembers.clear();

        const trip = await getTripWithDetails('t1');

        expect(trip.entryCount).toBe(0);
        expect(trip.members).toEqual([]);
    });

    it('skips members whose user has not synced yet', async () => {
        await db.tripMembers.bulkAdd([{ tripId: 't1', userId: 'u-missing' }]);

        const trip = await getTripWithDetails('t1');

        expect(trip.members).toEqual([
            { id: 'u1', name: 'Steven', image: null },
            { id: 'u2', name: 'Grace', image: null },
        ]);
    });

    // Note: use-get-trips counts only non-deleted entries for its entryCount;
    // this counts everything. Kept as-is until that inconsistency is settled.
    it('counts all entries for the trip, including deleted ones', async () => {
        await db.entries.bulkAdd([
            makeEntry('e1', 't1'),
            makeEntry('e2', 't1', { isDeleted: true }),
        ]);

        const trip = await getTripWithDetails('t1');

        expect(trip.entryCount).toBe(2);
    });

    it('throws when the trip does not exist', async () => {
        await expect(getTripWithDetails('missing')).rejects.toThrow(
            'Trip with id missing not found'
        );
    });
});

describe('useGetTrip', () => {
    beforeEach(async () => {
        await Promise.all([
            db.trips.clear(),
            db.entries.clear(),
            db.tripMembers.clear(),
            db.users.clear(),
        ]);
    });

    it('is pending first, then resolves with the trip details', async () => {
        await db.trips.add(makeTrip('t1', 8, 12));

        const { result } = await renderHook(() => useGetTrip('t1'));

        expect(result.current.isPending).toBe(true);
        expect(result.current.trip).toBeUndefined();

        await vi.waitFor(() => expect(result.current.isPending).toBe(false));
        expect(result.current.trip).toMatchObject({ id: 't1', entryCount: 0 });
    });

    it('shows initialTrip immediately while the live query loads', async () => {
        const initial = {
            ...makeTrip('t1', 8, 12),
            entryCount: 4,
            members: [],
        } as TripWithDetails;

        const { result } = await renderHook(() => useGetTrip('t1', initial));

        expect(result.current.isPending).toBe(false);
        expect(result.current.trip).toBe(initial);

        await db.trips.add(makeTrip('t1', 8, 12));
        await db.entries.add(makeEntry('e1', 't1'));

        await vi.waitFor(() =>
            expect(result.current.trip).toMatchObject({
                id: 't1',
                entryCount: 1,
            })
        );
    });

    it('re-resolves when an entry is added to Dexie', async () => {
        await db.trips.add(makeTrip('t1', 8, 12));

        const { result } = await renderHook(() => useGetTrip('t1'));

        await vi.waitFor(() => expect(result.current.trip?.entryCount).toBe(0));

        await db.entries.add(makeEntry('e1', 't1'));

        await vi.waitFor(() =>
            expect(result.current.trip?.entryCount).toBe(1)
        );
    });
});
