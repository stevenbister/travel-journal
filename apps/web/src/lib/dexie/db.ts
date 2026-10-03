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

const VERSION = 1;

export const db = new Dexie('travel-journal') as Dexie & {
    authSession: EntityTable<CachedSession, 'id'>;
    authMeta: EntityTable<AuthMeta, 'key'>;
    users: EntityTable<User, 'id'>;
    trips: EntityTable<Trip, 'id'>;
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
    trips: 'id, updatedAt',
    entries: 'id, tripId, date, updatedAt',
    syncMeta: 'key',
    tripMembers: '[tripId+userId], userId',
    entryHistory: 'id, entryId, editedAt',
    outbox: 'key, collection, recordId, updatedAt, queuedAt',
});
