import { db } from '../../../lib/dexie/db';
import type { TripMember, User } from '../../../lib/dexie/types';

export const mapUsersToTrip = async (memberRows: TripMember[]) => {
    const users = await db.users.bulkGet([
        ...new Set(memberRows.map((m) => m.userId)),
    ]);
    const userById = new Map(users.filter(Boolean).map((u) => [u!.id, u!]));

    const membersByTrip = new Map<string, User[]>();

    for (const m of memberRows) {
        const user = userById.get(m.userId);
        if (!user) continue;

        const list = membersByTrip.get(m.tripId) ?? [];
        list.push({ id: user.id, name: user.name, image: user.image ?? null });

        membersByTrip.set(m.tripId, list);
    }

    return membersByTrip;
};
