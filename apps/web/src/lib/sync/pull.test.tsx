import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '../api';
import { db } from '../dexie/db';
import type {
    Entry,
    EntryHistory,
    OutboxItem,
    Trip,
    TripMember,
    User,
} from '../dexie/types';
import { pull } from './pull';

vi.mock('../api', () => ({ api: { sync: { pull: vi.fn() } } }));

const pullMock = vi.mocked(api.sync.pull);

type PullResponse = Awaited<ReturnType<typeof api.sync.pull>>;

const trip = (id: string, o: Partial<Trip> = {}) =>
    ({ id, isDeleted: false, ...o }) as Trip;

const entry = (id: string, o: Partial<Entry> = {}) =>
    ({ id, isDeleted: false, ...o }) as Entry;

const history = (id: string, o: Partial<EntryHistory> = {}) =>
    ({ id, entryId: 'e1', editedBy: 'u1', editedAt: 1, ...o }) as EntryHistory;

const user = (id: string, o: Partial<User> = {}) =>
    ({ id, name: id, ...o }) as User;

const member = (tripId: string, userId = 'u1'): TripMember => ({
    tripId,
    userId,
});

const page = <T,>(
    rows: T[] = [],
    cursor: string | null = null,
    hasMore = false
) => ({
    rows,
    cursor,
    hasMore,
});

const response = (
    trips: ReturnType<typeof page<Trip>> = page(),
    entries: ReturnType<typeof page<Entry>> = page(),
    entryHistory: ReturnType<typeof page<EntryHistory>> = page(),
    users: User[] = [],
    tripMembers: TripMember[] = []
) => ({ users, tripMembers, trips, entries, entryHistory }) as PullResponse;

const pending = (
    recordId: string,
    collection: OutboxItem['collection'] = 'trips'
): OutboxItem => ({
    key: `${collection}:${recordId}`,
    collection,
    recordId,
    updatedAt: Date.now(),
    queuedAt: Date.now(),
    attempts: 0,
});

beforeEach(async () => {
    pullMock.mockReset();
    await Promise.all([
        db.trips.clear(),
        db.entries.clear(),
        db.entryHistory.clear(),
        db.users.clear(),
        db.tripMembers.clear(),
        db.syncMeta.clear(),
        db.outbox.clear(),
    ]);
});

describe('pull', () => {
    it('upserts rows from all tables and persists cursors', async () => {
        pullMock.mockResolvedValueOnce(
            response(
                page([trip('t1', { title: 'Japan' })], 'tc1'),
                page([entry('e1', { tripId: 't1' })], 'ec1'),
                page([history('h1', { entryId: 'e1' })], 'hc1'),
                [user('u1')],
                [member('t1')]
            )
        );

        await pull();

        expect(await db.trips.get('t1')).toMatchObject({ title: 'Japan' });
        expect(await db.entries.get('e1')).toMatchObject({ tripId: 't1' });
        expect(await db.entryHistory.get('h1')).toMatchObject({
            entryId: 'e1',
        });
        expect(await db.users.get('u1')).toMatchObject({ id: 'u1' });
        expect(await db.tripMembers.toArray()).toMatchObject([
            { tripId: 't1', userId: 'u1' },
        ]);
        expect((await db.syncMeta.get('trips'))?.value).toBe('tc1');
        expect((await db.syncMeta.get('entries'))?.value).toBe('ec1');
        expect((await db.syncMeta.get('entryHistory'))?.value).toBe('hc1');
    });

    it('stores null cursor when the server returns null', async () => {
        pullMock.mockResolvedValueOnce(response());

        await pull();

        expect((await db.syncMeta.get('trips'))?.value).toBeNull();
        expect((await db.syncMeta.get('entries'))?.value).toBeNull();
        expect((await db.syncMeta.get('entryHistory'))?.value).toBeNull();
    });

    it('replaces the users and tripMembers snapshot on each pull', async () => {
        await db.users.put(user('stale'));
        await db.tripMembers.put({ tripId: 't-stale', userId: 'u1' });
        pullMock.mockResolvedValueOnce(
            response(page(), page(), page(), [user('u1')], [member('t1')])
        );

        await pull();

        expect(await db.users.get('stale')).toBeUndefined();
        expect(await db.users.get('u1')).toBeDefined();
        expect(
            await db.tripMembers
                .where('[tripId+userId]')
                .equals(['t-stale', 'u1'])
                .first()
        ).toBeUndefined();
        expect(
            await db.tripMembers
                .where('[tripId+userId]')
                .equals(['t1', 'u1'])
                .first()
        ).toBeDefined();
    });

    it('deletes rows flagged isDeleted', async () => {
        await db.trips.put(trip('t1'));
        await db.entries.put(entry('e1', { tripId: 't1' }));
        await db.entryHistory.put(history('h1', { entryId: 'e1' }));

        pullMock.mockResolvedValueOnce(
            response(
                page([trip('t1', { isDeleted: true })], 'tc1'),
                page([entry('e1', { tripId: 't1', isDeleted: true })], 'ec1'),
                // entryHistory is append-only (no isDeleted): it upserts.
                page([history('h2', { entryId: 'e1' })], 'hc1'),
                [user('u1')],
                // Keep membership so the delete path (not the prune path) is exercised.
                [member('t1')]
            )
        );

        await pull();

        expect(await db.trips.get('t1')).toBeUndefined();
        expect(await db.entries.get('e1')).toBeUndefined();
        // Pre-existing history for the deleted entry is left alone by the
        // delete path; cascade cleanup happens via membership pruning.
        expect(await db.entryHistory.get('h1')).toBeDefined();
        expect(await db.entryHistory.get('h2')).toBeDefined();
    });

    it('removes trips (and children) that lost membership, keeping offline pending trips', async () => {
        await db.trips.bulkPut([
            trip('t-gone'),
            trip('t-local'),
            trip('t-keep'),
        ]);
        await db.entries.put(entry('e-gone', { tripId: 't-gone' }));
        await db.entryHistory.put(history('h-gone', { entryId: 'e-gone' }));
        await db.outbox.put(pending('t-local', 'trips'));

        pullMock.mockResolvedValueOnce(
            response(page(), page(), page(), [user('u1')], [member('t-keep')])
        );

        await pull();

        expect(await db.trips.get('t-gone')).toBeUndefined();
        expect(await db.entries.get('e-gone')).toBeUndefined();
        expect(await db.entryHistory.get('h-gone')).toBeUndefined();
        // Created offline and not yet pushed: the server doesn't know it.
        expect(await db.trips.get('t-local')).toBeDefined();
        expect(await db.trips.get('t-keep')).toBeDefined();
    });

    it('skips rows with pending outbox entries', async () => {
        await db.trips.put(trip('t1', { title: 'Local' }));
        await db.entries.put(entry('e1', { note: 'Local' }));
        await db.outbox.bulkPut([
            pending('t1', 'trips'),
            pending('e1', 'entries'),
        ]);

        pullMock.mockResolvedValueOnce(
            response(
                page([trip('t1', { title: 'Remote' }), trip('t2')], 'tc1'),
                page([entry('e1', { isDeleted: true })], 'ec1'),
                page(),
                [user('u1')],
                [member('t1'), member('t2')]
            )
        );

        await pull();

        expect(await db.trips.get('t1')).toMatchObject({ title: 'Local' });
        expect(await db.trips.get('t2')).toBeDefined();
        expect(await db.entries.get('e1')).toBeDefined();
    });

    it('sends stored cursors on the first request', async () => {
        await db.syncMeta.bulkPut([
            { key: 'trips', value: 'saved-t' },
            { key: 'entries', value: 'saved-e' },
            { key: 'entryHistory', value: 'saved-h' },
        ]);
        pullMock.mockResolvedValueOnce(response());

        await pull();

        expect(pullMock).toHaveBeenCalledWith({
            trips: 'saved-t',
            entries: 'saved-e',
            entryHistory: 'saved-h',
        });
    });

    it('sends undefined cursors when nothing is stored', async () => {
        pullMock.mockResolvedValueOnce(response());

        await pull();

        expect(pullMock).toHaveBeenCalledWith({
            trips: undefined,
            entries: undefined,
            entryHistory: undefined,
        });
    });

    it('keeps paging until no table has more', async () => {
        pullMock
            .mockResolvedValueOnce(
                response(
                    page([trip('t1')], 'tc1', true),
                    page([entry('e1')], 'ec1', false),
                    page([], null, true),
                    [user('u1')],
                    [member('t1')]
                )
            )
            .mockResolvedValueOnce(
                response(
                    page([trip('t2')], 'tc2', false),
                    page([], null, true),
                    page([history('h1')], 'hc1', false),
                    [user('u1')],
                    [member('t1'), member('t2')]
                )
            )
            .mockResolvedValueOnce(
                response(
                    page(),
                    page([entry('e2')], 'ec3', false),
                    page(),
                    [user('u1')],
                    [member('t1'), member('t2')]
                )
            );

        await pull();

        expect(pullMock).toHaveBeenCalledTimes(3);
        expect(pullMock).toHaveBeenNthCalledWith(2, {
            trips: 'tc1',
            entries: 'ec1',
            entryHistory: undefined,
        });
        expect(pullMock).toHaveBeenNthCalledWith(3, {
            trips: 'tc2',
            entries: undefined,
            entryHistory: 'hc1',
        });
        expect(await db.trips.count()).toBe(2);
        expect(await db.entries.count()).toBe(2);
        expect(await db.entryHistory.count()).toBe(1);
    });

    it('rolls back the whole page if applying fails', async () => {
        pullMock.mockResolvedValueOnce({
            ...response(
                page([trip('t1')], 'tc1'),
                page(),
                page(),
                [user('u1')],
                [member('t1')]
            ),
            // @ts-expect-error -- intentionally throwing an invalid entry
            entries: { rows: [null], cursor: 'ec1', hasMore: false },
        });

        await expect(pull()).rejects.toThrow();

        expect(await db.trips.count()).toBe(0);
        expect(await db.users.count()).toBe(0);
        expect(await db.tripMembers.count()).toBe(0);
        expect(await db.syncMeta.count()).toBe(0);
    });
});
