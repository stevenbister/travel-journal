import { createFileRoute, notFound } from '@tanstack/react-router';

import { db } from '../lib/dexie/db';

export const Route = createFileRoute('/_auth/trip/$tripId')({
    beforeLoad: async ({ params }) => {
        const { tripId } = params;
        const trip = await db.trips.get(tripId);

        if (!trip) {
            throw notFound();
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    return <div>Hello "/_auth/trip/$tripId"!</div>;
}
