import { defineOpenAPIRoute } from '@hono/zod-openapi';

import { pullHandler } from './pull.handlers';
import { pull } from './pull.routes';

export const pullRoutes = [
    defineOpenAPIRoute({
        route: pull,
        handler: pullHandler,
    }),
] as const;
