import Dexie, { type EntityTable } from 'dexie';

import type {
    AuthMeta,
    CachedSession,
    Entry,
    OutboxItem,
    SyncMeta,
    Trip,
} from './types';

const VERSION = 1;

export const db = new Dexie('travel-journal') as Dexie & {
    authSession: EntityTable<CachedSession, 'id'>;
    authMeta: EntityTable<AuthMeta, 'key'>;
    trips: EntityTable<Trip, 'id'>;
    entries: EntityTable<Entry, 'id'>;
    syncMeta: EntityTable<SyncMeta, 'key'>;
    outbox: EntityTable<OutboxItem, 'key'>;
};

db.version(VERSION).stores({
    authSession: 'id',
    authMeta: 'key',
    trips: 'id, updatedAt',
    entries: 'id, tripId, date, updatedAt',
    syncMeta: 'key', // { key: 'trips' | 'entries', value: cursor }
    outbox: 'key, collection, recordId, updatedAt, queuedAt',
});
