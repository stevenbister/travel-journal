import { useParams } from '@tanstack/react-router';
import {
    motion,
    useMotionValueEvent,
    useReducedMotion,
    useScroll,
    useTransform,
} from 'motion/react';
import { useState } from 'react';

import type { TripWithDetails } from '../../lib/dexie/types';
import { BackButton } from '../back-button/back-button';
import { MemberAvatarGroup } from '../member-avatar-group/member-avatar-group';
import { useGetTrip } from './hooks/use-get-trip';
import { TripBadge } from './trip-badge';
import { tripLayoutIds } from './utils/trip-layout';

// TODO: Fix You are trying to animate minHeight from "auto" to "68". "auto" is not an animatable value.. For more information and steps for solving, visit https://motion.dev/troubleshooting/value-not-animatable
const COLLAPSE_AT = 40;

/**
 * Height of the collapsed header on mobile: `p-4` vertical padding (32px) +
 * icon button row (36px). The tabs bar in the route sticks at this offset
 * (see `top-17`), with an `md:top-29` override for the `md:p-10` padding
 * (40 + 36 + 40 = 116px).
 */
export const TRIP_HEADER_COMPACT_HEIGHT = 68;

type TripHeaderProps = {
    initialTrip?: TripWithDetails;
};

export const TripHeader = ({ initialTrip }: TripHeaderProps) => {
    const { tripId } = useParams({ strict: false });
    const { trip } = useGetTrip(tripId!, initialTrip);
    const [compact, setCompact] = useState(
        () => typeof window !== 'undefined' && window.scrollY > COLLAPSE_AT
    );
    const reduceMotion = useReducedMotion();
    const { scrollY } = useScroll();

    useMotionValueEvent(scrollY, 'change', (value) =>
        setCompact(value > COLLAPSE_AT)
    );

    // Scroll-linked drift: the hero content slides up and fades as the page
    // scrolls, before the collapse below snaps it shut.
    const contentY = useTransform(scrollY, [0, COLLAPSE_AT + 60], [0, -16]);
    const contentOpacity = useTransform(scrollY, [0, COLLAPSE_AT], [1, 0.2]);

    if (!trip) return null;

    const { title, startDate, endDate, members } = trip;
    const layoutIds = tripLayoutIds(tripId!);
    const transition = {
        duration: reduceMotion ? 0 : 0.28,
        ease: 'easeOut' as const,
    };

    return (
        <motion.header
            layoutId={layoutIds.container}
            initial={false}
            animate={{
                gap: compact ? '0px' : '24px',
                minHeight: compact ? TRIP_HEADER_COMPACT_HEIGHT : 208,
                boxShadow: compact
                    ? '0 12px 24px -16px rgb(0 0 0 / 0.5)'
                    : '0 0 0 0 rgb(0 0 0 / 0)',
            }}
            transition={transition}
            className="container sticky top-0 z-20 flex flex-col justify-end bg-linear-to-br from-primary to-[hsl(168_55%_13%)] text-primary-foreground dark:text-card-foreground"
        >
            <div className="flex items-center gap-2">
                <BackButton />
                <motion.span
                    animate={{ opacity: compact ? 1 : 0, x: compact ? 0 : -8 }}
                    transition={transition}
                    aria-hidden={!compact}
                    style={{ pointerEvents: compact ? 'auto' : 'none' }}
                    className="font-display min-w-0 flex-1 truncate text-lg font-medium"
                >
                    {title}
                </motion.span>
            </div>

            <motion.div
                animate={{
                    height: compact ? 0 : 'auto',
                    opacity: compact ? 0 : 1,
                }}
                transition={transition}
            >
                <motion.div
                    style={{ y: contentY, opacity: contentOpacity }}
                    className="flex flex-col gap-1"
                >
                    <motion.div
                        layoutId={layoutIds.badge}
                        className="self-start"
                    >
                        <TripBadge startDate={startDate!} endDate={endDate!} />
                    </motion.div>

                    <motion.h1
                        layoutId={layoutIds.title}
                        className="font-display text-2xl font-medium"
                    >
                        {title}
                    </motion.h1>

                    <motion.div
                        layoutId={layoutIds.members}
                        className="self-start"
                    >
                        <MemberAvatarGroup members={members} />
                    </motion.div>
                </motion.div>
            </motion.div>
        </motion.header>
    );
};
