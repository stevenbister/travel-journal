import type { z } from '@hono/zod-openapi';
import { inArray, lt } from 'drizzle-orm';

import { database } from '../../../db';
import { entries, type insertEntrySchema } from '../../../db/schema/entries';
import { trips } from '../../../db/schema/trips';
import type { DrizzleD1 } from '../../../types';
import type { AppliedItem, QueueItems } from './types';

type InsertEntry = z.infer<typeof insertEntrySchema>;

type QueueEntriesParams = {
    queue: QueueItems;
    insertTripIds: string[];
    insertEntries: InsertEntry[];
};

const fetchExistingEntries = async (
    db: DrizzleD1,
    insertEntries: InsertEntry[]
): Promise<Map<string, { id: string; tripId: string }>> => {
    if (!insertEntries.length) return new Map();
    if (insertEntries.some((entry) => !entry.id)) {
        throw new Error('One or more entries are missing IDs');
    }

    const rows = await db
        .select({ id: entries.id, tripId: entries.tripId })
        .from(entries)
        .where(
            inArray(
                entries.id,
                insertEntries.map((entry) => entry.id)
            )
        );

    return new Map(rows.map((row) => [row.id, row]));
};

const buildEntryItem = (db: DrizzleD1, entry: InsertEntry): AppliedItem => {
    const updatedAt = new Date(entry.updatedAt);
    const entryDate = new Date(entry.entryDate);

    return {
        type: 'entry',
        id: entry.id,
        statement: db
            .insert(entries)
            .values({
                id: entry.id,
                tripId: entry.tripId,
                title: entry.title,
                authorId: entry.authorId,
                notes: entry.notes,
                entryDate,
                location: entry.location,
                tag: entry.tag,
                createdAt: new Date(entry.createdAt),
                updatedAt,
            })
            .onConflictDoUpdate({
                target: entries.id,
                // tripId / authorId / createdAt immutable after creation
                set: {
                    title: entry.title,
                    notes: entry.notes,
                    entryDate,
                    location: entry.location,
                    tag: entry.tag,
                    isDeleted: entry.isDeleted,
                    updatedAt,
                },
                setWhere: lt(entries.updatedAt, updatedAt),
            })
            .returning({ id: entries.id }),
    };
};

export const queueEntries = async ({
    queue,
    insertTripIds,
    insertEntries,
}: QueueEntriesParams) => {
    const db = database();

    const tripIds = [...new Set(insertEntries.map((e) => e.tripId))];

    const [existingEntries, existingTrips] = await Promise.all([
        fetchExistingEntries(db, insertEntries),
        db
            .select({ id: trips.id })
            .from(trips)
            .where(inArray(trips.id, tripIds)),
    ]);

    const existingTripIds = new Set([
        ...existingTrips.map((t) => t.id),
        // Assume any new trips we're creating exist so we don't get blocked by missing trip IDs
        // The order of the statements being applied should mean this is technically safe by the time we're actually inserting entries
        ...insertTripIds,
    ]);

    for (const entry of insertEntries) {
        if (!entry.id) throw new Error('Entry must have an ID');

        const existingEntry = existingEntries.get(entry.id);
        if (existingEntry && existingEntry.tripId !== entry.tripId) {
            console.warn(
                `Entry with ID ${entry.id} has a different tripId. Existing: ${existingEntry.tripId}, New: ${entry.tripId}. Skipping.`
            );
            queue.rejected.push({
                type: 'entry',
                id: entry.id,
                reason: 'trip_mismatch',
            });
            continue;
        }

        if (!existingTripIds.has(entry.tripId)) {
            console.warn(
                `Entry with ID ${entry.id} has a tripId that does not exist. TripId: ${entry.tripId}. Skipping.`
            );
            queue.rejected.push({
                type: 'entry',
                id: entry.id,
                reason: 'trip_not_found',
            });
            continue;
        }

        queue.applied.push(buildEntryItem(db, entry));
    }

    return queue;
};
