import { createFileRoute } from '@tanstack/react-router';

import { getTripsWithDetails } from '../components/trips/hooks/use-get-trips';
import { TripsList } from '../components/trips/trips-list';
import { useSession } from '../lib/auth/use-session';

export const Route = createFileRoute('/_auth/')({
    loader: async () => await getTripsWithDetails(),
    component: RouteComponent,
});

function RouteComponent() {
    const { data: session } = useSession();
    const user = session?.user;
    const initialTrips = Route.useLoaderData();

    return (
        <div className="container flex flex-col gap-6 h-full w-full max-w-4xl mx-auto pb-40">
            <header>
                <span className="text-sm text-muted-foreground">
                    Welcome {user?.name}
                </span>
                <h1>Your trips</h1>
            </header>

            <TripsList initialTrips={initialTrips} />
        </div>
    );
}
