import type { DB } from 'better-auth/adapters/drizzle';

import { auth, defaultOptions } from './server';

const mockBetterAuth = vi.hoisted(() => vi.fn());
const mockDrizzleAdapter = vi.hoisted(() => vi.fn());

vi.mock('better-auth', () => ({
    betterAuth: mockBetterAuth,
}));

vi.mock('better-auth/adapters/drizzle', () => ({
    drizzleAdapter: mockDrizzleAdapter,
}));

vi.mock('better-auth/plugins', async (importOriginal) => ({
    ...(await importOriginal),
    openAPI: () => ({ id: 'open-api' }),
}));

vi.mock('better-auth/plugins/admin', () => ({
    admin: () => ({ id: 'admin' }),
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
};

const adapterResult = { type: 'drizzle-adapter' };

describe('auth', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockDrizzleAdapter.mockReturnValue(adapterResult);
    });

    it('calls betterAuth with correct options', async () => {
        auth(mockDB, {}, mockOptions);

        expect(mockDrizzleAdapter).toHaveBeenCalledWith(
            mockDB,
            expect.anything()
        );
        expect(mockBetterAuth).toHaveBeenCalledWith({
            database: adapterResult,
            plugins: [{ id: 'admin' }, { id: 'open-api' }],
            ...defaultOptions,
            ...mockOptions,
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
});
