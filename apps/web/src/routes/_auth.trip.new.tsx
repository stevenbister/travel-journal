import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'motion/react';

import {
    HIDE_SHOW_CONTAINER,
    HIDE_SHOW_ITEM,
} from '@repo/ui/constants/animation';

import { BackButton } from '../components/back-button/back-button';
import { CreateTripForm } from '../components/trips/create-trip-form';

export const Route = createFileRoute('/_auth/trip/new')({
    component: NewTripRoute,
});

function NewTripRoute() {
    return (
        <motion.div
            className="flex flex-col gap-4 h-full"
            variants={HIDE_SHOW_CONTAINER}
            initial="hidden"
            animate="show"
        >
            <motion.header
                className="flex items-center gap-4 pb-4 border-b"
                variants={HIDE_SHOW_ITEM}
            >
                <BackButton />
                <h1>New trip</h1>
            </motion.header>

            <CreateTripForm motionVariants={HIDE_SHOW_ITEM} />
        </motion.div>
    );
}
