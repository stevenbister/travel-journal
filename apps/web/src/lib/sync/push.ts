import { type PushResponse, api } from '../api';
import { db } from '../dexie/db';

const serverItem = <T extends { synced?: boolean; isDeleted?: boolean }>({
    synced: _synced,
    isDeleted,
    ...item
}: T) => ({
    ...item,
    isDeleted: isDeleted ?? false,
});

export const push = async () => {
    // New items: local rows the server doesn't have yet
    const localTrips = (await db.trips.toArray()).filter(
        (trip) => !trip.synced
    );
    const localEntries = (await db.entries.toArray()).filter(
        (entry) => !entry.synced
    );

    if (localTrips.length === 0 && localEntries.length === 0) return;

    const tripIds = localTrips.map((trip) => trip.id);
    const localTripMembers =
        tripIds.length > 0
            ? await db.tripMembers.where('tripId').anyOf(tripIds).toArray()
            : [];

    const res = await api.sync.push({
        trips: localTrips.map(serverItem),
        tripMembers: localTripMembers,
        entries: localEntries.map(serverItem),
    });

    // applied + stale both mean the server now holds the row (stale = its LWW
    // copy won, and the following pull fetches it). Rejected rows keep
    // `synced: false` so they retry on the next run.
    const accepted = (results: PushResponse['trips']) =>
        results.filter((r) => r.status !== 'rejected').map((r) => r.id);

    await db.transaction('rw', [db.trips, db.entries], async () => {
        for (const id of accepted(res.trips)) {
            await db.trips.update(id, { synced: true });
        }

        for (const id of accepted(res.entries)) {
            await db.entries.update(id, { synced: true });
        }
    });
};
