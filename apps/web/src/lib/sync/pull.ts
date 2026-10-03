import type { Table } from 'dexie';

import { api } from '../api';
import { db } from '../dexie/db';

type Page<T> = {
    rows: (T & { id: string; isDeleted: boolean })[];
    cursor: string | null;
    hasMore: boolean;
};

const applyPage = async <T>(
    table: Table<T, string>,
    p: Page<T>,
    pendingIds: Set<string>
) => {
    for (const row of p.rows) {
        if (pendingIds.has(row.id)) continue; // local unsynced edit wins until push resolves it
        if (row.isDeleted) await table.delete(row.id);
        else await table.put(row);
    }
};

export const pull = async () => {
    let [tripsCursor, entriesCursor] = (
        await db.syncMeta.bulkGet(['trips', 'entries'])
    ).map((m) => m?.value as string | undefined);

    while (true) {
        const res = await api.sync.pull({
            trips: tripsCursor,
            entries: entriesCursor,
        });

        await db.transaction(
            'rw',
            db.trips,
            db.entries,
            db.syncMeta,
            db.outbox,
            async () => {
                const pendingIds = new Set(
                    (await db.outbox.toArray()).map((o) => o.recordId)
                );

                await applyPage(db.trips, res.trips, pendingIds);
                await applyPage(db.entries, res.entries, pendingIds);

                tripsCursor = res.trips.cursor ?? undefined;
                entriesCursor = res.entries.cursor ?? undefined;

                await db.syncMeta.bulkPut([
                    { key: 'trips', value: tripsCursor ?? null },
                    { key: 'entries', value: entriesCursor ?? null },
                ]);
            }
        );

        if (!res.trips.hasMore && !res.entries.hasMore) break;
    }
};
