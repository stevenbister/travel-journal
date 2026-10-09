import { sql } from 'drizzle-orm';
import { index, int, snakeCase, text } from 'drizzle-orm/sqlite-core';
import { createSelectSchema } from 'drizzle-zod';

import { user } from './auth';
import { entries } from './entries';

export const entryHistory = snakeCase.table(
    'entry_history',
    {
        id: text()
            .primaryKey()
            .$defaultFn(() => crypto.randomUUID()),
        entryId: text()
            .notNull()
            .references(() => entries.id, { onDelete: 'cascade' }),
        editedBy: text()
            .notNull()
            .references(() => user.id, { onDelete: 'restrict' }),
        editedAt: int({ mode: 'timestamp_ms' }).notNull(),
        serverUpdatedAt: int({ mode: 'timestamp_ms' })
            .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
            .$onUpdate(() => /* @__PURE__ */ new Date())
            .notNull(),
    },
    (t) => [
        index('entry_history_entry_idx').on(t.entryId, t.editedAt),
        index('entry_history_cursor_idx').on(t.serverUpdatedAt, t.id),
    ]
);

export const selectHistorySchema = createSelectSchema(entryHistory);
