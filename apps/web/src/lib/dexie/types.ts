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

export interface User {
    id: string;
    name: string;
    image?: string | null;
}

export interface Trip {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    coverPhotoId: string | null;
    createdBy: string;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
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

export interface EntryHistory {
    id: string;
    entryId: string;
    editedBy: string;
    editedAt: number;
}

export interface TripMember {
    tripId: string;
    userId: string;
}

export type Collection = 'trips' | 'entries' | 'entryHistory';

export interface SyncMeta {
    key: Collection;
    value: string | null;
}

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

export interface TripWithDetails extends Trip {
    members: User[];
    entryCount?: number;
}

export type TripType = 'current' | 'upcoming' | 'past';
