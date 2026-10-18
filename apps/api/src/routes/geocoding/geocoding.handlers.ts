import {
    UpstreamError,
    cached,
    getCacheKey,
    queryNominatim,
} from '../../lib/geocoding';
import type { AppRouteHandler } from '../../types';
import type { GeocodingSearchRoute } from './geocoding.routes';

export const normalizeQuery = (q: string) =>
    q.toLowerCase().replace(/\s+/g, ' ');

export const searchHandler: AppRouteHandler<GeocodingSearchRoute> = async (
    c
) => {
    const { q } = c.req.valid('query');
    const normalized = normalizeQuery(q);
    const acceptLanguage = c.req.header('Accept-Language');

    try {
        const cachedKey = await getCacheKey(
            'search',
            normalized,
            acceptLanguage ?? ''
        );
        const results = await cached(c.env, cachedKey, async () => {
            return await queryNominatim(
                c.env,
                { q: normalized },
                { acceptLanguage }
            );
        });

        return c.json(
            {
                locations: results,
                attribution: '© OpenStreetMap contributors (ODbL)',
            },
            200
        );
    } catch (e) {
        if (e instanceof UpstreamError) {
            if (e.retryAfter) c.header('Retry-After', String(e.retryAfter));
            return c.json({ error: e.message }, e.status);
        }
        throw e;
    }
};
