import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '../../../lib/dexie/db';

export const useGetEntry = (entryId: string) => {
    // TODO: Join author
    // TODO: Join trip details (just title?)
    const entry = useLiveQuery(
        () => db.entries.get({ id: entryId }),
        [entryId]
    );

    const isPending = entry === undefined;

    return { entry, isPending };
};
