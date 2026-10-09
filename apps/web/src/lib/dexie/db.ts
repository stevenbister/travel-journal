import Dexie, { type EntityTable } from 'dexie';

import type {
    AuthMeta,
    CachedSession,
    Entry,
    EntryHistory,
    OutboxItem,
    SyncMeta,
    Trip,
    TripMember,
    User,
} from './types';

const VERSION = 4;

export const db = new Dexie('travel-journal') as Dexie & {
    authSession: EntityTable<CachedSession, 'id'>;
    authMeta: EntityTable<AuthMeta, 'key'>;
    users: EntityTable<User, 'id'>;
    trips: EntityTable<Trip, 'id', Omit<Trip, 'isDeleted'>>;
    entries: EntityTable<Entry, 'id'>;
    syncMeta: EntityTable<SyncMeta, 'key'>;
    tripMembers: EntityTable<TripMember, 'tripId'>;
    entryHistory: EntityTable<EntryHistory, 'id'>;
    outbox: EntityTable<OutboxItem, 'key'>;
};

db.version(VERSION).stores({
    authSession: 'id',
    authMeta: 'key',
    users: 'id',
    trips: 'id, startDate, endDate, updatedAt',
    entries: 'id, tripId, [tripId+updatedAt], [tripId+entryDate]',
    syncMeta: 'key',
    tripMembers: '[tripId+userId], userId, tripId',
    entryHistory: 'id, entryId, editedAt',
    outbox: 'key, collection, recordId, updatedAt, queuedAt',
});
