import { env } from 'cloudflare:workers';
import { Hono } from 'hono';
import { contextStorage } from 'hono/context-storage';
import { type Mock, vi } from 'vitest';

import type { GeocodeGate } from '..';
import type { AppBindings } from '../types';

/**
 * Runs the callback inside an active Hono request context so code that relies
 * on `getContext` (e.g. `database()`) can resolve the environment bindings.
 */
export const runWithAppContext = async <T>(fn: () => Promise<T>): Promise<T> => {
    let outcome!: { ok: true; value: T } | { ok: false; error: unknown };

    const app = new Hono<AppBindings>();
    app.use(contextStorage());
    app.get('/', async () => {
        try {
            outcome = { ok: true, value: await fn() };
        } catch (error) {
            // Hono's default error handler would swallow this, so capture it
            // and re-throw outside of the request
            outcome = { ok: false, error };
        }

        return new Response(null, { status: 204 });
    });

    await app.request('/', {}, env);

    if (!outcome.ok) throw outcome.error;
    return outcome.value;
};

export const mockFetch = <T>({
    ok,
    status,
    json,
}: {
    ok: boolean;
    status: number;
    json?: () => Promise<T>;
}): Mock<typeof fetch> => {
    const fetchMock = vi.fn().mockResolvedValue({
        ok,
        status,
        json,
    });
    vi.stubGlobal('fetch', fetchMock);

    return fetchMock;
};

export const mockGeocodingGate = ({
    acquire,
    backoff,
}: {
    acquire: () => Promise<number | null>;
    backoff: (_ms: number) => void;
}) => {
    return vi.spyOn(env.GEOCODING_GATE, 'get').mockReturnValue({
        acquire,
        backoff,
    } as unknown as DurableObjectStub<GeocodeGate>);
};
