import { Link } from '@tanstack/react-router';
import { intervalToDuration } from 'date-fns';

import {
    Avatar,
    AvatarFallback,
    AvatarGroup,
    AvatarImage,
} from '@repo/ui/components/ui/avatar';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/ui/card';
import { Progress } from '@repo/ui/components/ui/progress';
import { cn } from '@repo/ui/lib/utils';

import { TripBadge } from '../trip-badge';
import { getTripDateDescription } from '../utils/get-trip-desciprion';
import type { TripCardProps } from './trip-card';

export type HeroTripCardProps = Pick<TripCardProps, 'trip' | 'tripType'>;

export const HeroTripCard = ({ trip, tripType }: HeroTripCardProps) => {
    const { id, startDate, endDate } = trip;

    const description = getTripDateDescription(trip, tripType);

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
        <Link to={'/trip/$tripId'} params={{ tripId: id }}>
            <Card
                className="relative h-44 justify-between text-primary-foreground dark:text-card-foreground bg-linear-to-br from-primary to-[hsl(168_55%_13%)]"
                data-hero-card
            >
                <CardHeader>
                    <div className="flex justify-between items-center">
                        {isCurrent || isUpcoming ? (
                            <TripBadge
                                startDate={startDate}
                                endDate={endDate}
                            />
                        ) : null}

                        <AvatarGroup className="ms-auto">
                            {trip.members.map(({ id, name, image }) => (
                                <Avatar size="sm" key={id}>
                                    {image ? <AvatarImage src={image} /> : null}
                                    <AvatarFallback
                                        className={cn(
                                            name === 'Grace' && 'bg-primary'
                                        )}
                                    >
                                        {name?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                            ))}
                        </AvatarGroup>
                    </div>
                </CardHeader>

                <CardContent className="gap-1">
                    <CardTitle className="font-display text-2xl">
                        {trip.title}
                    </CardTitle>

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
            </Card>
        </Link>
    );
};
