import { and, asc, eq, gt, inArray, ne, or } from 'drizzle-orm';

import { database } from '../../../db';
import {
    entries,
    entryHistory,
    tripMembers,
    trips,
    user,
} from '../../../db/schema';
import type { AuthedAppRouteHandler } from '../../../types';
import type { PullRoute } from './pull.routes';

const parseCursor = (c?: string): [number, string] => {
    if (!c) return [0, ''];
    const i = c.indexOf('_');
    return [Number(c.slice(0, i)), c.slice(i + 1)];
};

type Table = typeof trips | typeof entries | typeof entryHistory;
const cursorWhere = (table: Table, cursor?: string) => {
    const [timestamp, id] = parseCursor(cursor);
    const since = new Date(timestamp);

    return or(
        gt(table.serverUpdatedAt, since),
        and(eq(table.serverUpdatedAt, since), gt(table.id, id))
    );
};

function paginate<R extends { id: string; serverUpdatedAt: Date }, O>(
    rows: R[],
    limit: number,
    cursor: string | undefined,
    serialize: (row: R) => O
) {
    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const last = pageRows.at(-1);

    return {
        rows: pageRows.map(serialize),
        cursor: last
            ? `${last.serverUpdatedAt.getTime()}_${last.id}`
            : (cursor ?? null),
        hasMore,
    };
}

export const pullHandler: AuthedAppRouteHandler<PullRoute> = async (c) => {
    const {
        trips: tripsCursor,
        entries: entriesCursor,
        history: historyCursor,
        limit,
    } = c.req.valid('query');
    const session = c.get('session');
    const userId = session.user.id;

    const db = database();

    const myTripIds = db
        .select({ id: tripMembers.tripId })
        .from(tripMembers)
        .where(eq(tripMembers.userId, userId));
    const myEntryIds = db
        .select({ id: entries.id })
        .from(entries)
        .where(inArray(entries.tripId, myTripIds));

    const [userRows, memberRows, tripRows, entryRows, historyRows] =
        await db.batch([
            // Only two users; we want to have access to some user fields besides our own
            db
                .select({ id: user.id, name: user.name, image: user.image })
                .from(user)
                .where(ne(user.id, userId)),
            db
                .select({
                    tripId: tripMembers.tripId,
                    userId: tripMembers.userId,
                })
                .from(tripMembers)
                .where(inArray(tripMembers.tripId, myTripIds)),

            db
                .select()
                .from(trips)
                .where(
                    and(
                        cursorWhere(trips, tripsCursor),
                        inArray(trips.id, myTripIds)
                    )
                )
                .orderBy(asc(trips.serverUpdatedAt), asc(trips.id))
                .limit(limit + 1), // one extra row to detect hasMore

            db
                .select()
                .from(entries)
                .where(
                    and(
                        cursorWhere(entries, entriesCursor),
                        inArray(entries.tripId, myTripIds)
                    )
                )
                .orderBy(asc(entries.serverUpdatedAt), asc(entries.id))
                .limit(limit + 1), // one extra row to detect hasMore
            db
                .select()
                .from(entryHistory)
                .where(
                    and(
                        cursorWhere(entryHistory, historyCursor),
                        inArray(entryHistory.entryId, myEntryIds)
                    )
                )
                .orderBy(
                    asc(entryHistory.serverUpdatedAt),
                    asc(entryHistory.id)
                )
                .limit(limit + 1),
        ]);

    return c.json(
        {
            users: userRows,
            tripMembers: memberRows,
            trips: paginate(
                tripRows,
                limit,
                tripsCursor,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars -- serverUpdatedAt is only needed for the cursor
                ({ serverUpdatedAt, ...r }) => ({
                    ...r,
                    startDate: r.startDate?.toISOString() ?? null,
                    endDate: r.endDate?.toISOString() ?? null,
                    createdAt: r.createdAt.toISOString(),
                    updatedAt: r.updatedAt.toISOString(),
                })
            ),
            entries: paginate(
                entryRows,
                limit,
                entriesCursor,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars -- serverUpdatedAt is only needed for the cursor
                ({ serverUpdatedAt, ...r }) => ({
                    ...r,
                    entryDate: r.entryDate.toISOString(),
                    createdAt: r.createdAt.toISOString(),
                    updatedAt: r.updatedAt.toISOString(),
                })
            ),
            entryHistory: paginate(
                historyRows,
                limit,
                historyCursor,
                // eslint-disable-next-line @typescript-eslint/no-unused-vars -- serverUpdatedAt is only needed for the cursor
                ({ serverUpdatedAt, ...r }) => ({
                    ...r,
                    editedAt: r.editedAt.toISOString(),
                })
            ),
        },
        200
    );
};
