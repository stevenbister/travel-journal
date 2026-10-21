import { DurableObject } from 'cloudflare:workers';

import { configureOpenAPI } from './lib/configure-open-api';
import { createApp } from './lib/create-app';
import { geocodingRoutes } from './routes/geocoding/geocoding.index';
import { healthCheckRoutes } from './routes/health/health.index';
import { pullRoutes } from './routes/sync/pull/pull.index';
import { pushRoutes } from './routes/sync/push/push.index';

export class GeocodeGate extends DurableObject {
    #nextSlot = 0;

    // Reserve the next upstream slot. Returns ms to wait, or null if the queue is too long.
    acquire(maxWaitMs: number): number | null {
        const now = Date.now();
        const slot = Math.max(now, this.#nextSlot);
        if (slot - now > maxWaitMs) return null;
        this.#nextSlot = slot + 1100; // policy max is 1 req/s; small safety margin
        return slot - now;
    }

    // Stop sending upstream for a while (after a 429/403/503 from Nominatim).
    backoff(ms: number) {
        this.#nextSlot = Math.max(this.#nextSlot, Date.now() + ms);
    }
}

const app = createApp();

app.openapiRoutes([
    ...healthCheckRoutes,
    ...geocodingRoutes,
    ...pullRoutes,
    ...pushRoutes,
] as const);

configureOpenAPI(app);

export default app;
