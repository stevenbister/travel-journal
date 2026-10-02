import { authClient } from '@repo/core/auth/client';

import { type CachedSession, db } from '../dexie/db';
import { checkIsOnline } from '../online/check-is-online';

export async function flushPendingSignOut() {
    const pending = await db.authMeta.get('pendingSignOut');
    if (!pending) return true;
    const isOnline = await checkIsOnline();
    if (!isOnline) return false;

    try {
        await authClient.signOut({
            fetchOptions: { signal: AbortSignal.timeout(5000) },
        });

        await db.authMeta.delete('pendingSignOut');
        return true;
    } catch {
        return false;
    }
}

async function getSessionCache() {
    const cached = await db.authSession.get('current');
    if (!cached || cached.expiresAt < Date.now()) return null;
    return cached;
}

export async function getSession() {
    if (await db.authMeta.get('pendingSignOut')) {
        await flushPendingSignOut();
        return null; // never re-cache a session while sign-out is pending
    }

    const isOnline = await checkIsOnline();
    if (!isOnline) return getSessionCache();

    try {
        const { data } = await authClient.getSession({
            fetchOptions: { signal: AbortSignal.timeout(3000) }, // don't hang on flaky connections
        });

        if (data?.session) {
            const cached: CachedSession = {
                id: 'current',
                user: {
                    id: data.user.id,
                    name: data.user.name,
                    email: data.user.email,
                    image: data.user.image,
                },
                expiresAt: new Date(data.session.expiresAt).getTime(),
                cachedAt: Date.now(),
            };
            await db.authSession.put(cached);
            return cached;
        }

        // Server answered and says there's no session
        await db.authSession.clear();
        return null;
    } catch {
        console.error('Failed to fetch session, falling back to cache');
        return getSessionCache();
    }
}
