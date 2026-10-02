import { ArrowSquareOutIcon, UserIcon } from '@phosphor-icons/react';
import { createFileRoute } from '@tanstack/react-router';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@repo/ui/components/ui/avatar';
import { Card, CardContent } from '@repo/ui/components/ui/card';

import { LogoutButton } from '../components/auth/logout-button';
import { ThemePicker } from '../components/theme-picker/theme-picker';
import { useSession } from '../lib/auth/use-session';

export const Route = createFileRoute('/_auth/profile')({
    component: RouteComponent,
});

function RouteComponent() {
    const { data } = useSession();
    const user = data?.user;

    return (
        <div className="grid gap-6 lg:my-0 lg:mx-auto lg:grid-cols-[340px_minmax(0,600px)]">
            <h1>Profile</h1>

            <section className="flex items-center gap-4 col-span-full lg:col-start-1 lg:col-end-2  lg:flex-col lg:bg-card lg:rounded-xl lg:p-6 lg:text-card-foreground lg:shadow-xs lg:ring-1 lg:ring-foreground/10">
                <Avatar size="xl" className="lg:data-[size=xl]:size-20">
                    {user?.image ? <AvatarImage src={user.image} /> : null}
                    <AvatarFallback>{user?.name?.[0]}</AvatarFallback>
                </Avatar>

                <div className="flex flex-col lg:text-center">
                    <p className="text-lg font-display font-bold">
                        {user?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {user?.email}
                    </p>
                </div>
            </section>

            <div className="flex flex-col gap-6 col-span-full lg:col-start-2 lg:col-end-3">
                <Section heading="Traveling with">
                    <></>
                </Section>
                <Section heading="Settings">
                    <ThemePicker />
                </Section>
                <Section heading="Account">
                    <Card size="sm">
                        <CardContent>
                            <a
                                href="https://myaccount.google.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full flex justify-between"
                            >
                                <span className="flex items-center gap-2">
                                    <UserIcon className="text-primary" /> Google
                                    Account
                                </span>
                                <ArrowSquareOutIcon />
                            </a>
                        </CardContent>
                    </Card>
                </Section>
                <LogoutButton className="col-span-full" />
            </div>
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
            <h2 className="font-sans text-muted-foreground text-sm font-medium ">
                {heading}
            </h2>
        ) : null}
        {children}
    </section>
);
