import { Link } from '@tanstack/react-router';
import { intervalToDuration } from 'date-fns';
import { motion } from 'motion/react';

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/ui/card';
import { Progress } from '@repo/ui/components/ui/progress';

import { MemberAvatarGroup } from '../../member-avatar-group/member-avatar-group';
import { TripBadge } from '../trip-badge';
import { getTripDateDescription } from '../utils/get-trip-desciprion';
import { tripLayoutIds } from '../utils/trip-layout';
import type { TripCardProps } from './trip-card';

const MotionCard = motion.create(Card);
const MotionCardTitle = motion.create(CardTitle);

export type HeroTripCardProps = Pick<TripCardProps, 'trip' | 'tripType'>;

export const HeroTripCard = ({ trip, tripType }: HeroTripCardProps) => {
    const { id, startDate, endDate } = trip;

    const description = getTripDateDescription(trip, tripType);
    const layoutIds = tripLayoutIds(id);

    const daysSinceStart = intervalToDuration({
        start: startDate,
        end: new Date(),
    });

    const lengthOfTrip = intervalToDuration({
        start: startDate,
        end: endDate,
    });

    const isCurrent =
        tripType === 'current' && !!(daysSinceStart.days && lengthOfTrip.days);
    const isUpcoming = tripType === 'upcoming';

    return (
        <Link to={'/trip/$tripId'} params={{ tripId: id }} className="block">
            <MotionCard
                layoutId={layoutIds.container}
                className="relative h-44 justify-between text-primary-foreground dark:text-card-foreground bg-linear-to-br from-primary to-[hsl(168_55%_13%)]"
                data-hero-card
            >
                <CardHeader>
                    <div className="flex justify-between items-center">
                        {isCurrent || isUpcoming ? (
                            <motion.div layoutId={layoutIds.badge}>
                                <TripBadge
                                    startDate={startDate}
                                    endDate={endDate}
                                />
                            </motion.div>
                        ) : null}

                        <motion.div
                            layoutId={layoutIds.members}
                            className="ms-auto"
                        >
                            <MemberAvatarGroup members={trip.members} />
                        </motion.div>
                    </div>
                </CardHeader>

                <CardContent className="gap-1">
                    <MotionCardTitle
                        layoutId={layoutIds.title}
                        className="font-display text-2xl"
                    >
                        {trip.title}
                    </MotionCardTitle>

                    <CardDescription className="text-sm text-primary-foreground dark:text-card-foreground">
                        {description}
                    </CardDescription>
                </CardContent>

                {isCurrent ? (
                    <Progress
                        value={
                            (daysSinceStart.days! / lengthOfTrip.days!) * 100
                        }
                        className="absolute bottom-0 inset-x-0"
                    />
                ) : null}
            </MotionCard>
        </Link>
    );
};
