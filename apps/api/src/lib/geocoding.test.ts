import { env } from 'cloudflare:workers';

import type { GeocodeGate } from '..';
import {
    HIT_TTL_S,
    MAX_QUEUE_WAIT_MS,
    MISS_TTL_S,
    cached,
    getCacheKey,
    queryNominatim,
} from './geocoding';

const mockFetch = <T>({
    ok,
    status,
    json,
}: {
    ok: boolean;
    status: number;
    json?: () => Promise<T>;
}) => {
    const fetchMock = vi.fn().mockResolvedValue({
        ok,
        status,
        json,
    });
    vi.stubGlobal('fetch', fetchMock);

    return fetchMock;
};

const mockGeocodingGate = ({
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

describe('geocoding', () => {
    beforeEach(() => {
        vi.unstubAllGlobals();
        vi.resetAllMocks();
    });

    describe('cache', async () => {
        const cacheKey = await getCacheKey('search', 'new%20york');

        afterEach(() => {
            env.GEOCODE_CACHE.delete(cacheKey);
        });

        it('creates a unique cache key', async () => {
            expect(cacheKey).toMatch(/^geo:\w+/);
        });

        it('creates different cache keys for different inputs', async () => {
            const cacheKey1 = await getCacheKey('search', 'new%20york');
            const cacheKey2 = await getCacheKey('search', 'los%20angeles');

            expect(cacheKey1).not.toBe(cacheKey2);

            env.GEOCODE_CACHE.delete(cacheKey1);
            env.GEOCODE_CACHE.delete(cacheKey2);
        });

        it('stores the result in the cache on the first call', async () => {
            vi.spyOn(env.GEOCODE_CACHE, 'put').mockResolvedValue(undefined);
            const mockCallback = vi.fn(async () => 'cached result');

            const result = await cached(env, cacheKey, mockCallback);

            expect(result).toBe('cached result');
            expect(mockCallback).toHaveBeenCalledTimes(1);
            expect(env.GEOCODE_CACHE.put).toHaveBeenCalledWith(
                cacheKey,
                JSON.stringify({ v: 'cached result' }),
                {
                    expirationTtl: HIT_TTL_S,
                }
            );
        });

        it('stores the result in the cache with the correct TTL for empty values', async () => {
            vi.spyOn(env.GEOCODE_CACHE, 'put').mockResolvedValue(undefined);
            const mockCallback = vi.fn(async () => null);

            const result = await cached(env, cacheKey, mockCallback);

            expect(result).toBeNull();
            expect(mockCallback).toHaveBeenCalledTimes(1);
            expect(env.GEOCODE_CACHE.put).toHaveBeenCalledWith(
                cacheKey,
                JSON.stringify({ v: null }),
                {
                    expirationTtl: MISS_TTL_S,
                }
            );
        });

        it('returns the cached result if cache is hit', async () => {
            const mockCallback = vi.fn(async () => 'cached result');

            await cached(env, cacheKey, mockCallback);
            const result = await cached(env, cacheKey, mockCallback);

            expect(result).toBe('cached result');
            expect(mockCallback).toHaveBeenCalledTimes(1);
        });
    });

    describe('queryNominatim', () => {
        const mockResponse = [
            {
                osm_type: 'node',
                osm_id: 123,
                lat: '40.7128',
                lon: '-74.0060',
                display_name: 'New York, NY, USA',
                address: {
                    city: 'New York',
                    state_district: 'New York County',
                    state: 'New York',
                    'ISO3166-2-lvl4': 'US-NY',
                    postcode: '10001',
                    country: 'United States',
                    country_code: 'us',
                },
            },
        ];

        it('queries Nominatim and returns the expected result', async () => {
            mockFetch({
                ok: true,
                status: 200,
                json: async () => mockResponse,
            });

            const result = await queryNominatim(env, { q: 'New York' });

            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                osmType: 'node',
                osmId: 123,
                displayName: 'New York, NY, USA',
                lat: 40.7128,
                lng: -74.006,
                locality: 'New York',
                country: 'United States',
                countryCode: 'us',
            });
        });

        it('calls the Nominatim API with the correct query parameters', async () => {
            const fetchMock = mockFetch({
                ok: true,
                status: 200,
                json: async () => mockResponse,
            });

            await queryNominatim(env, { q: 'New York' });

            const [url] = fetchMock.mock.calls[0]!;

            expect(url.origin).toBe('https://nominatim.openstreetmap.org');
            expect(url.pathname).toBe('/search');
            const params = new URLSearchParams(url.search);
            expect(params.get('q')).toBe('New York');
        });

        it('inlcudes the nominatim user agent in the request headers', async () => {
            const fetchMock = mockFetch({
                ok: true,
                status: 200,
                json: async () => mockResponse,
            });

            await queryNominatim(env, { q: 'New York' });

            expect(fetchMock).toHaveBeenCalledTimes(1);
            const [_, init] = fetchMock.mock.calls[0]!;

            expect(init.headers['User-Agent']).toBe(env.NOMINATIM_USER_AGENT);
        });

        it('sets up rate limiting with durable object', async () => {
            mockGeocodingGate({
                acquire: vi.fn().mockResolvedValue(true),
                backoff: vi.fn(),
            });

            mockFetch({
                ok: true,
                status: 200,
                json: async () => mockResponse,
            });

            await queryNominatim(env, { q: 'New York' });

            expect(
                env.GEOCODING_GATE.get(env.GEOCODING_GATE.idFromName('global'))
                    .acquire
            ).toHaveBeenCalledWith(MAX_QUEUE_WAIT_MS);
        });

        it.each([429, 403, 503])(
            'backs off when the geocoder is rate limited with status %i',
            async (status) => {
                const backoffMock = vi.fn();
                mockGeocodingGate({
                    acquire: vi.fn().mockResolvedValue(true),
                    backoff: backoffMock,
                });

                mockFetch({
                    ok: false,
                    status: status,
                });

                await expect(
                    queryNominatim(env, { q: 'New York' })
                ).rejects.toThrow('Geocoder is rate limited, try again later');

                expect(backoffMock).toHaveBeenCalledWith(60_000);
            }
        );

        it('throws an UpstreamError when the geocoder is busy', async () => {
            mockGeocodingGate({
                acquire: vi.fn().mockResolvedValue(null),
                backoff: vi.fn(),
            });

            mockFetch({
                ok: false,
                status: 429,
            });

            await expect(
                queryNominatim(env, { q: 'New York' })
            ).rejects.toThrow('Geocoder is busy, try again shortly');
        });

        it('throws an UpstreamError when the geocoder returns an unexpected error', async () => {
            mockFetch({
                ok: false,
                status: 500,
            });

            await expect(
                queryNominatim(env, { q: 'New York' })
            ).rejects.toThrow('Geocoder returned 500');
        });
    });
});
