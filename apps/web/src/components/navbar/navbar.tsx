import {
    AirplaneTakeoffIcon,
    type Icon,
    MagnifyingGlassIcon,
    MapTrifoldIcon,
    PlusIcon,
    UserIcon,
} from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';

import { Button } from '@repo/ui/components/ui/button';
import {
    NavigationMenu,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
} from '@repo/ui/components/ui/navigation-menu';

type NavItems = {
    label: string;
    Icon: Icon;
    to: string;
};

const NAV_ITEMS: NavItems[] = [
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
    <NavigationMenu className="fixed md:hidden bottom-0 inset-x-0 bg-muted max-w-[unset] border-t">
        <NavigationMenuList>
            <NavbarLinkItems navItems={navItemsLeft} />

            <NavigationMenuItem className="flex flex-1 items-center justify-center">
                <Button
                    size="icon-lg"
                    className="bg-accent text-foreground hover:bg-accent/80 rounded-full size-13 drop-shadow-sm drop-shadow-accent/50 -translate-y-5"
                >
                    <PlusIcon weight="bold" className="size-5" />
                    <span className="sr-only">Add</span>
                </Button>
            </NavigationMenuItem>

            <NavbarLinkItems navItems={navItemsRight} />
        </NavigationMenuList>
    </NavigationMenu>
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
