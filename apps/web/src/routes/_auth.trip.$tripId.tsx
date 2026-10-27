import { createFileRoute, notFound } from '@tanstack/react-router';

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@repo/ui/components/ui/tabs';

import { CreateEntryDrawer } from '../components/entries/create-entry-drawer';
import { EntriesTimeline } from '../components/entries/entries-timeline';
import { EntryMap } from '../components/entries/entry-map';
import { EntryStatsGrid } from '../components/entries/entry-stats-grid';
import { getTripWithDetails } from '../components/trips/hooks/use-get-trip';
import { TripHeader } from '../components/trips/trip-header';
import { db } from '../lib/dexie/db';

export const Route = createFileRoute('/_auth/trip/$tripId')({
    loader: async ({ params }) => {
        const { tripId } = params;
        const trip = await db.trips.get(tripId);
        const entries = await db.entries.where({ tripId }).toArray();

        if (!trip) {
            throw notFound();
        }

        const tripWithDetails = await getTripWithDetails(tripId);

        return { trip: tripWithDetails, entries };
    },
    component: RouteComponent,
});

function RouteComponent() {
    const { trip, entries } = Route.useLoaderData();

    return (
        <div className="flex flex-col w-full">
            <TripHeader initialTrip={trip} />

            <EntryStatsGrid tripId={trip.id} />

            <Tabs
                defaultValue="timeline"
                className="flex min-h-0 flex-1 flex-col"
            >
                {/* Sticks just below the collapsed header
                (68px mobile, 116px on md+ where the header uses p-10). */}
                <div className="container-x sticky top-17 md:top-29 z-20 border-b w-full shrink-0 bg-background">
                    <TabsList>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>

                        {entries.length > 0 ? (
                            <TabsTrigger value="map">Map</TabsTrigger>
                        ) : null}
                    </TabsList>
                </div>

                <TabsContent
                    value="timeline"
                    className="container-x min-h-0 flex-1"
                >
                    <div className="relative pb-20">
                        <EntriesTimeline tripId={trip.id} />

                        <CreateEntryDrawer />
                    </div>
                </TabsContent>

                {entries.length > 0 ? (
                    <TabsContent value="map" className="min-h-0 flex-1">
                        <div className="h-lvh">
                            <EntryMap tripId={trip.id} />
                        </div>
                    </TabsContent>
                ) : null}
            </Tabs>
        </div>
    );
}
