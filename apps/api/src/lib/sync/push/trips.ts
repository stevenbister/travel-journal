import type { z } from '@hono/zod-openapi';
import { and, eq, inArray, lt } from 'drizzle-orm';

import { database } from '../../../db';
import { isFromTheFuture } from './clock';
import { tripMembers } from '../../../db/schema';
import type { insertTripMembersSchema } from '../../../db/schema/trip-members';
import { type insertTripSchema, trips } from '../../../db/schema/trips';
import type { DrizzleD1 } from '../../../types';
import type { AppliedItem, QueueItems } from './types';

type InsertTrip = z.infer<typeof insertTripSchema>;
type InsertTripMember = z.infer<typeof insertTripMembersSchema>;

type QueueTripsParams = {
    queue: QueueItems;
    insertTrips: InsertTrip[];
    insertTripMembers: InsertTripMember[];
    userId: string;
};

const checkHasUserAndTripId = ({
    tripId,
    userId,
}: {
    tripId?: string | null;
    userId?: string | null;
}) => Boolean(tripId && userId);

const fetchMemberTripIds = async (db: DrizzleD1, userId: string) => {
    const rows = await db
        .select({ id: tripMembers.tripId })
        .from(tripMembers)
        .where(eq(tripMembers.userId, userId));

    return new Set(rows.map((r) => r.id));
};

const fetchExistingTripIds = async (
    db: DrizzleD1,
    insertTrips: InsertTrip[]
) => {
    if (!insertTrips.length) return new Set<string>();
    if (insertTrips.some((t) => !t.id)) {
        throw new Error('One or more trips are missing IDs');
    }

    const rows = await db
        .select({ id: trips.id })
        .from(trips)
        .where(
            inArray(
                trips.id,
                insertTrips.map((t) => t.id!)
            )
        );

    return new Set(rows.map((r) => r.id));
};

const diffTripMembers = async ({
    tripId,
    desiredUserIds,
}: {
    tripId: string;
    desiredUserIds: string[];
}) => {
    const db = database();

    const existing = await db
        .select({ userId: tripMembers.userId })
        .from(tripMembers)
        .where(eq(tripMembers.tripId, tripId));

    const existingIds = new Set(existing.map((m) => m.userId));
    const desiredIds = new Set(desiredUserIds);

    const insertTripMembers = [...desiredIds].reduce<InsertTripMember[]>(
        (acc, userId) => {
            if (!existingIds.has(userId)) acc.push({ tripId, userId });
            return acc;
        },
        []
    );

    const deleteTripMembers = [...existingIds].reduce<InsertTripMember[]>(
        (acc, userId) => {
            if (!desiredIds.has(userId)) acc.push({ tripId, userId });
            return acc;
        },
        []
    );

    return { insertTripMembers, deleteTripMembers };
};

const buildTripItem = (db: DrizzleD1, trip: InsertTrip): AppliedItem => {
    const updatedAt = new Date(trip.updatedAt);
    const startDate = trip.startDate ? new Date(trip.startDate) : null;
    const endDate = trip.endDate ? new Date(trip.endDate) : null;

    return {
        type: 'trip',
        id: trip.id!,
        statement: db
            .insert(trips)
            .values({
                id: trip.id,
                title: trip.title,
                startDate,
                endDate,
                coverPhotoId: trip.coverPhotoId,
                createdBy: trip.createdBy,
                createdAt: new Date(trip.createdAt),
                updatedAt,
            })
            .onConflictDoUpdate({
                target: trips.id,
                // createdBy / createdAt are deliberately not updatable
                set: {
                    title: trip.title,
                    startDate,
                    endDate,
                    coverPhotoId: trip.coverPhotoId,
                    isDeleted: trip.isDeleted,
                    updatedAt,
                },
                // LWW guard
                setWhere: lt(trips.updatedAt, updatedAt),
            })
            .returning({ id: trips.id }),
    };
};

const buildTripMemberItems = (
    db: DrizzleD1,
    diffed: Awaited<ReturnType<typeof diffTripMembers>>
): AppliedItem[] => {
    const { insertTripMembers, deleteTripMembers } = diffed;
    const returning = {
        tripId: tripMembers.tripId,
        userId: tripMembers.userId,
    };

    const inserts = insertTripMembers.reduce<AppliedItem[]>((acc, curr) => {
        if (!checkHasUserAndTripId(curr)) return acc;

        acc.push({
            type: 'tripMember',
            id: `insert-${curr.tripId}-${curr.userId}`,
            statement: db
                .insert(tripMembers)
                .values({ tripId: curr.tripId, userId: curr.userId })
                .onConflictDoNothing()
                .returning(returning),
        });

        return acc;
    }, []);

    const deletes = deleteTripMembers.reduce<AppliedItem[]>((acc, curr) => {
        if (!checkHasUserAndTripId(curr)) return acc;

        acc.push({
            type: 'tripMember',
            id: `delete-${curr.tripId}-${curr.userId}`,
            statement: db
                .delete(tripMembers)
                .where(
                    and(
                        eq(tripMembers.tripId, curr.tripId),
                        eq(tripMembers.userId, curr.userId)
                    )
                )
                .returning(returning),
        });

        return acc;
    }, []);

    return [...inserts, ...deletes];
};

export const queueTrips = async ({
    queue,
    insertTrips,
    insertTripMembers,
    userId,
}: QueueTripsParams) => {
    const db = database();

    const [memberTripIds, existingTripIds] = await Promise.all([
        fetchMemberTripIds(db, userId),
        fetchExistingTripIds(db, insertTrips),
    ]);

    for (const trip of insertTrips) {
        if (!trip.id) throw new Error('Trip ID is missing');

        // Guard the LWW clock against far-future timestamps
        if (isFromTheFuture(trip.updatedAt)) {
            queue.rejected.push({
                type: 'trip',
                id: trip.id,
                reason: 'future_updated_at',
            });
            continue;
        }

        // Only trip members can update existing trips
        if (existingTripIds.has(trip.id) && !memberTripIds.has(trip.id)) {
            console.warn(
                `Trip ${trip.id} exists but user is not a member. Skipping.`
            );
            queue.rejected.push({
                type: 'trip',
                id: trip.id,
                reason: 'forbidden',
            });
            continue;
        }

        queue.applied.push(buildTripItem(db, trip));

        const desiredUserIds = insertTripMembers.reduce<string[]>(
            (acc, curr) => {
                if (curr.tripId === trip.id) {
                    acc.push(curr.userId);
                }
                return acc;
            },
            []
        );

        const diffed = await diffTripMembers({
            tripId: trip.id,
            desiredUserIds,
        });

        queue.applied.push(...buildTripMemberItems(db, diffed));
    }

    return queue;
};
