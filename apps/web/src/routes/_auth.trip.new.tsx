import { CaretLeftIcon } from '@phosphor-icons/react';
import { createFileRoute, useRouter } from '@tanstack/react-router';
import { motion } from 'motion/react';

import { Button } from '@repo/ui/components/ui/button';
import {
    HIDE_SHOW_CONTAINER,
    HIDE_SHOW_ITEM,
} from '@repo/ui/constants/animation';

import { CreateTripForm } from '../components/trips/create-trip-form';

export const Route = createFileRoute('/_auth/trip/new')({
    component: NewTripRoute,
});

function NewTripRoute() {
    const router = useRouter();

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
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => router.history.back()}
                >
                    <CaretLeftIcon />
                    <span className="sr-only">Back</span>
                </Button>
                <h1>New trip</h1>
            </motion.header>

            <CreateTripForm motionVariants={HIDE_SHOW_ITEM} />
        </motion.div>
    );
}
