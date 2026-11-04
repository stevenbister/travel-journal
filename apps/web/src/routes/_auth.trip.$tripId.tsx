import { createFileRoute, notFound } from '@tanstack/react-router';

import { CreateEntryDrawer } from '../components/entries/create-entry-drawer';
import { EntriesTimeline } from '../components/entries/entries-timeline';
import { EntryStatsGrid } from '../components/entries/entry-stats-grid';
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

        return { trip: tripWithDetails };
    },
    component: RouteComponent,
});

function RouteComponent() {
    const { trip } = Route.useLoaderData();

    return (
        <div className="flex flex-col w-full">
            <TripHeader initialTrip={trip} />

            <EntryStatsGrid tripId={trip.id} />

            <div className="container-x relative pb-20">
                <EntriesTimeline tripId={trip.id} />

                <CreateEntryDrawer />
            </div>
        </div>
    );
}
