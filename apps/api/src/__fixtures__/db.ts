import type { entries, entryHistory, tripMembers, trips, user } from '../db/schema';
import type { Place } from '../db/schema/entries';

import { MOCK_SESSION } from './session';

type Users = typeof user.$inferSelect;
type Trips = typeof trips.$inferSelect;
type Entries = typeof entries.$inferSelect;
type TripMembers = typeof tripMembers.$inferSelect;
type EntryHistory = typeof entryHistory.$inferSelect;

const now = new Date();

export const mockPlace: Place = {
    osmType: 'node',
    osmId: 123,
    displayName: 'Lisbon, Portugal',
    name: 'Lisbon',
    lat: 38.7223,
    lng: -9.1393,
    category: null,
    type: null,
    locality: 'Lisbon',
    country: 'Portugal',
    countryCode: 'pt',
    boundingBox: null,
};

export const mockUsers: Pick<Users, 'id' | 'name' | 'email' | 'image'>[] = [
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

export const mockTrips: Trips[] = [
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

export const mockTripMembers: TripMembers[] = [
    {
        tripId: mockTrips[0]!.id,
        userId: mockUsers[0]!.id!,
    },
    {
        tripId: mockTrips[0]!.id,
        userId: mockUsers[1]!.id!,
    },
];

export const mockEntries: Entries[] = [
    {
        id: '1',
        tripId: mockTrips[0]!.id,
        authorId: mockUsers[1]!.id!,
        title: 'Sample title',
        notes: 'Sample notes',
        entryDate: new Date('2026-04-01'),
        location: null,
        tag: 'food',
        isDeleted: false,
        createdAt: now,
        updatedAt: now,
        serverUpdatedAt: now,
    },
];

export const mockHistory: EntryHistory[] = [
    {
        id: '1',
        entryId: mockEntries[0]!.id,
        editedBy: mockUsers[0]!.id!,
        editedAt: now,
        serverUpdatedAt: now,
    },
];
