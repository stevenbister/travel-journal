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

export interface Trip {
    id: string;
    title: string;
    startDate: number;
    endDate: number;
    coverPhotoId: string | null;
    createdBy: string;
    isDeleted: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface Entry {
    id: string;
    tripId: string;
    authorId: string;
    note: string | null;
    entryDate: string;
    lat: number | null;
    lng: number | null;
    isDeleted: boolean;
    createdAt: number;
    updatedAt: number;
}

export interface SyncMeta {
    key: 'trips' | 'entries';
    value: string | null;
}

export type Collection = 'trips' | 'entries';

export interface OutboxItem {
    key: `${string}:${string}`; // `${collection}:${recordId}`. One row per record
    collection: Collection;
    recordId: string;
    updatedAt: number;
    queuedAt: number;
    attempts: number;
    lastError?: string;
    failed?: boolean;
}
