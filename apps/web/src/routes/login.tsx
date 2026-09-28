import { createFileRoute, redirect } from '@tanstack/react-router';

import { authClient } from '@repo/core/auth/client';

import { LoginForm } from '../components/auth/login-form';

export const Route = createFileRoute('/login')({
    validateSearch: (search) => ({
        redirect: (search.redirect as string) || '/',
    }),
    beforeLoad: async ({ search }) => {
        const auth = await authClient.getSession();
        if (auth?.data?.session) {
            throw redirect({ to: search.redirect });
        }
    },
    component: RouteComponent,
});

function RouteComponent() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background">
            <LoginForm />
        </div>
    );
}
