import { createFileRoute, notFound } from '@tanstack/react-router';

import { getTripWithDetails } from '../components/trips/hooks/use-get-trip';
import { TripHeader } from '../components/trips/trip-header';
import { db } from '../lib/dexie/db';

export const Route = createFileRoute('/_auth/trip/$tripId')({
    loader: async ({ params }) => {
        const { tripId } = params;
        const trip = await db.trips.get(tripId);

        if (!trip) {
            throw notFound();
        }

        const tripWithDetails = await getTripWithDetails(tripId);

        return tripWithDetails;
    },
    component: RouteComponent,
});

function RouteComponent() {
    const trip = Route.useLoaderData();

    return (
        <div className="h-full w-full max-w-4xl mx-auto">
            <TripHeader initialTrip={trip} />
        </div>
    );
}
