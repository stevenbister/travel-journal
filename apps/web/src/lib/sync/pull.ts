import type { Table } from 'dexie';

import { type PullResponse, api } from '../api';
import { db } from '../dexie/db';

type Page<T> = {
    rows: (T & { id: string; isDeleted?: boolean })[];
    cursor: string | null;
    hasMore: boolean;
};

const applyPage = async <T>(
    table: Table<T, string>,
    p: Page<T>,
    isPending: (id: string) => boolean = () => false
) => {
    // `isPending` skips rows with an unsynced local edit: local wins until push resolves it
    const live = p.rows.filter((r) => !isPending(r.id));
    await table.bulkDelete(live.filter((r) => r.isDeleted).map((r) => r.id));
    await table.bulkPut(live.filter((r) => !r.isDeleted));
};

const applyMembership = async (
    users: PullResponse['users'],
    tripMembers: PullResponse['tripMembers'],
    pending: Set<string>
) => {
    await db.users.clear();
    await db.users.bulkPut(users);
    await db.tripMembers.clear();
    await db.tripMembers.bulkPut(tripMembers);

    // Skip trips created offline that haven't been pushed yet: the server doesn't know them.
    const memberTripIds = new Set(tripMembers.map((m) => m.tripId));
    const gone = (await db.trips.toCollection().primaryKeys()).filter(
        (id) => !memberTripIds.has(id) && !pending.has(`trips:${id}`)
    );
    if (gone.length === 0) return;

    // Children first: history -> entries -> trips
    const goneEntryIds = await db.entries
        .where('tripId')
        .anyOf(gone)
        .primaryKeys();
    await db.entryHistory.where('entryId').anyOf(goneEntryIds).delete();
    await db.entries.where('tripId').anyOf(gone).delete();
    await db.trips.bulkDelete(gone);
};

export const pull = async () => {
    const meta = await db.syncMeta.bulkGet([
        'trips',
        'entries',
        'entryHistory',
    ]);
    let [tripsCursor, entriesCursor, historyCursor] = meta.map(
        (m) => (m?.value ?? undefined) as string | undefined
    );

    while (true) {
        const res = await api.sync.pull({
            trips: tripsCursor,
            entries: entriesCursor,
            entryHistory: historyCursor,
        });

        await db.transaction(
            'rw',
            [
                db.trips,
                db.entries,
                db.entryHistory,
                db.tripMembers,
                db.users,
                db.syncMeta,
                db.outbox,
            ],

            async () => {
                const pending = new Set(
                    (await db.outbox.toArray()).map((o) => o.key)
                );

                await applyMembership(res.users, res.tripMembers, pending);

                await applyPage(db.trips, res.trips, (id) =>
                    pending.has(`trips:${id}`)
                );

                await applyPage(db.entries, res.entries, (id) =>
                    pending.has(`entries:${id}`)
                );

                await applyPage(db.entryHistory, res.entryHistory);

                tripsCursor = res.trips.cursor ?? undefined;
                entriesCursor = res.entries.cursor ?? undefined;
                historyCursor = res.entryHistory.cursor ?? undefined;

                await db.syncMeta.bulkPut([
                    { key: 'trips', value: tripsCursor ?? null },
                    { key: 'entries', value: entriesCursor ?? null },
                    { key: 'entryHistory', value: historyCursor ?? null },
                ]);
            }
        );

        if (
            !res.trips.hasMore &&
            !res.entries.hasMore &&
            !res.entryHistory.hasMore
        )
            break;
    }
};
