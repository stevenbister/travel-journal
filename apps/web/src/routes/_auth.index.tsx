import { createFileRoute } from '@tanstack/react-router';
import { motion } from 'motion/react';

import {
    HIDE_SHOW_CONTAINER,
    HIDE_SHOW_ITEM,
} from '@repo/ui/constants/animation';

import { TripsList } from '../components/trips/trips-list';
import { useSession } from '../lib/auth/use-session';

export const Route = createFileRoute('/_auth/')({
    component: RouteComponent,
});

function RouteComponent() {
    const { data: session } = useSession();
    const user = session?.user;

    return (
        <motion.div
            className="flex flex-col gap-6 h-full w-full max-w-4xl mx-auto"
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
