import {
    AirplaneTakeoffIcon,
    type Icon,
    MagnifyingGlassIcon,
    MapTrifoldIcon,
    UserIcon,
} from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';

import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from '@repo/ui/components/ui/navigation-menu';

import { NetworkBanner } from '../network-banner/network-banner';
import { CreateTripDrawer } from '../trips/create-trip-drawer';

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
    <div className="fixed md:hidden bottom-0 inset-x-0 border-t z-20 shadow-[0px_-10px_20px_0px] shadow-background">
        <NavigationMenu className="bg-muted max-w-[unset]">
            <NavigationMenuList>
                <NavbarLinkItems navItems={navItemsLeft} />

                <NavigationMenuItem className="flex flex-1 items-center justify-center">
                    <CreateTripDrawer />
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
