import { toast } from '@repo/ui/components/ui/toast';

import { type PushResponse, api } from '../api';
import { db } from '../dexie/db';

type PushResult = PushResponse['trips'][number];

type RejectedResult = Extract<PushResult, { status: 'rejected' }>;

const reasonDescription: Record<RejectedResult['reason'], string> = {
    forbidden: "You don't have access to this trip anymore.",
    trip_mismatch: "An entry conflicts with what's already on the server.",
    trip_not_found: "An entry's trip hasn't synced to the server yet.",
    future_updated_at:
        'This change is dated in the future — check that your device clock is correct.',
};

// Rejected rows retry on every sync run, so only toast the first time each
// one is rejected; a later successful pass re-arms the flag.
const flagged = new Set<string>();

const serverItem = <T extends { synced?: boolean; isDeleted?: boolean }>({
    synced: _synced,
    isDeleted,
    ...item
}: T) => ({
    ...item,
    isDeleted: isDeleted ?? false,
});

const rejected = (results: PushResult[]) =>
    results.filter((r): r is RejectedResult => r.status === 'rejected');

const notifyRejections = (
    all: (RejectedResult & { collection: 'trips' | 'entries' })[]
) => {
    // One toast even when several rows are rejected in the same run
    const fresh = all.filter(({ collection, id }) => {
        const key = `${collection}:${id}`;
        if (flagged.has(key)) return false;
        flagged.add(key);
        return true;
    });

    if (fresh.length === 0) return;

    const reasons = [...new Set(fresh.map(({ reason }) => reason))];
    const why = reasons.length === 1 ? reasonDescription[reasons[0]!] : '';

    const retryNote =
        'Your changes are saved on this device and will be retried automatically.';

    toast.add({
        title: "Some changes couldn't be synced",
        description: why ? `${why} ${retryNote}` : retryNote,
        type: 'error',
    });
};

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
            flagged.delete(`trips:${id}`);
        }

        for (const id of accepted(res.entries)) {
            await db.entries.update(id, { synced: true });
            flagged.delete(`entries:${id}`);
        }
    });

    notifyRejections([
        ...rejected(res.trips).map((r) => ({
            ...r,
            collection: 'trips' as const,
        })),
        ...rejected(res.entries).map((r) => ({
            ...r,
            collection: 'entries' as const,
        })),
    ]);
};
