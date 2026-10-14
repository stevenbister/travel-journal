import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '../../../lib/dexie/db';
import type { EntryWithAuthor } from '../../../lib/dexie/types';

export const getEntryWithAuthor = async (
    entryId: string
): Promise<EntryWithAuthor> => {
    const entry = await db.entries.get({ id: entryId });

    if (!entry) throw new Error(`Entry with ID ${entryId} not found`);

    const author = (await db.users.get({ id: entry.authorId })) ?? null;

    return { ...entry, author };
};

export const useGetEntry = (
    entryId: string,
    initialEntry?: EntryWithAuthor
) => {
    const entry = useLiveQuery(
        async () => await getEntryWithAuthor(entryId),
        [entryId],
        initialEntry
    );

    const isPending = entry === undefined;

    return { entry, isPending };
};
