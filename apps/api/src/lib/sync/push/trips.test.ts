import { env } from 'cloudflare:workers';
import type { z } from '@hono/zod-openapi';
import { drizzle } from 'drizzle-orm/d1';

import {
    mockTripMembers,
    mockTrips,
    mockUsers,
} from '../../../__fixtures__/db';
import { MOCK_SESSION } from '../../../__fixtures__/session';
import { runWithAppContext } from '../../../__test__/helpers';
import { tripMembers, trips, user } from '../../../db/schema';
import { type insertTripSchema } from '../../../db/schema/trips';
import { queueTrips } from './trips';
import type { QueueItems } from './types';

type Trips = typeof trips.$inferSelect;
type InsertTrip = z.infer<typeof insertTripSchema>;

const now = new Date();
const sessionUserId = MOCK_SESSION.user.id;

// The session user is not a member of this trip
const otherTrip: Trips = {
    id: '2',
    title: 'Scotland 2026',
    startDate: null,
    endDate: null,
    coverPhotoId: null,
    createdBy: '2',
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    serverUpdatedAt: now,
};

const buildTrip = (overrides: Partial<InsertTrip> = {}): InsertTrip => ({
    id: 'new-trip',
    title: 'Portugal 2026',
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-09-10'),
    coverPhotoId: null,
    createdBy: sessionUserId,
    isDeleted: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
});

const makeQueue = (): QueueItems => ({ applied: [], rejected: [] });

describe('queueTrips', () => {
    const db = drizzle(env.DB);

    beforeEach(async () => {
        await db.insert(user).values(mockUsers);
        await db.insert(trips).values([...mockTrips, otherTrip]);
        await db.insert(tripMembers).values(mockTripMembers);
    });

    afterEach(async () => {
        await db.delete(trips);
        await db.delete(user);
        await db.delete(tripMembers);
    });

    it('queues an upsert and member inserts for a new trip', async () => {
        const queue = await runWithAppContext(() =>
            queueTrips({
                queue: makeQueue(),
                insertTrips: [buildTrip()],
                insertTripMembers: [{ tripId: 'new-trip', userId: sessionUserId }],
                userId: sessionUserId,
            })
        );

        expect(queue.rejected).toEqual([]);
        expect(queue.applied.map(({ id }) => id)).toEqual([
            'new-trip',
            `insert-new-trip-${sessionUserId}`,
        ]);
    });

    it('queues member inserts and deletes to match the desired members', async () => {
        const queue = await runWithAppContext(() =>
            queueTrips({
                queue: makeQueue(),
                insertTrips: [buildTrip({ id: '1', createdBy: '2' })],
                insertTripMembers: [
                    // Existing member, no change
                    { tripId: '1', userId: sessionUserId },
                    // New member to add
                    { tripId: '1', userId: '3' },
                ],
                userId: sessionUserId,
            })
        );

        expect(queue.rejected).toEqual([]);
        expect(queue.applied.map(({ id }) => id)).toEqual([
            '1',
            'insert-1-3',
            // Member not in the desired list is removed
            'delete-1-2',
        ]);
    });

    it('rejects an update to a trip the user is not a member of', async () => {
        const queue = await runWithAppContext(() =>
            queueTrips({
                queue: makeQueue(),
                insertTrips: [buildTrip({ id: '2', createdBy: '2' })],
                insertTripMembers: [],
                userId: sessionUserId,
            })
        );

        expect(queue.applied).toEqual([]);
        expect(queue.rejected).toEqual([
            { type: 'trip', id: '2', reason: 'forbidden' },
        ]);
    });

    it('throws when a trip is missing an ID', async () => {
        await expect(
            runWithAppContext(() =>
                queueTrips({
                    queue: makeQueue(),
                    insertTrips: [buildTrip({ id: '' })],
                    insertTripMembers: [],
                    userId: sessionUserId,
                })
            )
        ).rejects.toThrow('One or more trips are missing IDs');
    });
});
