import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { tripsFixture } from '../../../__fixtures__/trips';
import { db } from '../../../lib/dexie/db';
import type { Entry } from '../../../lib/dexie/types';
import { useGetTrips } from './use-get-trips';

const NOW = new Date(2026, 9, 9, 12, 0, 0);
const NEXT_MORNING = new Date(2026, 9, 10, 8, 0, 0);

const at = (day: number) => new Date(2026, 9, day).toISOString();

const {
    entryCount: _entryCount,
    members: _members,
    ...baseTrip
} = tripsFixture.current[0]!;

const makeTrip = (
    id: string,
    startDay: number,
    endDay: number,
    overrides: Record<string, unknown> = {}
) => ({
    ...baseTrip,
    id,
    title: id,
    startDate: at(startDay),
    endDate: at(endDay),
    ...overrides,
});

const makeEntry = (id: string, tripId: string, isDeleted = false) =>
    ({
        id,
        tripId,
        isDeleted,
    }) as Entry;

const setVisibility = (state: DocumentVisibilityState) => {
    Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => state,
    });
    document.dispatchEvent(new Event('visibilitychange'));
};

const renderTrips = async () => {
    const hook = await renderHook(() => useGetTrips());
    await vi.waitFor(() => expect(hook.result.current.isPending).toBe(false));
    return hook;
};

describe('useGetTrips', () => {
    beforeEach(async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(NOW);

        await Promise.all([
            db.trips.clear(),
            db.entries.clear(),
            db.tripMembers.clear(),
            db.users.clear(),
        ]);
    });

    afterEach(() => {
        vi.useRealTimers();
        delete (document as { visibilityState?: unknown }).visibilityState;
    });

    describe('loading', () => {
        it('is pending first, then resolves with empty groups', async () => {
            const { result } = await renderHook(() => useGetTrips());

            expect(result.current.isPending).toBe(true);
            expect(result.current.trips).toBeUndefined();

            await vi.waitFor(() =>
                expect(result.current.isPending).toBe(false)
            );
            expect(result.current.trips).toEqual({
                current: [],
                upcoming: [],
                past: [],
            });
        });
    });

    describe('grouping', () => {
        it('sorts upcoming soonest first and past most recent first', async () => {
            await db.trips.bulkAdd([
                makeTrip('up-late', 28, 30),
                makeTrip('up-soon', 15, 16),
                makeTrip('past-old', 1, 2),
                makeTrip('past-recent', 5, 6),
            ]);

            const { result } = await renderTrips();

            expect(result.current.trips?.upcoming.map((t) => t.id)).toEqual([
                'up-soon',
                'up-late',
            ]);
            expect(result.current.trips?.past.map((t) => t.id)).toEqual([
                'past-recent',
                'past-old',
            ]);
        });

        it('treats a trip starting today as current', async () => {
            // Start is local midnight today, "now" is 12:00
            await db.trips.add(makeTrip('starts-today', 9, 12));

            const { result } = await renderTrips();

            expect(result.current.trips?.current.map((t) => t.id)).toEqual([
                'starts-today',
            ]);
        });

        it('keeps a trip current for the whole of its last day', async () => {
            // End date is local midnight on the 9th, but "now" is 12:00 on the 9th
            await db.trips.add(makeTrip('ends-today', 5, 9));

            const { result } = await renderTrips();

            expect(result.current.trips?.current.map((t) => t.id)).toEqual([
                'ends-today',
            ]);
            expect(result.current.trips?.past).toEqual([]);
        });

        it('treats a trip that ended yesterday as past', async () => {
            await db.trips.add(makeTrip('ended-yesterday', 5, 8));

            const { result } = await renderTrips();

            expect(result.current.trips?.past.map((t) => t.id)).toEqual([
                'ended-yesterday',
            ]);
        });
    });

    describe('data shaping', () => {
        it('excludes deleted trips', async () => {
            await db.trips.bulkAdd([
                makeTrip('kept', 8, 12),
                makeTrip('gone', 8, 12, { isDeleted: true }),
            ]);

            const { result } = await renderTrips();

            expect(result.current.trips?.current.map((t) => t.id)).toEqual([
                'kept',
            ]);
        });

        it('counts only non-deleted entries, per trip', async () => {
            await db.trips.bulkAdd([
                makeTrip('a', 8, 12),
                makeTrip('b', 8, 12),
            ]);
            await db.entries.bulkAdd([
                makeEntry('a1', 'a'),
                makeEntry('a2', 'a'),
                makeEntry('a3', 'a', true),
                makeEntry('b1', 'b'),
            ]);

            const { result } = await renderTrips();
            const byId = Object.fromEntries(
                result.current.trips!.current.map((t) => [t.id, t])
            );

            expect(byId.a!.entryCount).toBe(2);
            expect(byId.b!.entryCount).toBe(1);
        });

        it('returns an entry count of 0 for trips with no entries', async () => {
            await db.trips.add(makeTrip('empty', 8, 12));

            const { result } = await renderTrips();

            expect(result.current.trips?.current[0]!.entryCount).toBe(0);
        });

        it('skips members whose user has not synced yet', async () => {
            await db.trips.add(makeTrip('a', 8, 12));
            await db.users.add({ id: 'u1', name: 'Steven', image: null });
            await db.tripMembers.bulkAdd([
                { tripId: 'a', userId: 'u1' },
                { tripId: 'a', userId: 'u-missing' },
            ]);

            const { result } = await renderTrips();

            expect(result.current.trips?.current[0]!.members).toEqual([
                { id: 'u1', name: 'Steven', image: null },
            ]);
        });

        it('only attaches members to their own trip', async () => {
            await db.trips.bulkAdd([
                makeTrip('a', 8, 12),
                makeTrip('b', 8, 12),
            ]);
            await db.users.add({ id: 'u1', name: 'Steven', image: null });
            await db.tripMembers.add({ tripId: 'a', userId: 'u1' });

            const { result } = await renderTrips();
            const byId = Object.fromEntries(
                result.current.trips!.current.map((t) => [t.id, t])
            );

            expect(byId.a!.members).toHaveLength(1);
            expect(byId.b!.members).toEqual([]);
        });
    });

    describe('live updates', () => {
        it('updates when a trip is added to Dexie', async () => {
            const { result } = await renderTrips();
            expect(result.current.trips?.upcoming).toEqual([]);

            await db.trips.add(makeTrip('new', 20, 22));

            await vi.waitFor(() =>
                expect(result.current.trips?.upcoming.map((t) => t.id)).toEqual(
                    ['new']
                )
            );
        });

        it('updates when a trip is soft-deleted', async () => {
            await db.trips.add(makeTrip('a', 8, 12));
            const { result } = await renderTrips();
            expect(result.current.trips?.current).toHaveLength(1);

            await db.trips.update('a', (trip) => {
                trip.isDeleted = true;
            });

            await vi.waitFor(() =>
                expect(result.current.trips?.current).toHaveLength(0)
            );
        });
    });

    describe('visibilitychange', () => {
        it('regroups trips when the tab becomes visible after the day has rolled over', async () => {
            // Ends today (9th), so it's current right now
            await db.trips.add(makeTrip('ends-today', 5, 9));
            const { result } = await renderTrips();
            expect(result.current.trips?.current).toHaveLength(1);

            // Tab is hidden overnight, then shown again on the 10th
            setVisibility('hidden');
            vi.setSystemTime(NEXT_MORNING);
            setVisibility('visible');

            await vi.waitFor(() => {
                expect(result.current.trips?.current).toHaveLength(0);
                expect(result.current.trips?.past.map((t) => t.id)).toEqual([
                    'ends-today',
                ]);
            });
        });

        it('does not regroup when the tab becomes hidden', async () => {
            await db.trips.add(makeTrip('ends-today', 5, 9));
            const { result } = await renderTrips();

            vi.setSystemTime(NEXT_MORNING);
            setVisibility('hidden');

            // Give any (unwanted) state update a chance to flush
            await new Promise((resolve) => setTimeout(resolve, 50));

            expect(result.current.trips?.current).toHaveLength(1);
            expect(result.current.trips?.past).toHaveLength(0);
        });

        it('removes the listener on unmount', async () => {
            const removeSpy = vi.spyOn(document, 'removeEventListener');
            const { unmount } = await renderTrips();

            await unmount();

            expect(removeSpy).toHaveBeenCalledWith(
                'visibilitychange',
                expect.any(Function)
            );
        });
    });
});
