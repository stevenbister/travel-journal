import { auth } from '@repo/core/auth/server';

import { database } from '../db';
import * as schema from '../db/schema';

export const configureBetterAuth = () => {
    const db = database();
    return auth(db, schema, {
        basePath: '/api/v1/auth',
        baseURL: {
            allowedHosts: [
                'localhost',
                'localhost:5174',
                '127.0.0.1:8787',
                'stevebister.workers.dev',
                process.env.BETTER_AUTH_URL,
            ],
            protocol: process.env.NODE_ENV === 'development' ? 'http' : 'https',
        },
        secret: process.env.BETTER_AUTH_SECRET,
    });
};
