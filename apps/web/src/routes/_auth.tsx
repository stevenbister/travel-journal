import {
    Outlet,
    createFileRoute,
    redirect,
    useLocation,
} from '@tanstack/react-router';
import { useSpinDelay } from 'spin-delay';

import { Badge } from '@repo/ui/components/ui/badge';
import { SidebarInset, SidebarProvider } from '@repo/ui/components/ui/sidebar';
import { Spinner } from '@repo/ui/components/ui/spinner';
import { toast } from '@repo/ui/components/ui/toast';

import { AppSidebar } from '../components/app-sidebar/app-sidebar';
import { Navbar } from '../components/navbar/navbar';
import { getSession } from '../lib/auth/session';
import { useRefreshSessionCache } from '../lib/auth/use-refresh-session-cache';
import { useSync } from '../lib/sync/use-sync';

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
    const location = useLocation();
    useRefreshSessionCache();
    const { isFetching, error } = useSync();
    const showSpinner = useSpinDelay(isFetching, {
        delay: 0,
        minDuration: 300,
    });

    if (error) {
        console.error('Sync error:', error);
        toast.add({
            title: 'Sync Error',
            description: error.message,
            type: 'error',
        });
    }

    return (
        <div className="p-6 md:p-10">
            <SidebarProvider>
                <AppSidebar />

                <SidebarInset>
                    {showSpinner ? (
                        <Badge
                            variant="outline"
                            className="absolute top-0 right-0"
                        >
                            <Spinner data-icon="inline-start" />
                            Syncing
                        </Badge>
                    ) : null}

                    <Outlet />
                </SidebarInset>
            </SidebarProvider>

            {location.pathname !== '/trip/new' ? <Navbar /> : null}
        </div>
    );
}
