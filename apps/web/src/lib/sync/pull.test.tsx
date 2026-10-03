import { beforeEach, describe, expect, it, vi } from 'vitest';

import { api } from '../api';
import { db } from '../dexie/db';
import type { Entry, OutboxItem, Trip } from '../dexie/types';
import { pull } from './pull';

vi.mock('../api', () => ({ api: { sync: { pull: vi.fn() } } }));

const pullMock = vi.mocked(api.sync.pull);

type PullResponse = Awaited<ReturnType<typeof api.sync.pull>>;

const trip = (id: string, o: Partial<Trip> = {}) =>
    ({ id, isDeleted: false, ...o }) as Trip;

const entry = (id: string, o: Partial<Entry> = {}) =>
    ({ id, isDeleted: false, ...o }) as Entry;

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
    entries: ReturnType<typeof page<Entry>> = page()
) => ({ trips, entries }) as PullResponse;

const pending = (
    recordId: string,
    collection: 'trips' | 'entries' = 'trips'
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
        db.syncMeta.clear(),
        db.outbox.clear(),
    ]);
});

describe('pull', () => {
    it('upserts rows from both tables and persists cursors', async () => {
        pullMock.mockResolvedValueOnce(
            response(
                page([trip('t1', { title: 'Japan' })], 'tc1'),
                page([entry('e1', { tripId: 't1' })], 'ec1')
            )
        );

        await pull();

        expect(await db.trips.get('t1')).toMatchObject({ title: 'Japan' });
        expect(await db.entries.get('e1')).toMatchObject({ tripId: 't1' });
        expect((await db.syncMeta.get('trips'))?.value).toBe('tc1');
        expect((await db.syncMeta.get('entries'))?.value).toBe('ec1');
    });

    it('deletes rows flagged isDeleted', async () => {
        await db.trips.put(trip('t1'));

        pullMock.mockResolvedValueOnce({
            trips: page([trip('t1', { isDeleted: true })], 'tc1'),
            entries: page(),
        });

        await pull();

        expect(await db.trips.get('t1')).toBeUndefined();
    });

    it('skips rows with pending outbox entries', async () => {
        await db.trips.put(trip('t1', { title: 'Local' }));
        await db.entries.put(entry('e1', { note: 'Local' }));
        await db.outbox.bulkPut([
            pending('t1', 'trips'),
            pending('e1', 'entries'),
        ]);

        pullMock.mockResolvedValueOnce({
            trips: page([trip('t1', { title: 'Remote' }), trip('t2')], 'tc1'),
            entries: page([entry('e1', { isDeleted: true })], 'ec1'),
        });

        await pull();

        expect(await db.trips.get('t1')).toMatchObject({ title: 'Local' });
        expect(await db.trips.get('t2')).toBeDefined();
        expect(await db.entries.get('e1')).toBeDefined();
    });

    it('sends stored cursors on the first request', async () => {
        await db.syncMeta.bulkPut([
            { key: 'trips', value: 'saved-t' },
            { key: 'entries', value: 'saved-e' },
        ]);
        pullMock.mockResolvedValueOnce({
            trips: page(),
            entries: page(),
        });

        await pull();

        expect(pullMock).toHaveBeenCalledWith({
            trips: 'saved-t',
            entries: 'saved-e',
        });
    });

    it('sends undefined cursors when nothing is stored', async () => {
        pullMock.mockResolvedValueOnce({
            trips: page(),
            entries: page(),
        });

        await pull();

        expect(pullMock).toHaveBeenCalledWith({
            trips: undefined,
            entries: undefined,
        });
    });

    it('keeps paging until neither table has more', async () => {
        pullMock
            .mockResolvedValueOnce({
                trips: page([trip('t1')], 'tc1', true),
                entries: page([entry('e1')], 'ec1', false),
            })
            .mockResolvedValueOnce({
                trips: page([trip('t2')], 'tc2', false),
                entries: page([], null, true),
            })
            .mockResolvedValueOnce({
                trips: page(),
                entries: page([entry('e2')], 'ec3', false),
            });

        await pull();

        expect(pullMock).toHaveBeenCalledTimes(3);
        expect(pullMock).toHaveBeenNthCalledWith(2, {
            trips: 'tc1',
            entries: 'ec1',
        });
        expect(pullMock).toHaveBeenNthCalledWith(3, {
            trips: 'tc2',
            entries: undefined,
        });
        expect(await db.trips.count()).toBe(2);
        expect(await db.entries.count()).toBe(2);
    });

    it('rolls back the whole page if applying fails', async () => {
        pullMock.mockResolvedValueOnce({
            trips: page([trip('t1')], 'tc1'),
            // @ts-expect-error -- intentionally throwing an invalid entry
            entries: { rows: [null], cursor: 'ec1', hasMore: false },
        });

        await expect(pull()).rejects.toThrow();

        expect(await db.trips.count()).toBe(0);
        expect(await db.syncMeta.count()).toBe(0);
    });
});
