import { createMiddleware } from 'hono/factory';

import { configureBetterAuth } from '../lib/configure-better-auth';
import type { AppBindings } from '../types';

export const session = createMiddleware<AppBindings>(async (c, next) => {
    const betterAuth = configureBetterAuth(c);
    const session = await betterAuth.api.getSession({
        headers: c.req.raw.headers,
    });

    c.set('session', session);

    await next();
});
