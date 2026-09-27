import { createFileRoute, redirect } from '@tanstack/react-router';

import { authClient } from '@repo/core/auth/client';

import { LogoutButton } from '../components/auth/logout-button';

export const Route = createFileRoute('/_auth')({
    beforeLoad: async ({ location }) => {
        const auth = await authClient.getSession();

        if (!auth?.data?.session) {
            throw redirect({
                to: '/login',
                search: {
                    redirect: location.href,
                },
            });
        }
    },
    component: AuthLayout,
});

function AuthLayout() {
    return (
        <div>
            Hello "/_auth"! <LogoutButton />
        </div>
    );
}
