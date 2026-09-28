import type { Context } from 'hono';

import { auth } from '@repo/core/auth/server';

import { database } from '../db';
import * as schema from '../db/schema';
import type { AppBindings } from '../types';

export const configureBetterAuth = (c: Context<AppBindings>) => {
    const db = database();
    return auth(db, schema, {
        basePath: '/api/v1/auth',
        baseURL: c.env.BETTER_AUTH_URL,
        OAuthProxySecret: c.env.BETTER_AUTH_OAUTH_PROXY_SECRET,
        trustedOrigins: [
            'http://localhost:5173',
            'https://travel-journal.stevenbister.com',
            'https://*-travel-journal-api.stevebister.workers.dev',
        ],
        socialProviders: {
            google: {
                clientId: c.env.GOOGLE_CLIENT_ID,
                clientSecret: c.env.GOOGLE_CLIENT_SECRET,
                accessType: 'offline',
                prompt: 'select_account consent',
                redirectURI: `${c.env.BETTER_AUTH_URL}/api/v1/auth/callback/google`,
                disableSignUp: true,
            },
        },
        secret: c.env.BETTER_AUTH_SECRET,
        onAPIError: {
            throw: true,
        },
    });
};
