import { sql } from 'drizzle-orm';
import {
    type AnySQLiteColumn,
    index,
    int,
    snakeCase,
    text,
} from 'drizzle-orm/sqlite-core';
import {
    createInsertSchema,
    createSelectSchema,
    createUpdateSchema,
} from 'drizzle-zod';
import { z } from 'zod';

import { media } from './media';

export const trips = snakeCase.table(
    'trips',
    {
        id: text()
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        title: text().notNull(),
        startDate: int({ mode: 'timestamp' }),
        endDate: int({ mode: 'timestamp' }),
        coverPhotoId: text('cover_photo_id').references(
            (): AnySQLiteColumn => media.id,
            { onDelete: 'set null' }
        ),
        createdBy: text(),
        isDeleted: int({ mode: 'boolean' }).notNull().default(false),
        createdAt: int({ mode: 'timestamp_ms' }).notNull(),
        // Client edit time (LWW clock), same as entries
        updatedAt: int({ mode: 'timestamp_ms' }).notNull(),
        // Server arrival time. Pull cursor only, never used for LWW.
        serverUpdatedAt: int({ mode: 'timestamp_ms' })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (t) => [
        // Pull sync: WHERE (server_updated_at, id) > (?, ?)
        index('trips_cursor_idx').on(t.serverUpdatedAt, t.id),
    ]
);

export const selectTripSchema = createSelectSchema(trips);
export const insertTripSchema = createInsertSchema(trips, {
    startDate: z.coerce.date().nullish(),
    endDate: z.coerce.date().nullish(),
    createdAt: z.coerce.date().nullish(),
    updatedAt: z.coerce.date().nullish(),
});
export const updateTripSchema = createUpdateSchema(trips, {
    startDate: z.coerce.date().nullish(),
    endDate: z.coerce.date().nullish(),
    createdAt: z.coerce.date().nullish(),
    updatedAt: z.coerce.date().nullish(),
});
