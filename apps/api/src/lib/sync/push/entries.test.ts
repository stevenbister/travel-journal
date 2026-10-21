import { env } from 'cloudflare:workers';
import type { z } from '@hono/zod-openapi';
import { drizzle } from 'drizzle-orm/d1';

import {
    mockEntries,
    mockPlace,
    mockTrips,
    mockUsers,
} from '../../../__fixtures__/db';
import { runWithAppContext } from '../../../__test__/helpers';
import { entries, trips, user } from '../../../db/schema';
import { type insertEntrySchema } from '../../../db/schema/entries';
import { queueEntries } from './entries';
import type { QueueItems } from './types';

type InsertEntry = z.infer<typeof insertEntrySchema>;

const now = new Date();

const buildEntry = (overrides: Partial<InsertEntry> = {}): InsertEntry => ({
    id: 'new-entry',
    tripId: '1',
    authorId: mockUsers[0]!.id!,
    title: 'Sample title',
    notes: 'Sample notes',
    entryDate: new Date('2026-09-02'),
    tag: 'food',
    location: mockPlace,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
});

const makeQueue = (): QueueItems => ({ applied: [], rejected: [] });

describe('queueEntries', () => {
    const db = drizzle(env.DB);

    beforeEach(async () => {
        await db.insert(user).values(mockUsers);
        await db.insert(trips).values(mockTrips);
        await db.insert(entries).values(mockEntries);
    });

    afterEach(async () => {
        await db.delete(trips);
        await db.delete(entries);
        await db.delete(user);
    });

    it('queues an upsert for a new entry', async () => {
        const queue = await runWithAppContext(() =>
            queueEntries({
                queue: makeQueue(),
                insertTripIds: [],
                insertEntries: [buildEntry()],
            })
        );

        expect(queue.rejected).toEqual([]);
        expect(queue.applied).toHaveLength(1);
        expect(queue.applied[0]).toMatchObject({ type: 'entry', id: 'new-entry' });
    });

    it('queues an upsert for an existing entry in the same trip', async () => {
        const queue = await runWithAppContext(() =>
            queueEntries({
                queue: makeQueue(),
                insertTripIds: [],
                insertEntries: [
                    buildEntry({
                        id: '1',
                        title: 'Updated title',
                        updatedAt: new Date(
                            mockEntries[0]!.updatedAt.getTime() + 60_000
                        ),
                    }),
                ],
            })
        );

        expect(queue.rejected).toEqual([]);
        expect(queue.applied).toHaveLength(1);
        expect(queue.applied[0]?.id).toBe('1');
    });

    it('rejects an entry whose tripId does not match the existing entry', async () => {
        const queue = await runWithAppContext(() =>
            queueEntries({
                queue: makeQueue(),
                insertTripIds: [],
                insertEntries: [buildEntry({ id: '1', tripId: '2' })],
            })
        );

        expect(queue.applied).toEqual([]);
        expect(queue.rejected).toEqual([
            { type: 'entry', id: '1', reason: 'trip_mismatch' },
        ]);
    });

    it('rejects an entry whose trip does not exist', async () => {
        const queue = await runWithAppContext(() =>
            queueEntries({
                queue: makeQueue(),
                insertTripIds: [],
                insertEntries: [
                    buildEntry({ id: 'new-entry', tripId: 'missing' }),
                ],
            })
        );

        expect(queue.applied).toEqual([]);
        expect(queue.rejected).toEqual([
            { type: 'entry', id: 'new-entry', reason: 'trip_not_found' },
        ]);
    });

    it('assumes trips listed in insertTripIds exist', async () => {
        const queue = await runWithAppContext(() =>
            queueEntries({
                queue: makeQueue(),
                insertTripIds: ['new-trip'],
                insertEntries: [buildEntry({ tripId: 'new-trip' })],
            })
        );

        expect(queue.rejected).toEqual([]);
        expect(queue.applied).toHaveLength(1);
        expect(queue.applied[0]?.id).toBe('new-entry');
    });

    it('throws when an entry is missing an ID', async () => {
        await expect(
            runWithAppContext(() =>
                queueEntries({
                    queue: makeQueue(),
                    insertTripIds: [],
                    insertEntries: [buildEntry({ id: '' })],
                })
            )
        ).rejects.toThrow('One or more entries are missing IDs');
    });
});
