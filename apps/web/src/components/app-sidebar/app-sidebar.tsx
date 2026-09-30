import { PlusIcon } from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';

import { Button } from '@repo/ui/components/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@repo/ui/components/ui/sidebar';

import { NAV_ITEMS } from '../navbar/navbar';

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
                <Button className="bg-accent text-foreground hover:bg-accent/80">
                    <PlusIcon weight="bold" className="size-5" />
                    New trip
                </Button>
            </SidebarFooter>
        </Sidebar>
    );
}
