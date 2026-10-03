import { index, primaryKey, snakeCase, text } from 'drizzle-orm/sqlite-core';
import { createSelectSchema } from 'drizzle-zod';

import { user } from './auth';
import { trips } from './trips';

export const tripMembers = snakeCase.table(
    'trip_members',
    {
        tripId: text()
            .notNull()
            .references(() => trips.id, { onDelete: 'cascade' }),
        userId: text()
            .notNull()
            .references(() => user.id, { onDelete: 'cascade' }),
    },
    (t) => [
        primaryKey({ columns: [t.tripId, t.userId] }),
        index('trip_members_user_idx').on(t.userId),
    ]
);

export const selectTripMembersSchema = createSelectSchema(tripMembers);
