import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '../../../lib/dexie/db';
import { mapUsersToTrip } from '../utils/map-users-to-trip';

const getTripWithDetails = async (tripId: string) => {
    const trip = await db.trips.get({ id: tripId });

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

export const useGetTrip = (tripId: string) => {
    const trip = useLiveQuery(async () => await getTripWithDetails(tripId));

    const isPending = trip === undefined;

    return {
        isPending,
        trip,
    };
};
