import { formatDistanceToNowStrict } from 'date-fns';

import type { TripType, TripWithDetails } from '../../../lib/dexie/types';

export const getTripDateDescription = (
    trip: TripWithDetails,
    tripType: TripType
) => {
    const { entryCount, startDate } = trip;
    const tripDateDescription = formatDistanceToNowStrict(startDate, {
        addSuffix: true,
    });

    if (tripType === 'current') {
        return `Currently traveling • ${entryCount ?? 0} entries`;
    }

    if (tripType === 'upcoming') {
        return `Starts ${tripDateDescription}`;
    }

    return `${tripDateDescription} • ${entryCount ?? 0} entries`;
};
