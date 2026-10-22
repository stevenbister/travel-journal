import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '../api';
import { db } from '../dexie/db';
import type { Entry, Trip, TripMember } from '../dexie/types';
import { push } from './push';

vi.mock('../api', () => ({ api: { sync: { push: vi.fn() } } }));

const pushMock = vi.mocked(api.sync.push);

type PushResponse = Awaited<ReturnType<typeof api.sync.push>>;

type PushResult = Awaited<ReturnType<typeof api.sync.push>>['trips'][number];

const applied = (id: string): PushResult => ({ id, status: 'applied' });

const stale = (id: string): PushResult => ({ id, status: 'stale' });

const rejected = (
    id: string,
    reason: Extract<PushResult, { status: 'rejected' }>['reason']
): PushResult => ({ id, status: 'rejected', reason });

const response = (
    trips: PushResult[] = [],
    tripMembers: PushResult[] = [],
    entries: PushResult[] = []
) => ({ trips, tripMembers, entries }) as PushResponse;

const trip = (id: string, o: Partial<Trip> = {}) =>
    ({
        id,
        title: `trip-${id}`,
        startDate: '2026-10-07T23:00:00.000Z',
        endDate: '2026-10-21T23:00:00.000Z',
        coverPhotoId: null,
        createdBy: 'u1',
        synced: false,
        createdAt: '2026-10-09T12:00:00.000Z',
        updatedAt: '2026-10-09T12:00:00.000Z',
        ...o,
    }) as Trip;

const entry = (id: string, o: Partial<Entry> = {}) =>
    ({
        id,
        tripId: 't1',
        authorId: 'u1',
        title: `entry-${id}`,
        notes: null,
        entryDate: '2026-10-10T12:00:00.000Z',
        location: null,
        tag: null,
        synced: false,
        createdAt: '2026-10-10T12:00:00.000Z',
        updatedAt: '2026-10-10T12:00:00.000Z',
        ...o,
    }) as Entry;

const member = (tripId: string, userId = 'u1'): TripMember => ({
    tripId,
    userId,
});

beforeEach(async () => {
    pushMock.mockReset();
    await Promise.all([
        db.trips.clear(),
        db.entries.clear(),
        db.tripMembers.clear(),
    ]);
});

describe('push', () => {
    it('does nothing when every row is synced', async () => {
        await db.trips.put(trip('t1', { synced: true }));
        await db.entries.put(entry('e1', { synced: true }));

        await push();

        expect(pushMock).not.toHaveBeenCalled();
    });

    it('pushes unsynced trips (with their members) and entries, then marks them synced', async () => {
        await db.trips.bulkPut([
            trip('t-local'),
            trip('t-synced', { synced: true }),
        ]);
        await db.entries.bulkPut([
            entry('e-local', { tripId: 't-local' }),
            entry('e-synced', { tripId: 't-local', synced: true }),
        ]);
        await db.tripMembers.bulkAdd([
            member('t-local'),
            member('t-local', 'u2'),
            member('t-synced', 'u2'),
        ]);

        pushMock.mockResolvedValueOnce(
            response([applied('t-local')], [], [applied('e-local')])
        );

        await push();

        expect(pushMock).toHaveBeenCalledWith({
            trips: [
                {
                    id: 't-local',
                    title: 'trip-t-local',
                    startDate: '2026-10-07T23:00:00.000Z',
                    endDate: '2026-10-21T23:00:00.000Z',
                    coverPhotoId: null,
                    createdBy: 'u1',
                    isDeleted: false,
                    createdAt: '2026-10-09T12:00:00.000Z',
                    updatedAt: '2026-10-09T12:00:00.000Z',
                },
            ],
            tripMembers: [
                { tripId: 't-local', userId: 'u1' },
                { tripId: 't-local', userId: 'u2' },
            ],
            entries: [
                {
                    id: 'e-local',
                    tripId: 't-local',
                    authorId: 'u1',
                    title: 'entry-e-local',
                    notes: null,
                    entryDate: '2026-10-10T12:00:00.000Z',
                    location: null,
                    tag: null,
                    isDeleted: false,
                    createdAt: '2026-10-10T12:00:00.000Z',
                    updatedAt: '2026-10-10T12:00:00.000Z',
                },
            ],
        });

        expect(await db.trips.get('t-local')).toMatchObject({ synced: true });
        expect(await db.trips.get('t-synced')).toMatchObject({ synced: true });
        expect(await db.entries.get('e-local')).toMatchObject({ synced: true });
        expect(await db.entries.get('e-synced')).toMatchObject({
            synced: true,
        });
    });

    it('pushes stale results as synced', async () => {
        await db.trips.put(trip('t1'));
        pushMock.mockResolvedValueOnce(response([stale('t1')]));

        await push();

        expect(await db.trips.get('t1')).toMatchObject({ synced: true });
    });

    it('keeps rejected rows unsynced so they retry later', async () => {
        await db.trips.put(trip('t-rejected'));
        await db.entries.put(entry('e-rejected', { tripId: 't-rejected' }));
        pushMock.mockResolvedValueOnce(
            response(
                [rejected('t-rejected', 'forbidden')],
                [],
                [rejected('e-rejected', 'trip_not_found')]
            )
        );

        await push();

        expect(await db.trips.get('t-rejected')).toMatchObject({
            synced: false,
        });
        expect(await db.entries.get('e-rejected')).toMatchObject({
            synced: false,
        });
    });

    it('leaves rows unsynced when the request fails', async () => {
        await db.trips.put(trip('t1'));
        pushMock.mockRejectedValueOnce(new Error('Network request failed'));

        await expect(push()).rejects.toThrow();

        expect(await db.trips.get('t1')).toMatchObject({ synced: false });
    });
});
