import { type Icon, PlusIcon } from '@phosphor-icons/react';
import { motion } from 'motion/react';

import { buttonVariants } from '@repo/ui/components/ui/button';
import {
    HIDE_SHOW_CONTAINER,
    HIDE_SHOW_ITEM,
} from '@repo/ui/constants/animation';
import { cn } from '@repo/ui/lib/utils';

import { IconBox } from '../icon-box/icon-box';
import { MotionLink } from '../motion-link/motion-link';

const MotionIconBox = motion.create(IconBox);

type EmptyTripsProps = {
    size?: 'default' | 'sm';
    heading?: string;
    description?: string;
    Icon?: Icon;
    showButton?: boolean;
    className?: string;
};

export const EmptyTrips = ({
    size = 'default',
    heading = 'No trips yet',
    description = 'Start a trip and every place you visit will show up here, day by day.',
    Icon,
    showButton = true,
    className,
}: EmptyTripsProps) => {
    return (
        <motion.section
            className={cn(
                'flex flex-col flex-1 items-center justify-center text-center gap-4 p-4',
                className
            )}
            variants={HIDE_SHOW_CONTAINER}
            initial="hidden"
            animate="show"
        >
            <MotionIconBox size={size} Icon={Icon} variants={HIDE_SHOW_ITEM} />

            <motion.div variants={HIDE_SHOW_ITEM}>
                <h2>{heading}</h2>

                <p className="text-muted-foreground text-sm text-balance">
                    {description}
                </p>
            </motion.div>

            {showButton ? (
                <MotionLink
                    to={'/trip/new'}
                    className={buttonVariants({ size: 'lg' })}
                    variants={HIDE_SHOW_ITEM}
                >
                    <PlusIcon /> Create your first trip
                </MotionLink>
            ) : null}
        </motion.section>
    );
};
