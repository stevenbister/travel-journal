import { createFileRoute, notFound } from '@tanstack/react-router';
import { motion } from 'motion/react';

import {
    HIDE_SHOW_CONTAINER,
    HIDE_SHOW_ITEM,
} from '@repo/ui/constants/animation';

import { BackButton } from '../components/back-button/back-button';
import { CreateEntryForm } from '../components/entries/create-entry-form';
import { getTripWithDetails } from '../components/trips/hooks/use-get-trip';

export const Route = createFileRoute('/_auth/trip/$tripId_/entry/new')({
    loader: async ({ params }) => {
        const { tripId } = params;

        const tripWithDetails = await getTripWithDetails(tripId);

        if (!tripWithDetails) {
            throw notFound();
        }

        return tripWithDetails;
    },
    component: NewEntryRoute,
});

function NewEntryRoute() {
    const trip = Route.useLoaderData();

    return (
        <motion.div
            className="container flex flex-col gap-4 h-full"
            variants={HIDE_SHOW_CONTAINER}
            initial="hidden"
            animate="show"
        >
            <motion.header
                className="flex items-center gap-4 pb-4 border-b"
                variants={HIDE_SHOW_ITEM}
            >
                <BackButton />

                <div className="flex flex-col">
                    <h1>New entry</h1>

                    <span className="text-sm text-muted-foreground">
                        {trip.title}
                    </span>
                </div>
            </motion.header>

            <CreateEntryForm motionVariants={HIDE_SHOW_ITEM} />
        </motion.div>
    );
}
