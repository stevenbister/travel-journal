import { env } from 'cloudflare:workers';

import { mockFetch, mockGeocodingGate } from '../../__test__/helpers';
import type { Place } from '../../db/schema/entries';
import app from '../../index';
import { getCacheKey } from '../../lib/geocoding';
import { normalizeQuery } from './geocoding.handlers';

const nominatimRows = [
    {
        osm_type: 'relation',
        osm_id: 175905,
        lat: '40.7127281',
        lon: '-74.0060152',
        display_name: 'New York, United States',
        name: 'New York',
        category: 'boundary',
        type: 'administrative',
        boundingbox: [
            '40.4765780',
            '40.9176300',
            '-74.2588430',
            '-73.7002330',
        ] as [string, string, string, string],
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

const newYorkResults: Place[] = [
    {
        osmType: 'relation',
        osmId: 175905,
        displayName: 'New York, United States',
        name: 'New York',
        lat: 40.7127281,
        lng: -74.0060152,
        category: 'boundary',
        type: 'administrative',
        locality: 'New York',
        country: 'United States',
        countryCode: 'us',
        boundingBox: ['40.4765780', '40.9176300', '-74.2588430', '-73.7002330'],
    },
];

describe('Geocoding', () => {
    const query = 'New York';
    const normalizedQuery = normalizeQuery(query);

    let cacheKey: string;

    beforeEach(async () => {
        vi.unstubAllGlobals();
        vi.resetAllMocks();

        // Ensure a cache miss so the request reaches the mock fetch.
        // GEOCODE_CACHE is real Miniflare KV and persists across watch-mode runs,
        // so a stale entry would otherwise short-circuit queryNominatim entirely.
        cacheKey = await getCacheKey('search', normalizedQuery, '');
        await env.GEOCODE_CACHE.delete(cacheKey);
    });

    afterEach(async () => {
        await env.GEOCODE_CACHE.delete(cacheKey);
        vi.unstubAllGlobals();
    });

    describe('GET /geocoding/search', () => {
        it('returns the geocoded search results', async () => {
            mockGeocodingGate({
                acquire: vi.fn().mockResolvedValue(0),
                backoff: vi.fn(),
            });

            mockFetch({
                ok: true,
                status: 200,
                json: async () => nominatimRows,
            });

            const response = await app.request(
                `/api/v1/geocoding/search?q=${encodeURIComponent(query)}`,
                {},
                env
            );

            expect(response.status).toBe(200);
            expect(await response.json()).toEqual({
                attribution: '© OpenStreetMap contributors (ODbL)',
                locations: newYorkResults,
            });
        });

        it('returns 429 error when rate limited', async () => {
            mockGeocodingGate({
                acquire: vi.fn().mockResolvedValue(true),
                backoff: vi.fn(),
            });

            mockFetch({
                ok: false,
                status: 429,
            });

            const response = await app.request(
                `/api/v1/geocoding/search?q=${encodeURIComponent(query)}`,
                {},
                env
            );

            expect(response.status).toBe(429);
        });

        it('returns a 502 error when the geocoder returns an unexpected error', async () => {
            mockGeocodingGate({
                acquire: vi.fn().mockResolvedValue(true),
                backoff: vi.fn(),
            });

            mockFetch({
                ok: false,
                status: 500,
            });

            const response = await app.request(
                `/api/v1/geocoding/search?q=${encodeURIComponent(query)}`,
                {},
                env
            );

            expect(response.status).toBe(502);
        });
    });
});
