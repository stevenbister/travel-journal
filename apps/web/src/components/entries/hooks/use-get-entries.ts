import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '../../../lib/dexie/db';

export const useGetEntries = (tripId: string) => {
    const entries = useLiveQuery(
        () => db.entries.where({ tripId }).toArray(),
        [tripId]
    );

    return entries;
};
