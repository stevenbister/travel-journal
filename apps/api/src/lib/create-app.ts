import { type Hook, OpenAPIHono, z } from '@hono/zod-openapi';
import { contextStorage } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { requestId } from 'hono/request-id';
import { secureHeaders } from 'hono/secure-headers';
import { trimTrailingSlash } from 'hono/trailing-slash';

import { session } from '../middleware/session';
import type { AppBindings } from '../types';
import { configureBetterAuth } from './configure-better-auth';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const defaultHook: Hook<any, any, any, any> = async (result, c) => {
    if (!result.success) {
        return c.json(
            {
                error: z.prettifyError(result.error),
                source: 'custom_error_handler',
            },
            422
        );
    }
};

export const createRouter = <Bindings extends AppBindings>() => {
    return new OpenAPIHono<Bindings>({
        defaultHook,
    });
};

export const createApp = () => {
    const app = createRouter().basePath('/api/v1');

    app.use(contextStorage());
    app.use(secureHeaders());
    app.use(cors());
    app.use(csrf());
    app.use(requestId());
    app.use(trimTrailingSlash());
    app.use(session);

    /**
     * app.all() forwards every HTTP method to Better Auth using the raw Web Standard Request from c.req.raw.
     * Better Auth validates the method and returns a Response that Hono sends directly.
     * Make sure to register the auth route before any catch-all route that could handle the request first.
     */
    app.all('/auth/*', async (c) => {
        const betterAuth = configureBetterAuth(c);

        return betterAuth.handler(c.req.raw);
    });

    app.notFound((c) => c.json({ error: 'Not Found' }, 404));

    return app;
};
