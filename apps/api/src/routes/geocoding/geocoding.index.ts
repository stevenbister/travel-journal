import { defineOpenAPIRoute } from '@hono/zod-openapi';

import { searchHandler } from './geocoding.handlers';
import { search } from './geocoding.routes';

export const geocodingRoutes = [
    defineOpenAPIRoute({
        route: search,
        handler: searchHandler,
    }),
] as const;
