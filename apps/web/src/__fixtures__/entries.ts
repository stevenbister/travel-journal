import type { Entry } from '../lib/dexie/types';

export const makeEntry = (
    id: string,
    tripId: string,
    overrides: Partial<Entry> = {}
): Entry => ({
    id,
    tripId,
    authorId: 'user-1',
    title: id,
    notes: 'notes',
    entryDate: '2026-10-09T12:00:00.000Z',
    location: null,
    tag: null,
    isDeleted: false,
    synced: true,
    createdAt: '2026-10-01T12:00:00.000Z',
    updatedAt: '2026-10-01T12:00:00.000Z',
    ...overrides,
});
