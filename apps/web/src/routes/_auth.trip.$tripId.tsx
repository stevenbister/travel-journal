import { createFileRoute, notFound } from '@tanstack/react-router';

import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@repo/ui/components/ui/tabs';

import { EntriesTimeline } from '../components/entries/entries-timeline';
import { StatsGrid, StatsGridItem } from '../components/stats-grid/stats-grid';
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
        <div className="flex flex-col w-full max-w-4xl mx-auto">
            <TripHeader initialTrip={trip} />

            <StatsGrid>
                <StatsGridItem value="10" label="Entries" />
                <StatsGridItem value="5" label="places" />
                <StatsGridItem value="20" label="Days" />
            </StatsGrid>

            <Tabs
                defaultValue="timeline"
                className="flex min-h-0 flex-1 flex-col"
            >
                {/* Sticks just below the collapsed header
                (68px mobile, 116px on md+ where the header uses p-10). */}
                <div className="container-x sticky top-17 md:top-29 z-20 border-b w-full shrink-0 bg-background">
                    <TabsList>
                        <TabsTrigger value="timeline">Timeline</TabsTrigger>
                        <TabsTrigger value="map">Map</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent
                    value="timeline"
                    className="container-x min-h-0 flex-1"
                >
                    <div className="pb-20">
                        <EntriesTimeline tripId={trip.id} />
                    </div>
                </TabsContent>
                <TabsContent value="map" className="container-x min-h-0 flex-1">
                    <div className="h-lvh">Map</div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
