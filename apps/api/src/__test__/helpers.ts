import { env } from 'cloudflare:workers';
import { type Mock, vi } from 'vitest';

import type { GeocodeGate } from '..';

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
