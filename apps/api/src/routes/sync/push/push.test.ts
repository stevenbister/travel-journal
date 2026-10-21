import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';

import {
    mockEntries,
    mockPlace,
    mockTripMembers,
    mockTrips,
    mockUsers,
} from '../../../__fixtures__/db';
import { MOCK_SESSION } from '../../../__fixtures__/session';
import { entries, tripMembers, trips, user } from '../../../db/schema';
import app from '../../../index';

type Trips = typeof trips.$inferSelect;

type PushResult = {
    id: string;
    status: 'applied' | 'stale' | 'rejected';
    reason?: 'trip_not_found' | 'trip_mismatch' | 'forbidden';
};

type PushResponse = {
    trips: PushResult[];
    tripMembers: PushResult[];
    entries: PushResult[];
};

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

const otherTripMembers = [{ tripId: otherTrip.id, userId: '2' }];

const iso = (date: Date) => date.toISOString();

const newTrip = {
    id: 'new-trip',
    title: 'Portugal 2026',
    startDate: iso(new Date('2026-09-01')),
    endDate: iso(new Date('2026-09-10')),
    coverPhotoId: null,
    createdBy: sessionUserId,
    isDeleted: false,
    createdAt: iso(now),
    updatedAt: iso(now),
};

const newEntry = {
    id: 'new-entry',
    tripId: 'new-trip',
    authorId: sessionUserId,
    title: 'Pastel de nata',
    notes: 'Sample notes',
    entryDate: iso(new Date('2026-09-02')),
    tag: 'food',
    location: mockPlace,
    isDeleted: false,
    createdAt: iso(now),
    updatedAt: iso(now),
};

const push = (body: {
    trips?: object[];
    tripMembers?: object[];
    entries?: object[];
}) =>
    app.request(
        '/api/v1/sync/push',
        {
            method: 'POST',
            body: JSON.stringify({
                trips: [],
                tripMembers: [],
                entries: [],
                ...body,
            }),
            headers: { 'content-type': 'application/json' },
        },
        env
    );

describe('Push', () => {
    const db = drizzle(env.DB);

    beforeEach(async () => {
        await db.insert(user).values(mockUsers);
        await db.insert(trips).values([...mockTrips, otherTrip]);
        await db
            .insert(tripMembers)
            .values([...mockTripMembers, ...otherTripMembers]);
        await db.insert(entries).values(mockEntries);
    });

    afterEach(async () => {
        await db.delete(trips);
        await db.delete(entries);
        await db.delete(user);
        await db.delete(tripMembers);
    });

    describe('POST /sync/push', () => {
        it('applies new trips, trip members and entries', async () => {
            const response = await push({
                trips: [newTrip],
                tripMembers: [{ tripId: newTrip.id, userId: sessionUserId }],
                entries: [newEntry],
            });
            expect(response.status).toBe(200);

            const body = (await response.json()) as PushResponse;
            expect(body).toEqual({
                trips: [{ id: 'new-trip', status: 'applied' }],
                tripMembers: [{ id: `insert-new-trip-${sessionUserId}`, status: 'applied' }],
                entries: [{ id: 'new-entry', status: 'applied' }],
            });

            const [trip] = await db.select().from(trips).where(eq(trips.id, 'new-trip'));
            expect(trip).toMatchObject({
                title: 'Portugal 2026',
                startDate: new Date('2026-09-01'),
                createdBy: sessionUserId,
            });

            const [entry] = await db
                .select()
                .from(entries)
                .where(eq(entries.id, 'new-entry'));
            expect(entry).toMatchObject({
                tripId: 'new-trip',
                title: 'Pastel de nata',
                entryDate: new Date('2026-09-02'),
                location: newEntry.location,
            });

            const members = await db
                .select()
                .from(tripMembers)
                .where(eq(tripMembers.tripId, 'new-trip'));
            expect(members).toEqual([{ tripId: 'new-trip', userId: sessionUserId }]);
        });

        it('applies an update to an existing trip when the user is a member', async () => {
            const response = await push({
                trips: [
                    {
                        ...newTrip,
                        id: '1',
                        createdBy: '2',
                        title: 'Japan 2027',
                        updatedAt: iso(
                            new Date(mockTrips[0]!.updatedAt.getTime() + 60_000)
                        ),
                    },
                ],
                tripMembers: [
                    { tripId: '1', userId: mockUsers[0]!.id! },
                    { tripId: '1', userId: mockUsers[1]!.id! },
                ],
            });
            expect(response.status).toBe(200);

            const body = (await response.json()) as PushResponse;
            expect(body).toEqual({
                trips: [{ id: '1', status: 'applied' }],
                tripMembers: [],
                entries: [],
            });

            const [trip] = await db.select().from(trips).where(eq(trips.id, '1'));
            expect(trip?.title).toBe('Japan 2027');
        });

        it('returns stale for an update older than the stored version', async () => {
            const response = await push({
                trips: [
                    {
                        ...newTrip,
                        id: '1',
                        createdBy: '2',
                        title: 'Older title',
                        updatedAt: iso(
                            new Date(mockTrips[0]!.updatedAt.getTime() - 60_000)
                        ),
                    },
                ],
                tripMembers: [
                    { tripId: '1', userId: mockUsers[0]!.id! },
                    { tripId: '1', userId: mockUsers[1]!.id! },
                ],
            });
            expect(response.status).toBe(200);

            const body = (await response.json()) as PushResponse;
            expect(body.trips).toEqual([{ id: '1', status: 'stale' }]);

            const [trip] = await db.select().from(trips).where(eq(trips.id, '1'));
            expect(trip?.title).toBe('Japan 2026');
        });

        it('rejects a trip update when the user is not a member of the trip', async () => {
            const response = await push({
                trips: [
                    {
                        ...newTrip,
                        id: '2',
                        createdBy: '2',
                        title: 'Hacked title',
                        updatedAt: iso(
                            new Date(otherTrip.updatedAt.getTime() + 60_000)
                        ),
                    },
                ],
            });
            expect(response.status).toBe(200);

            const body = (await response.json()) as PushResponse;
            expect(body).toEqual({
                trips: [{ id: '2', status: 'rejected', reason: 'forbidden' }],
                tripMembers: [],
                entries: [],
            });

            const [trip] = await db.select().from(trips).where(eq(trips.id, '2'));
            expect(trip?.title).toBe('Scotland 2026');
        });

        it('rejects an entry whose tripId does not match the existing entry', async () => {
            const response = await push({
                entries: [{ ...newEntry, id: '1', tripId: '2', authorId: '2' }],
            });
            expect(response.status).toBe(200);

            const body = (await response.json()) as PushResponse;
            expect(body).toEqual({
                trips: [],
                tripMembers: [],
                entries: [{ id: '1', status: 'rejected', reason: 'trip_mismatch' }],
            });

            const [entry] = await db.select().from(entries).where(eq(entries.id, '1'));
            expect(entry?.tripId).toBe('1');
        });
    });
});
