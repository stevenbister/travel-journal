import { createFileRoute, redirect } from '@tanstack/react-router';

import { LoginForm } from '../components/auth/login-form';
import { getSession } from '../lib/auth/session';

export const Route = createFileRoute('/login')({
    validateSearch: (search) => ({
        redirect: (search.redirect as string) || '/',
    }),
    beforeLoad: async ({ search }) => {
        const session = await getSession();
        if (session) {
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
