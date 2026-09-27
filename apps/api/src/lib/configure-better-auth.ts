import type { Context } from 'hono';

import { auth } from '@repo/core/auth/server';

import { database } from '../db';
import * as schema from '../db/schema';
import type { AppBindings } from '../types';

export const configureBetterAuth = (c: Context<AppBindings>) => {
    const db = database();
    return auth(db, schema, {
        basePath: '/api/v1/auth',
        baseURL: {
            allowedHosts: [
                'localhost',
                'localhost:5174',
                '127.0.0.1:8787',
                ...c.env.BETTER_AUTH_ALLOWED_HOSTS,
            ],
            protocol: process.env.NODE_ENV === 'development' ? 'http' : 'https',
        },
        secret: c.env.BETTER_AUTH_SECRET,
        onAPIError: {
            throw: true,
        },
    });
};
