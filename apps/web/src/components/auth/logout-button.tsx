import { SignOutIcon } from '@phosphor-icons/react';
import { useNavigate } from '@tanstack/react-router';

import { authClient } from '@repo/core/auth/client';

import { Button } from '@repo/ui/components/ui/button';

import { flushPendingSignOut } from '../../lib/auth/session';
import { db } from '../../lib/dexie/db';
import { genericErrorToast } from '../../lib/generic-error-toast';
import { checkIsOnline } from '../../lib/online/check-is-online';

export const LogoutButton = ({ className }: { className?: string }) => {
    const navigate = useNavigate();
    const handleLogout = async () => {
        const navigateToLogin = () =>
            navigate({ to: '/login', search: { redirect: '/' } });
        const isOnline = await checkIsOnline();

        try {
            if (!isOnline) {
                await db.authSession.clear().finally(() => navigateToLogin());
                await db.authMeta.put({
                    key: 'pendingSignOut',
                    at: Date.now(),
                });
                await flushPendingSignOut();
                return;
            }

            await authClient.signOut({
                fetchOptions: {
                    onSuccess: () => navigateToLogin(),
                },
            });
        } catch (error) {
            genericErrorToast();
            console.error('Logout failed', error);
        } finally {
            await db.authSession.clear();
        }
    };

    return (
        <Button
            variant="destructive"
            onClick={handleLogout}
            className={className}
        >
            <SignOutIcon /> Logout
        </Button>
    );
};
