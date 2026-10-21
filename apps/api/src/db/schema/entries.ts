import { z } from '@hono/zod-openapi';
import { sql } from 'drizzle-orm/sql/sql';
import { index, int, snakeCase, text } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

import { user } from './auth';
import { trips } from './trips';

export const placeSchema = z.object({
    osmType: z.string().nullable(),
    osmId: z.number().nullable(),
    displayName: z.string(),
    name: z.string().nullable(),
    lat: z.number(),
    lng: z.number(),
    category: z.string().nullable(),
    type: z.string().nullable(),
    locality: z.string().nullable(),
    country: z.string().nullable(),
    countryCode: z.string().nullable(),
    boundingBox: z
        .tuple([z.string(), z.string(), z.string(), z.string()])
        .nullable(),
});

export type Place = z.infer<typeof placeSchema>;

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
        title: text(),
        notes: text(),
        entryDate: int({ mode: 'timestamp' }).notNull(),
        tag: text(),
        location: text({ mode: 'json' }).$type<Place>(),
        isDeleted: int({ mode: 'boolean' }).notNull().default(false),
        createdAt: int({ mode: 'timestamp_ms' }).notNull(),
        // Set from the client's edit time so last-write-wins compares like with like
        updatedAt: int({ mode: 'timestamp_ms' }).notNull(),
        // Server arrival time. Pull cursor only, never used for LWW.
        // SQL default 0 only exists so the migration can add the column; always set it on write.
        serverUpdatedAt: int({ mode: 'timestamp_ms' })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
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
export const insertEntrySchema = createInsertSchema(entries)
    .omit({
        serverUpdatedAt: true,
    })
    .extend({
        location: placeSchema,
    });
