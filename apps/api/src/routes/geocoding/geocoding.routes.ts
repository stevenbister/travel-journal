import { createRoute, z } from '@hono/zod-openapi';

import { placeSchema } from '../../db/schema/entries';
import { json } from '../../lib/response-schema';
import { requireAuth } from '../../middleware/require-auth';

export type GeocodingSearchRoute = typeof search;

const tags = ['Geocoding'];

export const search = createRoute({
    method: 'get',
    path: '/geocoding/search',
    summary: 'Geocoding endpoint',
    description: 'Returns geocoding information.',
    tags,
    middleware: [requireAuth],
    request: {
        query: z.object({
            q: z.string().min(1, 'Query is required').openapi({
                example: 'New York, NY',
            }),
        }),
    },
    responses: {
        200: json(
            z.object({
                locations: z.array(placeSchema),
                attribution: z.string(),
            }),
            'Matching places'
        ),
        429: json(z.object({ error: z.string() }), 'Rate limited / busy'),
        502: json(z.object({ error: z.string() }), 'Upstream geocoder error'),
    },
});
