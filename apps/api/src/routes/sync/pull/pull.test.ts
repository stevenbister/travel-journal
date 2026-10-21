import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';

import {
    mockEntries,
    mockHistory,
    mockTripMembers,
    mockTrips,
    mockUsers,
} from '../../../__fixtures__/db';
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
type EntryHistory = typeof entryHistory.$inferSelect;

const formatResponse = (mockItem: Trips[] | Entries[] | EntryHistory[]) => {
    const lastItem = mockItem[mockItem.length - 1];

    return {
        rows: mockItem.map(
            ({ serverUpdatedAt: _serverUpdatedAt, ...item }) => ({
                ...item,
                createdAt:
                    'createdAt' in item
                        ? item.createdAt?.toISOString()
                        : undefined,
                updatedAt:
                    'updatedAt' in item
                        ? item.updatedAt?.toISOString()
                        : undefined,
                editedAt:
                    'editedAt' in item
                        ? item.editedAt?.toISOString()
                        : undefined,
            })
        ),
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
                        users: mockUsers.map(({ id, name, image }) => ({
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
