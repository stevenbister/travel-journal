import { endOfDay, isAfter, isBefore, parseISO } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import * as React from 'react';

import { db } from '../../../lib/dexie/db';
import type { TripWithDetails } from '../../../lib/dexie/types';
import { useNow } from '../../../lib/sync/use-now';

const getTripsWithDetails = async () => {
    const trips = (await db.trips.toArray()).filter((t) => !t.isDeleted);
    const tripIds = trips.map((t) => t.id);

    const [counts, memberRows] = await Promise.all([
        // One count per trip. Only that trip's entries are scanned for the isDeleted filter
        Promise.all(
            trips.map((t) =>
                db.entries
                    .where('tripId')
                    .equals(t.id)
                    .filter((e) => !e.isDeleted)
                    .count()
            )
        ),
        db.tripMembers.where('tripId').anyOf(tripIds).toArray(),
    ]);

    const users = await db.users.bulkGet([
        ...new Set(memberRows.map((m) => m.userId)),
    ]);
    const userById = new Map(users.filter(Boolean).map((u) => [u!.id, u!]));

    const membersByTrip = new Map<
        string,
        { id: string; name: string; image: string | null }[]
    >();

    for (const m of memberRows) {
        const user = userById.get(m.userId);
        if (!user) continue;

        const list = membersByTrip.get(m.tripId) ?? [];
        list.push({ id: user.id, name: user.name, image: user.image ?? null });

        membersByTrip.set(m.tripId, list);
    }

    return trips.map((trip, i) => ({
        ...trip,
        entryCount: counts[i],
        members: membersByTrip.get(trip.id) ?? [],
    }));
};

const groupTrips = (trips: TripWithDetails[], now: string) => {
    const nowDate = parseISO(now);
    const out = {
        current: [] as TripWithDetails[],
        upcoming: [] as TripWithDetails[],
        past: [] as TripWithDetails[],
    };

    for (const t of trips) {
        // endOfDay makes the end date inclusive: a trip stays "current"
        // until 23:59:59 local time on its last day.
        if (isAfter(parseISO(t.startDate), nowDate)) {
            out.upcoming.push(t);
        } else if (isBefore(endOfDay(parseISO(t.endDate)), nowDate)) {
            out.past.push(t);
        } else {
            out.current.push(t);
        }
    }

    out.upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate));
    out.past.sort((a, b) => b.startDate.localeCompare(a.startDate));

    return out;
};

export const useGetTrips = () => {
    const now = useNow();
    const tripsWithDetails = useLiveQuery(getTripsWithDetails);

    const trips = React.useMemo(
        () =>
            tripsWithDetails ? groupTrips(tripsWithDetails, now) : undefined,
        [tripsWithDetails, now]
    );

    const isPending = trips === undefined;

    return {
        isPending,
        trips,
    };
};
