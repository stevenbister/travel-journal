import type { Place } from '../db/schema/entries';
import type { AppBindings } from '../types';

export const MAX_QUEUE_WAIT_MS = 4000; // beyond this, tell the client to retry instead of queueing
export const HIT_TTL_S = 60 * 60 * 24 * 30; // 30 days
export const MISS_TTL_S = 60 * 60 * 24; // 1 day

export class UpstreamError extends Error {
    readonly status: 429 | 502;
    readonly retryAfter?: number;

    constructor(status: 429 | 502, message: string, retryAfter?: number) {
        super(message);
        this.name = 'UpstreamError';
        this.status = status;
        this.retryAfter = retryAfter;
        Object.setPrototypeOf(this, UpstreamError.prototype);
    }
}

export const getCacheKey = async (...parts: string[]) => {
    const data = new TextEncoder().encode(parts.join('|'));
    const digest = await crypto.subtle.digest('SHA-256', data);

    return (
        'geo:' +
        [...new Uint8Array(digest)]
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
    );
};

export const cached = async <T>(
    env: AppBindings['Bindings'],
    key: string,
    cb: () => Promise<T>
): Promise<T> => {
    const hit = await env.GEOCODE_CACHE.get<{ v: T }>(key, 'json');
    if (hit) return hit.v;

    const value = await cb();

    const isEmpty = (v: T) => v == null || (Array.isArray(v) && v.length === 0);

    await env.GEOCODE_CACHE.put(key, JSON.stringify({ v: value }), {
        expirationTtl: isEmpty(value) ? MISS_TTL_S : HIT_TTL_S,
    });

    return value;
};

type NominatimRow = {
    osm_type?: string;
    osm_id?: number;
    lat: string;
    lon: string;
    display_name: string;
    name?: string;
    category?: string;
    type?: string;
    boundingbox?: [string, string, string, string];
    address?: {
        city: string;
        state_district: string;
        state: string;
        'ISO3166-2-lvl4': string;
        postcode: string;
        country: string;
        country_code: string;
    };
};

export const queryNominatim = async (
    env: AppBindings['Bindings'],
    params: Record<string, string>
): Promise<Place[]> => {
    // Set up Durable object to manage rate limiting and queueing for the geocoding service
    const gate = env.GEOCODING_GATE.get(
        env.GEOCODING_GATE.idFromName('global')
    );

    const waitTime = await gate.acquire(MAX_QUEUE_WAIT_MS);

    if (waitTime === null) {
        throw new UpstreamError(429, 'Geocoder is busy, try again shortly', 5);
    }

    if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.search = new URLSearchParams({
        format: 'jsonv2',
        addressdetails: '1',
        dedupe: '1',
        ...params,
    }).toString();

    const res = await fetch(url, {
        headers: {
            'User-Agent': env.NOMINATIM_USER_AGENT,
            Accept: 'application/json',
        },
    });

    if (res.status === 429 || res.status === 403 || res.status === 503) {
        await gate.backoff(60_000);

        throw new UpstreamError(
            429,
            'Geocoder is rate limited, try again later',
            60
        );
    }
    if (!res.ok) {
        throw new UpstreamError(502, `Geocoder returned ${res.status}`);
    }

    const responseData = (await res.json()) as NominatimRow[];

    return responseData.map((r) => ({
        osmType: r.osm_type ?? null,
        osmId: r.osm_id ?? null,
        displayName: r.display_name,
        name: r.name ?? null,
        lat: Number.parseFloat(r.lat),
        lng: Number.parseFloat(r.lon),
        category: r.category ?? null,
        type: r.type ?? null,
        locality:
            r.address?.city ??
            r.address?.state_district ??
            r.address?.state ??
            null,
        country: r.address?.country ?? null,
        countryCode: r.address?.country_code ?? null,
        boundingBox: r.boundingbox ?? null,
    }));
};
