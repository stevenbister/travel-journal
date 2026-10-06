import Dexie, { type EntityTable, type Table } from 'dexie';

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

const VERSION = 2;

export const db = new Dexie('travel-journal') as Dexie & {
    authSession: EntityTable<CachedSession, 'id'>;
    authMeta: Table<AuthMeta, 'key'>;
    users: Table<User, 'id'>;
    trips: Table<Trip, 'id', Omit<Trip, 'isDeleted'>>;
    entries: Table<Entry, 'id'>;
    syncMeta: Table<SyncMeta, 'key'>;
    tripMembers: Table<TripMember, 'tripId'>;
    entryHistory: Table<EntryHistory, 'id'>;
    outbox: Table<OutboxItem, 'key'>;
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
