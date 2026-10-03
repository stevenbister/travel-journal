import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';

import { MOCK_SESSION } from '../../../__fixtures__/session';
import {
    entries,
    entryHistory,
    tripMembers,
    trips,
    user,
} from '../../../db/schema';
import app from '../../../index';

type Trips = typeof trips.$inferSelect;
type Entries = typeof entries.$inferSelect;
type Users = typeof user.$inferSelect;
type TripMembers = typeof tripMembers.$inferSelect;
type EntryHistory = typeof entryHistory.$inferSelect;

const now = new Date();

const mockUsers: Pick<Users, 'id' | 'name' | 'email' | 'image'>[] = [
    {
        id: MOCK_SESSION.user.id,
        name: MOCK_SESSION.user.name,
        email: MOCK_SESSION.user.email,
        image: MOCK_SESSION.user.image ?? null,
    },
    {
        id: '2',
        name: 'Another User',
        email: 'anotheruser@example.com',
        image: null,
    },
];

const mockTrips: Trips[] = [
    {
        id: '1',
        title: 'Japan 2026',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-15'),
        coverPhotoId: null,
        createdBy: mockUsers[1]!.id!,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        serverUpdatedAt: now,
    },
];

const mockEntries: Entries[] = [
    {
        id: '1',
        tripId: mockTrips[0]!.id,
        authorId: mockUsers[1]!.id!,
        note: 'Sample note',
        entryDate: new Date('2026-04-01'),
        lat: null,
        lng: null,
        tag: 'food',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        serverUpdatedAt: now,
    },
];

const mockTripMembers: TripMembers[] = [
    {
        tripId: mockTrips[0]!.id,
        userId: mockUsers[0]!.id!,
    },
    {
        tripId: mockTrips[0]!.id,
        userId: mockUsers[1]!.id!,
    },
];

const mockHistory: EntryHistory[] = [
    {
        id: '1',
        entryId: mockEntries[0]!.id,
        editedBy: mockUsers[0]!.id!,
        editedAt: now,
        serverUpdatedAt: now,
    },
];

const formatResponse = (mockItem: Trips[] | Entries[] | EntryHistory[]) => {
    const lastItem = mockItem[mockItem.length - 1];

    return {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        rows: mockItem.map(({ serverUpdatedAt, ...item }) => ({
            ...item,
            createdAt:
                'createdAt' in item ? item.createdAt?.toISOString() : undefined,
            updatedAt:
                'updatedAt' in item ? item.updatedAt?.toISOString() : undefined,
            editedAt:
                'editedAt' in item ? item.editedAt?.toISOString() : undefined,
        })),
        cursor: `${lastItem?.serverUpdatedAt.getTime()}_${lastItem?.id}`,
        hasMore: false,
    };
};

describe('Pull', () => {
    beforeEach(async () => {
        const db = drizzle(env.DB);
        await db.insert(user).values(mockUsers);
        await db.insert(trips).values(mockTrips);
        await db.insert(entries).values(mockEntries);
        await db.insert(tripMembers).values(mockTripMembers);
        await db.insert(entryHistory).values(mockHistory);
    });

    afterEach(async () => {
        const db = drizzle(env.DB);
        await db.delete(trips);
        await db.delete(entries);
        await db.delete(user);
        await db.delete(tripMembers);
        await db.delete(entryHistory);
    });

    describe('GET /sync/pull', () => {
        it('returns the list of trips and entries', async () => {
            const response = await app.request('/api/v1/sync/pull', {}, env);
            expect(response.status).toBe(200);

            const body = (await response.json()) as {
                trips: {
                    rows: Trips[];
                    cursor: string | null;
                    hasMore: boolean;
                };
                entries: {
                    rows: Entries[];
                    cursor: string | null;
                    hasMore: boolean;
                };
            };

            expect(body).toEqual(
                JSON.parse(
                    JSON.stringify({
                        trips: formatResponse(mockTrips),
                        entries: formatResponse(mockEntries),
                        users: mockUsers
                            .filter(({ id }) => id !== MOCK_SESSION.user.id)
                            .map(({ id, name, image }) => ({
                                id,
                                name,
                                image,
                            })),
                        entryHistory: formatResponse(mockHistory),
                        tripMembers: mockTripMembers,
                    })
                )
            );
        });
    });
});
