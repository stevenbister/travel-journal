import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '../../../lib/dexie/db';
import type { Entry } from '../../../lib/dexie/types';

export const useGetEntries = (tripId: string, initialEntries?: Entry[]) => {
    const entries = useLiveQuery(
        () => db.entries.where({ tripId }).toArray(),
        [tripId],
        initialEntries
    );

    const isPending = entries === undefined;

    return { entries, isPending };
};
