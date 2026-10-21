import type { z } from '@hono/zod-openapi';

import { database } from '../../../db';
import { queueEntries } from '../../../lib/sync/push/entries';
import { queueTrips } from '../../../lib/sync/push/trips';
import type { EntityType, QueueItems } from '../../../lib/sync/push/types';
import type { AuthedAppRouteHandler } from '../../../types';
import type { PushRoute, resultSchema } from './push.routes';

type Result = z.infer<typeof resultSchema>;

const isNonEmpty = <T>(arr: T[]): arr is [T, ...T[]] => arr.length > 0;

export const pushHandler: AuthedAppRouteHandler<PushRoute> = async (c) => {
    const body = c.req.valid('json');
    const session = c.get('session');
    const userId = session.user.id;
    const db = database();

    const queue: QueueItems = {
        applied: [],
        rejected: [],
    };

    await queueTrips({
        queue,
        insertTrips: body.trips,
        insertTripMembers: body.tripMembers,
        userId,
    });

    await queueEntries({
        queue,
        insertTripIds: [...new Set(body.entries.map((e) => e.tripId))],
        insertEntries: body.entries,
    });

    const results: Record<EntityType, Result[]> = {
        trip: [],
        tripMember: [],
        entry: [],
    };

    for (const { type, id, reason } of queue.rejected) {
        results[type].push({ id, status: 'rejected', reason });
    }

    const statements = queue.applied.map((item) => item.statement);

    if (isNonEmpty(statements)) {
        try {
            const batchResults = await db.batch(statements);

            queue.applied.forEach(({ type, id }, i) => {
                const changed = batchResults[i].length > 0;
                results[type].push({
                    id,
                    status: changed ? 'applied' : 'stale',
                });
            });
        } catch (error) {
            console.error('Error processing queue:', error);
            return c.json({ error: 'Error processing queue' }, 500);
        }
    }

    return c.json(
        {
            trips: results.trip,
            tripMembers: results.tripMember,
            entries: results.entry,
        },
        200
    );
};
