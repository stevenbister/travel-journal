import { useLiveQuery } from 'dexie-react-hooks';

import { db } from '../dexie/db';

export function useSession() {
    // undefined = still loading, null = no cached session
    const cached = useLiveQuery(
        async () => (await db.authSession.get('current')) ?? null,
        []
    );

    const isPending = cached === undefined;
    const valid = cached && cached.expiresAt > Date.now() ? cached : null;

    return {
        data: valid ? { user: valid.user } : null,
        isPending,
    };
}
