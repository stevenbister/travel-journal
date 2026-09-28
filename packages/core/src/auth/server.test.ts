import type { DB } from 'better-auth/adapters/drizzle';

import { auth, defaultOptions, plugins } from './server';

const mockBetterAuth = vi.hoisted(() => vi.fn());
const mockDrizzleAdapter = vi.hoisted(() => vi.fn());
const mockAdmin = vi.hoisted(() => vi.fn(() => ({ id: 'admin' })));
const mockOpenAPI = vi.hoisted(() => vi.fn(() => ({ id: 'open-api' })));
const mockOAuthProxy = vi.hoisted(() => vi.fn(() => ({ id: 'oauth-proxy' })));

vi.mock('better-auth', () => ({
    betterAuth: mockBetterAuth,
}));

vi.mock('better-auth/adapters/drizzle', () => ({
    drizzleAdapter: mockDrizzleAdapter,
}));

vi.mock('better-auth/plugins', async (importOriginal) => ({
    ...(await importOriginal<typeof import('better-auth/plugins')>()),
    openAPI: mockOpenAPI,
    oAuthProxy: mockOAuthProxy,
}));

vi.mock('better-auth/plugins/admin', () => ({
    admin: mockAdmin,
}));

const mockDB: DB = {
    prepare: vi.fn(),
    dump: vi.fn(),
    batch: vi.fn(),
    exec: vi.fn(),
};

const mockOptions = {
    baseURL: 'https://example.com',
    hashFn: vi.fn(),
    verifyFn: vi.fn(),
    trustedOrigins: ['http://localhost:5173'],
    secret: 'secret',
    OAuthProxySecret: 'oauth-proxy-secret',
};

const mockSchema = { users: { name: 'users' } };

const adapterResult = { type: 'drizzle-adapter' };

const expectedPlugins = [
    { id: 'admin' },
    { id: 'open-api' },
    { id: 'oauth-proxy' },
];

describe('auth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDrizzleAdapter.mockReturnValue(adapterResult);
    });

    it('calls betterAuth with correct options', async () => {
        auth(mockDB, mockSchema, mockOptions);

        expect(mockDrizzleAdapter).toHaveBeenCalledWith(mockDB, {
            provider: 'sqlite',
            schema: mockSchema,
        });
        expect(mockAdmin).toHaveBeenCalledWith();
        expect(mockOpenAPI).toHaveBeenCalledWith({
            disableDefaultReference: true,
        });
        expect(mockOAuthProxy).toHaveBeenCalledWith({
            productionURL: 'https://travel-journal.stevenbister.com/api',
            secret: mockOptions.OAuthProxySecret,
        });
        expect(mockBetterAuth).toHaveBeenCalledWith({
            database: adapterResult,
            plugins: expectedPlugins,
            ...defaultOptions,
            ...mockOptions,
        });
    });

    it('returns admin, openAPI and oAuthProxy plugins', () => {
        const secret = 'oauth-proxy-secret';

        expect(plugins(secret)).toEqual(expectedPlugins);
        expect(mockAdmin).toHaveBeenCalledWith();
        expect(mockOpenAPI).toHaveBeenCalledWith({
            disableDefaultReference: true,
        });
        expect(mockOAuthProxy).toHaveBeenCalledWith({
            productionURL: 'https://travel-journal.stevenbister.com/api',
            secret,
        });
    });

    it('throws error if DB is not provided', async () => {
        // @ts-expect-error - DB is required but explicitly not provided
        expect(() => auth(undefined)).toThrow('DB is required');
    });

    it('throws error if baseURL is not provided', async () => {
        expect(() =>
            auth(mockDB, {}, { ...mockOptions, baseURL: undefined })
        ).toThrow('Base URL is required');
    });

    it('throws error if secret is not provided', async () => {
        expect(() =>
            auth(mockDB, {}, { ...mockOptions, secret: undefined })
        ).toThrow('Secret is required');
    });

    it('throws error if OAuthProxySecret is not provided', async () => {
        expect(() =>
            // @ts-expect-error - OAuthProxySecret is required but explicitly not provided
            auth(mockDB, {}, { ...mockOptions, OAuthProxySecret: undefined })
        ).toThrow('OAuth Proxy Secret is required');
    });
});
