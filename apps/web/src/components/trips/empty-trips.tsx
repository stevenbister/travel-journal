import { MapTrifoldIcon, PlusIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';

import { buttonVariants } from '@repo/ui/components/ui/button';
import {
    HIDE_SHOW_CONTAINER,
    HIDE_SHOW_ITEM,
} from '@repo/ui/constants/animation';

import { MotionLink } from '../motion-link/motion-link';

export const EmptyTrips = () => {
    return (
        <motion.section
            className="flex flex-col flex-1 items-center justify-center text-center gap-4 p-4 pb-16"
            variants={HIDE_SHOW_CONTAINER}
            initial="hidden"
            animate="show"
        >
            <motion.div
                className="grid place-items-center size-28 rounded-2xl bg-secondary text-secondary-foreground"
                variants={HIDE_SHOW_ITEM}
            >
                <MapTrifoldIcon
                    weight="duotone"
                    aria-hidden="true"
                    className="size-12"
                />
            </motion.div>

            <motion.div variants={HIDE_SHOW_ITEM}>
                <h2>No trips yet</h2>

                <p className="text-muted-foreground text-sm text-balance">
                    Start a trip and every place you visit will show up here,
                    day by day.
                </p>
            </motion.div>

            <MotionLink
                to={'/trip/new'}
                className={buttonVariants({ size: 'lg' })}
                variants={HIDE_SHOW_ITEM}
            >
                <PlusIcon /> Create your first trip
            </MotionLink>
        </motion.section>
    );
};
