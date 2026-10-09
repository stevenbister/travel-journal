import { AirplaneLandingIcon, CalendarDotsIcon } from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';

import {
    Avatar,
    AvatarFallback,
    AvatarGroup,
    AvatarImage,
} from '@repo/ui/components/ui/avatar';
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@repo/ui/components/ui/card';
import { cn } from '@repo/ui/lib/utils';

import type { TripType, TripWithDetails } from '../../../lib/dexie/types';
import { IconBox } from '../../icon-box/icon-box';
import { getTripDateDescription } from '../utils/get-trip-desciprion';

export type TripCardProps = {
    trip: TripWithDetails;
    tripType: TripType;
};

export const TripCard = ({ trip, tripType }: TripCardProps) => {
    const { id, title, members } = trip;
    const isPast = tripType === 'past';
    const description = getTripDateDescription(trip, tripType);

    return (
        <Link to={'/trip/$tripId'} params={{ tripId: id }}>
            <Card size="sm">
                <CardHeader className="flex gap-4 items-center">
                    <IconBox
                        size="sm"
                        Icon={isPast ? AirplaneLandingIcon : CalendarDotsIcon}
                    />

                    <div className="flex flex-col gap-1">
                        <CardTitle className="font-display">{title}</CardTitle>

                        <CardDescription className="text-xs">
                            {description}
                        </CardDescription>
                    </div>

                    <AvatarGroup className="ms-auto">
                        {members.map(({ id, name, image }) => (
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
                </CardHeader>
            </Card>
        </Link>
    );
};
