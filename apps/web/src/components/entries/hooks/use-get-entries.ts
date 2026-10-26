import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '../../../lib/dexie/db';
import type { Entry } from '../../../lib/dexie/types';

export const useGetEntries = (tripId: string, initialEntries?: Entry[]) => {
    const entries = useLiveQuery(
        async () =>
            (await db.entries.where({ tripId }).toArray()).filter(
                (e) => !e.isDeleted
            ),
        [tripId],
        initialEntries
    );

    const isPending = entries === undefined;

    return { entries, isPending };
};
