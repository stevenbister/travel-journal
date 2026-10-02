import Dexie, { type EntityTable } from 'dexie';

export interface AuthMeta {
    key: 'pendingSignOut';
    at: number;
}

export interface CachedSession {
    id: 'current';
    user: { id: string; name: string; email: string; image?: string | null };
    expiresAt: number;
    cachedAt: number;
}

const VERSION = 1;

export const db = new Dexie('travel-journal') as Dexie & {
    authSession: EntityTable<CachedSession, 'id'>;
    authMeta: EntityTable<AuthMeta, 'key'>;
};

db.version(VERSION).stores({
    authSession: 'id',
    authMeta: 'key',
});
