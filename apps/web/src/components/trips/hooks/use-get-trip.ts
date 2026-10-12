import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '../../../lib/dexie/db';
import type { TripWithDetails } from '../../../lib/dexie/types';
import { mapUsersToTrip } from '../utils/map-users-to-trip';

export const getTripWithDetails = async (
    tripId: string
): Promise<TripWithDetails> => {
    const trip = await db.trips.get({ id: tripId });

    if (!trip) throw new Error(`Trip with id ${tripId} not found`);

    const [counts, memberRows] = await Promise.all([
        db.entries.where({ tripId }).count(),
        db.tripMembers.where({ tripId }).toArray(),
    ]);

    const membersByTrip = await mapUsersToTrip(memberRows);

    return {
        ...trip,
        entryCount: counts,
        members: membersByTrip.get(tripId) ?? [],
    };
};

export const useGetTrip = (tripId: string, initialTrip?: TripWithDetails) => {
    const trip = useLiveQuery(
        async () => await getTripWithDetails(tripId),
        [],
        initialTrip
    );

    const isPending = trip === undefined;

    return {
        isPending,
        trip,
    };
};
