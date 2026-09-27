import {
    type BetterAuthOptions,
    type BetterAuthPlugin,
    betterAuth,
} from 'better-auth';
import type { DB } from 'better-auth/adapters/drizzle';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { openAPI } from 'better-auth/plugins';
import { admin } from 'better-auth/plugins/admin';

type Options = Omit<BetterAuthOptions, 'plugins'>;

export const plugins: BetterAuthPlugin[] = [
    admin(),
    openAPI({
        disableDefaultReference: true,
    }),
];

export const defaultOptions: Options = {
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60,
        },
    },
    emailAndPassword: {
        enabled: true,
    },
    rateLimit: {
        storage: 'database',
        modelName: 'rateLimit',
    },
    advanced: {
        crossSubDomainCookies: {
            enabled: true,
        },
    },
};

export const auth = (
    db: DB,
    schema: Record<string, unknown>,
    options: Options
) => {
    if (!db) throw new Error('DB is required');
    if (!options.baseURL) throw new Error('Base URL is required');
    if (!options.secret) throw new Error('Secret is required');

    return betterAuth({
        database: drizzleAdapter(db, {
            provider: 'sqlite',
            schema,
        }),
        ...defaultOptions,
        ...options,
        plugins,
    });
};
