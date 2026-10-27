import { Link } from '@tanstack/react-router';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@repo/ui/components/ui/sidebar';

import { NAV_ITEMS } from '../navbar/navbar';
import { CreateTripDrawer } from '../trips/create-trip-drawer';

export function AppSidebar() {
    return (
        <Sidebar className="hidden md:fixed bg-card p-6">
            <SidebarHeader className="font-display font-bold text-2xl pb-4">
                Travel Journal
            </SidebarHeader>
            <SidebarContent>
                {NAV_ITEMS.map(({ label, Icon, to }) => (
                    <SidebarMenuItem key={to}>
                        <SidebarMenuButton
                            render={<Link to={to} />}
                            className="text-base text-muted-foreground hover:text-primary hover:bg-primary/10 data-[status=active]:text-primary data-[status=active]:bg-primary/10 data-[status=active]:font-bold"
                        >
                            <Icon className="size-8" />
                            {label}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarContent>
            <SidebarFooter>
                <CreateTripDrawer />
            </SidebarFooter>
        </Sidebar>
    );
}
