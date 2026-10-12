import {
    endOfDay,
    formatDistanceToNowStrict,
    intervalToDuration,
    isAfter,
    isBefore,
    parseISO,
} from 'date-fns';

import { Badge } from '@repo/ui/components/ui/badge';

import { useNow } from '../../lib/sync/use-now';

export type TripBadgeProps = {
    startDate: string;
    endDate: string;
};

export const TripBadge = ({ startDate, endDate }: TripBadgeProps) => {
    const now = useNow();

    const isUpcoming = isAfter(parseISO(startDate), now);
    const isPast = isBefore(endOfDay(parseISO(endDate)), now);
    const isCurrent = !isUpcoming && !isPast;

    const getBadgeContent = () => {
        if (isCurrent) {
            const daysSinceStart = intervalToDuration({
                start: startDate,
                end: new Date(),
            });

            const lengthOfTrip = intervalToDuration({
                start: startDate,
                end: endDate,
            });

            return `Day ${daysSinceStart.days} of ${lengthOfTrip.days}`;
        }

        if (isUpcoming) {
            return `${formatDistanceToNowStrict(startDate)} to go!`;
        }

        return formatDistanceToNowStrict(startDate, { addSuffix: true });
    };

    return (
        <Badge className="text-primary-foreground dark:text-card-foreground">
            {getBadgeContent()}
        </Badge>
    );
};
