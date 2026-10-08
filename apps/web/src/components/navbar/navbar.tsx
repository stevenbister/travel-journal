import {
    AirplaneTakeoffIcon,
    type Icon,
    MagnifyingGlassIcon,
    MapTrifoldIcon,
    PlusIcon,
    UserIcon,
} from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';

import { buttonVariants } from '@repo/ui/components/ui/button';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from '@repo/ui/components/ui/navigation-menu';
import { cn } from '@repo/ui/lib/utils';

import { MotionLink } from '../MotionLink/MotionLink';
import { NetworkBanner } from '../network-banner/network-banner';

type NavItems = {
    label: string;
    Icon: Icon;
    to: string;
};

export const NAV_ITEMS: NavItems[] = [
    { label: 'Trips', Icon: AirplaneTakeoffIcon, to: '/' },
    {
        label: 'Search',
        Icon: MagnifyingGlassIcon,
        to: '/search',
    },
    {
        label: 'Map',
        Icon: MapTrifoldIcon,
        to: '/map',
    },
    {
        label: 'Profile',
        Icon: UserIcon,
        to: '/profile',
    },
];

const navItemsLeft = NAV_ITEMS.slice(0, 2);
const navItemsRight = NAV_ITEMS.slice(2);

export const Navbar = () => (
    <div className="fixed md:hidden bottom-0 inset-x-0 border-t">
        <NavigationMenu className="bg-muted max-w-[unset]">
            <NavigationMenuList>
                <NavbarLinkItems navItems={navItemsLeft} />

                <NavigationMenuItem className="flex flex-1 items-center justify-center">
                    <MotionLink
                        to={'/trip/new'}
                        className={cn(
                            buttonVariants({ size: 'icon-lg' }),
                            'bg-accent text-foreground hover:bg-accent/80 rounded-full size-13 drop-shadow-sm drop-shadow-accent/50 -translate-y-5'
                        )}
                    >
                        <PlusIcon weight="bold" className="size-5" />
                        <span className="sr-only">Add</span>
                    </MotionLink>
                </NavigationMenuItem>

                <NavbarLinkItems navItems={navItemsRight} />
            </NavigationMenuList>
        </NavigationMenu>
        <NetworkBanner />
    </div>
);

const NavbarLinkItems = ({ navItems }: { navItems: NavItems[] }) => (
    <>
        {navItems.map(({ label, Icon, to }) => (
            <NavigationMenuItem key={to} className="flex-1">
                <NavigationMenuLink
                    render={<Link to={to} />}
                    className="flex-col gap-1 text-xs"
                >
                    <Icon className="size-6" />
                    {label}
                </NavigationMenuLink>
            </NavigationMenuItem>
        ))}
    </>
);
