import { sql } from 'drizzle-orm/sql/sql';
import { index, int, real, snakeCase, text } from 'drizzle-orm/sqlite-core';
import { createSelectSchema } from 'drizzle-zod';

import { user } from './auth';
import { trips } from './trips';

export const entries = snakeCase.table(
    'entries',
    {
        id: text().primaryKey(), // client UUID
        tripId: text()
            .notNull()
            .references(() => trips.id, { onDelete: 'cascade' }),
        authorId: text()
            .notNull()
            .references(() => user.id, { onDelete: 'restrict' }),
        note: text(),
        entryDate: int({ mode: 'timestamp' }).notNull(),
        lat: real(),
        lng: real(),
        tag: text(),
        isDeleted: int({ mode: 'boolean' }).notNull().default(false),
        createdAt: int({ mode: 'timestamp_ms' }).notNull(),
        // Set from the client's edit time so last-write-wins compares like with like
        updatedAt: int({ mode: 'timestamp_ms' }).notNull(),
        // Server arrival time. Pull cursor only, never used for LWW.
        // SQL default 0 only exists so the migration can add the column; always set it on write.
        serverUpdatedAt: int({ mode: 'timestamp_ms' })
            .notNull()
            .default(sql`0`),
    },
    (t) => [
        // Pull sync: WHERE (server_updated_at, id) > (?, ?)
        index('entries_cursor_idx').on(t.serverUpdatedAt, t.id),
        // Filter/search + timeline
        index('entries_trip_date_idx').on(t.tripId, t.entryDate),
        index('entries_trip_tag_idx').on(t.tripId, t.tag),
        index('entries_author_idx').on(t.authorId),
    ]
);

export const selectEntrySchema = createSelectSchema(entries);
