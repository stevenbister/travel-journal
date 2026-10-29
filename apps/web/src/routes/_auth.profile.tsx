import { ArrowSquareOutIcon, UserIcon } from '@phosphor-icons/react';
import { createFileRoute } from '@tanstack/react-router';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from '@repo/ui/components/ui/avatar';
import { buttonVariants } from '@repo/ui/components/ui/button';
import { cn } from '@repo/ui/lib/utils';

import { LogoutButton } from '../components/auth/logout-button';
import { MotionAnchor } from '../components/motion-link/motion-link';
import { ProfileStats } from '../components/profile/profile-stats';
import { Section } from '../components/section/section';
import { ThemePicker } from '../components/theme-picker/theme-picker';
import { useSession } from '../lib/auth/use-session';

export const Route = createFileRoute('/_auth/profile')({
    component: RouteComponent,
});

function RouteComponent() {
    const { data } = useSession();
    const user = data?.user;

    return (
        <div className="container grid gap-6 lg:my-0 lg:mx-auto lg:grid-cols-[340px_minmax(0,600px)]">
            <h1>Profile</h1>

            <section className="flex flex-col gap-6 col-span-full lg:col-start-1 lg:col-end-2 lg:bg-card lg:rounded-xl lg:p-6 lg:text-card-foreground lg:shadow-xs lg:ring-1 lg:ring-foreground/10">
                <div className="flex items-center gap-4 lg:flex-col">
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
                </div>

                <ProfileStats />
            </section>

            <div className="flex flex-col gap-6 col-span-full lg:col-start-2 lg:col-end-3">
                <Section heading="Settings">
                    <ThemePicker />
                </Section>

                <Section heading="Account">
                    <MotionAnchor
                        href="https://myaccount.google.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            buttonVariants({
                                size: 'lg',
                                variant: 'outline',
                            })
                        )}
                    >
                        <UserIcon className="text-primary" /> Google Account
                        <ArrowSquareOutIcon className="ms-auto" />
                    </MotionAnchor>
                </Section>
                <LogoutButton className="col-span-full" />
            </div>
        </div>
    );
}
