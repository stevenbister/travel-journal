import { useParams } from '@tanstack/react-router';
import { motion } from 'motion/react';

import type { TripWithDetails } from '../../lib/dexie/types';
import { BackButton } from '../back-button/back-button';
import { MemberAvatarGroup } from '../member-avatar-group/member-avatar-group';
import { useGetTrip } from './hooks/use-get-trip';
import { TripBadge } from './trip-badge';
import { tripLayoutIds } from './utils/trip-layout';

type TripHeaderProps = {
    initialTrip?: TripWithDetails;
};

export const TripHeader = ({ initialTrip }: TripHeaderProps) => {
    const { tripId } = useParams({ strict: false });
    const { trip } = useGetTrip(tripId!, initialTrip);

    if (!trip) return null;

    const { title, startDate, endDate, members } = trip;
    const layoutIds = tripLayoutIds(tripId!);

    return (
        <motion.header
            layoutId={layoutIds.container}
            className="container flex flex-col justify-end gap-6 text-primary-foreground dark:text-card-foreground bg-linear-to-br from-primary to-[hsl(168_55%_13%)] min-h-52"
        >
            <BackButton />

            <div className="flex flex-col gap-1">
                <motion.div layoutId={layoutIds.badge} className="self-start">
                    <TripBadge startDate={startDate!} endDate={endDate!} />
                </motion.div>

                <motion.h1
                    layoutId={layoutIds.title}
                    className="font-display text-2xl font-medium"
                >
                    {title}
                </motion.h1>

                <motion.div layoutId={layoutIds.members} className="self-start">
                    <MemberAvatarGroup members={members} />
                </motion.div>
            </div>
        </motion.header>
    );
};
