import { createFileRoute } from '@tanstack/react-router';

import { EmptyTrips } from '../components/trips/empty-trips';
import { useSession } from '../lib/auth/use-session';

export const Route = createFileRoute('/_auth/')({
    component: RouteComponent,
});

function RouteComponent() {
    const { data: session } = useSession();
    const user = session?.user;

    return (
        <div className="flex flex-col gap-4 h-full">
            <header>
                <span className="text-sm text-muted-foreground">
                    Welcome {user?.name}
                </span>
                <h1>Your trips</h1>
            </header>

            <EmptyTrips />
        </div>
    );
}
