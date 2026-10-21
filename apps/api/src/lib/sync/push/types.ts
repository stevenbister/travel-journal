import type { BatchItem } from 'drizzle-orm/batch';

export type EntityType = 'trip' | 'tripMember' | 'entry';

export type RejectReason = 'trip_not_found' | 'trip_mismatch' | 'forbidden';

export type AppliedItem = {
    type: EntityType;
    id: string;
    statement: BatchItem<'sqlite'>;
};

export type RejectedItem = {
    type: EntityType;
    id: string;
    reason: RejectReason;
};

export type QueueItems = {
    applied: AppliedItem[];
    rejected: RejectedItem[];
};
