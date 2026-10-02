import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { SidebarInset, SidebarProvider } from '@repo/ui/components/ui/sidebar';

import { AppSidebar } from '../components/app-sidebar/app-sidebar';
import { Navbar } from '../components/navbar/navbar';
import { getSession } from '../lib/auth/session';
import { useRefreshSessionCache } from '../lib/auth/use-refresh-session-cache';

export const Route = createFileRoute('/_auth')({
    beforeLoad: async ({ location }) => {
        const session = await getSession();

        if (!session) {
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
    useRefreshSessionCache();

    return (
        <div className="p-8 md:p-10">
            <SidebarProvider>
                <AppSidebar />

                <SidebarInset>
                    <Outlet />
                </SidebarInset>
            </SidebarProvider>

            <Navbar />
        </div>
    );
}
