import { PlusIcon } from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';

import { buttonVariants } from '@repo/ui/components/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@repo/ui/components/ui/sidebar';
import { cn } from '@repo/ui/lib/utils';

import { MotionLink } from '../MotionLink/MotionLink';
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
                <MotionLink
                    to={'/trip/new'}
                    className={cn(
                        buttonVariants({ size: 'lg' }),
                        'bg-accent text-foreground hover:bg-accent/80'
                    )}
                >
                    <PlusIcon weight="bold" className="size-5" />
                    New trip
                </MotionLink>
            </SidebarFooter>
        </Sidebar>
    );
}
