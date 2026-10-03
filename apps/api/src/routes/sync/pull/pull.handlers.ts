import { and, asc, eq, gt, or } from 'drizzle-orm';

import { database } from '../../../db';
import { entries, trips } from '../../../db/schema';
import type { AuthedAppRouteHandler } from '../../../types';
import type { PullRoute } from './pull.routes';

const parseCursor = (c?: string): [number, string] => {
    if (!c) return [0, ''];
    const i = c.indexOf('_');
    return [Number(c.slice(0, i)), c.slice(i + 1)];
};

const cursorWhere = (table: typeof trips | typeof entries, cursor?: string) => {
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
        limit,
    } = c.req.valid('query');
    const db = database();

    const [tripRows, entryRows] = await db.batch([
        db
            .select()
            .from(trips)
            .where(cursorWhere(trips, tripsCursor))
            .orderBy(asc(trips.serverUpdatedAt), asc(trips.id))
            .limit(limit + 1), // one extra row to detect hasMore
        db
            .select()
            .from(entries)
            .where(cursorWhere(entries, entriesCursor))
            .orderBy(asc(entries.serverUpdatedAt), asc(entries.id))
            .limit(limit + 1), // one extra row to detect hasMore
    ]);

    return c.json(
        {
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
        },
        200
    );
};
