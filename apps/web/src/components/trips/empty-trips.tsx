import { MapTrifoldIcon, PlusIcon } from '@phosphor-icons/react';

import { Button } from '@repo/ui/components/ui/button';

export const EmptyTrips = () => {
    return (
        <section className="flex flex-col flex-1 items-center justify-center text-center gap-4 p-4 pb-16">
            <div className="grid place-items-center size-28 rounded-2xl bg-secondary text-secondary-foreground">
                <MapTrifoldIcon
                    weight="duotone"
                    aria-hidden="true"
                    className="size-12"
                />
            </div>

            <h2>No trips yet</h2>

            <p className="text-muted-foreground text-sm text-balance">
                Start a trip and every place you visit will show up here, day by
                day.
            </p>

            <Button size="lg">
                <PlusIcon /> Create your first trip
            </Button>
        </section>
    );
};
