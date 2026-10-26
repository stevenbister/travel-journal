import { createRoute, z } from '@hono/zod-openapi';

import { insertEntrySchema } from '../../../db/schema/entries';
import { insertTripMembersSchema } from '../../../db/schema/trip-members';
import { insertTripSchema } from '../../../db/schema/trips';
import { json } from '../../../lib/response-schema';
import { requireAuth } from '../../../middleware/require-auth';

export type PushRoute = typeof push;

const tags = ['Sync'];

export const resultSchema = z.discriminatedUnion('status', [
    z.object({ id: z.string(), status: z.enum(['applied', 'stale']) }),
    z.object({
        id: z.string(),
        status: z.literal('rejected'),
        reason: z.enum([
            'trip_not_found',
            'trip_mismatch',
            'forbidden',
            'future_updated_at',
        ]),
    }),
]);

export const push = createRoute({
    method: 'post',
    path: '/sync/push',
    summary: 'Push',
    description: 'Push changes to the server',
    tags,
    middleware: [requireAuth],
    request: {
        body: json(
            z.object({
                trips: z.array(insertTripSchema),
                tripMembers: z.array(insertTripMembersSchema),
                entries: z.array(insertEntrySchema),
            }),
            ''
        ),
    },
    responses: {
        200: json(
            z.object({
                trips: z.array(resultSchema),
                tripMembers: z.array(resultSchema),
                entries: z.array(resultSchema),
            }),
            'Successfully pushed changes to the server'
        ),
        500: json(
            z.object({
                error: z.string(),
            }),
            'Internal server error'
        ),
    },
});
