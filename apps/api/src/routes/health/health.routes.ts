import { createRoute, z } from '@hono/zod-openapi';

import { json } from '../../lib/response-schema';

const tags = ['Health'];

export type HealthRoute = typeof health;

export const health = createRoute({
    method: 'get',
    path: '/health',
    summary: 'Healthcheck',
    description: 'Returns the health status of the API.',
    tags,
    responses: {
        200: json(z.object({ ok: z.boolean() }), 'API status is healthy.'),
    },
});
