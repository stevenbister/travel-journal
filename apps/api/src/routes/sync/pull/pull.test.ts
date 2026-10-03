import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';

import { MOCK_SESSION } from '../../../__fixtures__/session';
import { entries, trips, user } from '../../../db/schema';
import app from '../../../index';

type Trips = typeof trips.$inferSelect;
type Entries = typeof entries.$inferSelect;

const now = new Date();

const mockTrips: Trips[] = [
    {
        id: '1',
        title: 'Japan 2026',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-15'),
        coverPhotoId: null,
        createdBy: MOCK_SESSION.user.id,
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        serverUpdatedAt: now,
    },
    {
        id: '2',
        title: 'Korea 2026',
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-15'),
        coverPhotoId: null,
        createdBy: MOCK_SESSION.user.id,
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
        authorId: MOCK_SESSION.user.id,
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

const formatResponse = (mockItem: Trips[] | Entries[]) => {
    const lastItem = mockItem[mockItem.length - 1];

    return {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        rows: mockItem.map(({ serverUpdatedAt, ...trip }) => ({
            ...trip,
            createdAt: trip.createdAt.toISOString(),
            updatedAt: trip.updatedAt.toISOString(),
        })),
        cursor: `${lastItem?.serverUpdatedAt.getTime()}_${lastItem?.id}`,
        hasMore: false,
    };
};

describe('Pull', () => {
    beforeEach(async () => {
        const db = drizzle(env.DB);
        await db.insert(user).values(MOCK_SESSION.user);
        await db.insert(trips).values(mockTrips);
        await db.insert(entries).values(mockEntries);
    });

    afterEach(async () => {
        const db = drizzle(env.DB);
        await db.delete(trips);
        await db.delete(entries);
        await db.delete(user);
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
                    })
                )
            );
        });
    });
});
