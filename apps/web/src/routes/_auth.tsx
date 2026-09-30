import { Outlet, createFileRoute, redirect } from '@tanstack/react-router';

import { authClient } from '@repo/core/auth/client';

import { SidebarInset, SidebarProvider } from '@repo/ui/components/ui/sidebar';

import { AppSidebar } from '../components/app-sidebar/app-sidebar';
import { Navbar } from '../components/navbar/navbar';

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
