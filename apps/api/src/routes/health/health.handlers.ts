import type { AppRouteHandler } from '../../types';
import type { HealthRoute } from './health.routes';

export const ok: AppRouteHandler<HealthRoute> = (c) => {
    return c.json({ ok: true }, 200);
};
