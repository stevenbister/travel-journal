import { AirplaneLandingIcon, CalendarDotsIcon } from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';
import { motion } from 'motion/react';

import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/ui/card';

import type { TripType, TripWithDetails } from '../../../lib/dexie/types';
import { IconBox } from '../../icon-box/icon-box';
import { MemberAvatarGroup } from '../../member-avatar-group/member-avatar-group';
import { getTripDateDescription } from '../utils/get-trip-desciprion';
import { tripLayoutIds } from '../utils/trip-layout';

const MotionCard = motion.create(Card);
const MotionCardTitle = motion.create(CardTitle);
const MotionDescription = motion.create(CardDescription);

export type TripCardProps = {
    trip: TripWithDetails;
    tripType: TripType;
};

export const TripCard = ({ trip, tripType }: TripCardProps) => {
    const { id, title } = trip;
    const isPast = tripType === 'past';
    const description = getTripDateDescription(trip, tripType);
    const layoutIds = tripLayoutIds(id);

    return (
        <Link to={'/trip/$tripId'} params={{ tripId: id }} className="block">
            <MotionCard size="sm" layoutId={layoutIds.container}>
                <CardHeader className="flex gap-4 items-center">
                    <IconBox
                        size="sm"
                        Icon={isPast ? AirplaneLandingIcon : CalendarDotsIcon}
                    />

                    <div className="flex flex-col gap-1">
                        <MotionCardTitle
                            layoutId={layoutIds.title}
                            className="font-display"
                        >
                            {title}
                        </MotionCardTitle>

                        <MotionDescription
                            className="text-xs"
                            layoutId={layoutIds.badge}
                        >
                            {description}
                        </MotionDescription>
                    </div>

                    <motion.div
                        layoutId={layoutIds.members}
                        className="ms-auto"
                    >
                        <MemberAvatarGroup members={trip.members} />
                    </motion.div>
                </CardHeader>
            </MotionCard>
        </Link>
    );
};
