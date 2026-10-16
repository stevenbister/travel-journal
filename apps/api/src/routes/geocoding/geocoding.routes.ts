import { createRoute, z } from '@hono/zod-openapi';

import { json } from '../../lib/response-schema';
import { requireAuth } from '../../middleware/require-auth';

export type GeocodingSearchRoute = typeof search;

const tags = ['Geocoding'];

const placeSchema = z.object({
    osmType: z.string().nullable(),
    osmId: z.number().nullable(),
    displayName: z.string(),
    name: z.string().nullable(),
    lat: z.number(),
    lng: z.number(),
    category: z.string().nullable(),
    type: z.string().nullable(),
    locality: z.string().nullable(),
    country: z.string().nullable(),
    countryCode: z.string().nullable(),
    boundingBox: z
        .tuple([z.string(), z.string(), z.string(), z.string()])
        .nullable(),
});

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
