import type { RouteConfig, RouteHandler } from '@hono/zod-openapi';
import type { drizzle as drizzleD1 } from 'drizzle-orm/d1';

import type { auth } from '@repo/core/auth/server';

import type { GeocodeGate } from '.';

export type DrizzleD1 = ReturnType<typeof drizzleD1>;

export type Auth = ReturnType<typeof auth>;
export type Session = Auth['$Infer']['Session'];

interface CfBindings extends CloudflareBindings {
    GEOCODING_GATE: DurableObjectNamespace<GeocodeGate>;
}

export type AppBindings = {
    Bindings: CfBindings;
    Variables: {
        db: DrizzleD1;
        session: Session | null;
    };
};

export type AuthedAppBindings = AppBindings & {
    Variables: { session: Session };
};

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<
    R,
    AppBindings
>;

export type AuthedAppRouteHandler<R extends RouteConfig> = RouteHandler<
    R,
    AuthedAppBindings
>;
