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

export interface Place {
    osmType: string | null;
    osmId: number | null;
    displayName: string;
    name: string | null;
    lat: number;
    lng: number;
    category: string | null;
    type: string | null;
    locality: string | null;
    country: string | null;
    countryCode: string | null;
    boundingBox:
        [south: number, north: number, west: number, east: number] | null;
}

export interface Entry {
    id: string;
    tripId: string;
    authorId: string;
    note: string | null;
    entryDate: string;
    location: Place | null;
    tag: string | null;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface EntryHistory {
    id: string;
    entryId: string;
    editedBy: string;
    editedAt: string;
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
    updatedAt: string;
    queuedAt: string;
    attempts: number;
    lastError?: string;
    failed?: boolean;
}

export interface TripWithDetails extends Trip {
    members: User[];
    entryCount?: number;
}

export type TripType = 'current' | 'upcoming' | 'past';
