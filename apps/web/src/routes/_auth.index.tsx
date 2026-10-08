import { createFileRoute } from '@tanstack/react-router';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'motion/react';

import {
    HIDE_SHOW_CONTAINER,
    HIDE_SHOW_ITEM,
} from '@repo/ui/constants/animation';

import { EmptyTrips } from '../components/trips/empty-trips';
import { useSession } from '../lib/auth/use-session';
import { db } from '../lib/dexie/db';

export const Route = createFileRoute('/_auth/')({
    component: RouteComponent,
});

function RouteComponent() {
    const { data: session } = useSession();
    const user = session?.user;

    return (
        <motion.div
            className="flex flex-col gap-4 h-full"
            variants={HIDE_SHOW_CONTAINER}
            initial="hidden"
            animate="show"
        >
            <motion.header variants={HIDE_SHOW_ITEM}>
                <span className="text-sm text-muted-foreground">
                    Welcome {user?.name}
                </span>
                <h1>Your trips</h1>
            </motion.header>

            <TripsList />
        </motion.div>
    );
}

// TODO: This is fine here for now - move and replace when building this feature into a proper trips page/component
const TripsList = () => {
    const trips = useLiveQuery(() => db.trips.toArray());

    // TODO: Replace with proper loading skeleton
    if (!trips) return <div>Loading trips...</div>;

    return trips.length > 0 ? (
        <div>
            {trips.map((trip) => (
                <div key={trip.id}>{trip.title}</div>
            ))}
        </div>
    ) : (
        <EmptyTrips />
    );
};
