import { defineOpenAPIRoute } from '@hono/zod-openapi';

import { pushHandler } from './push.handlers';
import { push } from './push.routes';

export const pushRoutes = [
    defineOpenAPIRoute({
        route: push,
        handler: pushHandler,
    }),
] as const;
