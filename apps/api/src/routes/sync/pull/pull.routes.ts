import { createRoute, z } from '@hono/zod-openapi';

import { selectEntrySchema } from '../../../db/schema/entries';
import { selectTripSchema } from '../../../db/schema/trips';
import { json } from '../../../lib/response-schema';
import { requireAuth } from '../../../middleware/require-auth';

export type PullRoute = typeof pull;

const tags = ['Sync'];

const page = <T extends z.ZodType>(row: T) =>
    z.object({
        rows: z.array(row),
        cursor: z.string().nullable(),
        hasMore: z.boolean(),
    });

export const pull = createRoute({
    method: 'get',
    path: '/sync/pull',
    summary: 'Pull',
    description: 'Pull sync data from the server',
    tags,
    middleware: [requireAuth],
    request: {
        query: z.object({
            trips: z.string().optional(),
            entries: z.string().optional(),
            limit: z.coerce.number().int().min(1).max(200).default(100),
        }),
    },
    responses: {
        200: json(
            z.object({
                trips: page(selectTripSchema.omit({ serverUpdatedAt: true })),
                entries: page(
                    selectEntrySchema.omit({ serverUpdatedAt: true })
                ),
            }),
            'Changes since the supplied cursors'
        ),
    },
});
