import { ArrowSquareOutIcon, UserIcon } from '@phosphor-icons/react';
import { createFileRoute } from '@tanstack/react-router';

import { authClient } from '@repo/core/auth/client';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@repo/ui/components/ui/avatar';
import { Item, ItemContent, ItemTitle } from '@repo/ui/components/ui/item';

import { LogoutButton } from '../components/auth/logout-button';
import { ThemePicker } from '../components/theme-picker/theme-picker';

export const Route = createFileRoute('/_auth/profile')({
    component: RouteComponent,
});

function RouteComponent() {
    const { data } = authClient.useSession();
    const user = data?.user;

    return (
        <div className="flex flex-col gap-6">
            <h1>Profile</h1>

            <section className="flex items-center gap-4">
                <Avatar size="xl">
                    {user?.image ? <AvatarImage src={user.image} /> : null}
                    <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col">
                    <p className="text-lg font-display font-bold">
                        {user?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {user?.email}
                    </p>
                </div>
            </section>

            <Section heading="Traveling with">
                <></>
            </Section>

            <Section heading="Settings">
                <ThemePicker />
            </Section>

            <Section heading="Account">
                <Item
                    variant="muted"
                    render={
                        <a
                            href="https://myaccount.google.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <ItemContent>
                                <ItemTitle className="w-full justify-between">
                                    <span className="flex items-center gap-2">
                                        <UserIcon className="text-primary" />{' '}
                                        Google Account
                                    </span>
                                    <ArrowSquareOutIcon />
                                </ItemTitle>
                            </ItemContent>
                        </a>
                    }
                />
            </Section>

            <LogoutButton />
        </div>
    );
}

const Section = ({
    heading,
    children,
}: {
    heading?: string;
    children: React.ReactNode;
}) => (
    <section className="flex flex-col gap-3">
        {heading ? (
            <h2 className="font-sans text-muted-foreground text-sm font-medium">
                {heading}
            </h2>
        ) : null}
        {children}
    </section>
);
