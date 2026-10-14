import { MapPinIcon } from '@phosphor-icons/react';
import { createFileRoute, notFound } from '@tanstack/react-router';

import { BackButton } from '../components/back-button/back-button';
import { ByLine } from '../components/by-line/by-line';
import { EntryHeader } from '../components/entries/entry-header';
import {
    getEntryWithAuthor,
    useGetEntry,
} from '../components/entries/hooks/use-get-entry';
import { IconBox } from '../components/icon-box/icon-box';
import {
    getTripWithDetails,
    useGetTrip,
} from '../components/trips/hooks/use-get-trip';

export const Route = createFileRoute('/_auth/trip/$tripId_/entry/$entryId')({
    loader: async ({ params }) => {
        const { tripId, entryId } = params;

        const entry = await getEntryWithAuthor(entryId);

        if (!entry) throw notFound();

        const trip = await getTripWithDetails(tripId);

        return {
            entry,
            trip,
        };
    },
    component: RouteComponent,
});

function RouteComponent() {
    const { tripId, entryId } = Route.useParams();
    const { entry: initialEntry, trip: initialTrip } = Route.useLoaderData();
    const { trip } = useGetTrip(tripId, initialTrip);
    const { entry, isPending } = useGetEntry(entryId, initialEntry);

    if (isPending) return <p>Loading...</p>;

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="container">
                <BackButton />
            </div>

            {entry && trip ? <EntryHeader entry={entry} trip={trip} /> : null}

            <div className="container-x flex flex-col gap-4">
                <p>{entry?.notes}</p>

                <aside className="bg-secondary rounded-xl p-4 grid grid-cols-[auto_1fr] gap-4 items-center">
                    <IconBox Icon={MapPinIcon} size="sm" variant="accent" />

                    <div>
                        <p className="font-bold">{entry?.location?.name}</p>
                        <p className="text-muted-foreground text-sm">
                            {entry?.location?.displayName}
                        </p>
                    </div>
                </aside>
            </div>

            <ByLine
                author={entry?.author?.name ?? ''}
                createdAt={entry?.createdAt ?? ''}
                updatedAt={entry?.updatedAt ?? ''}
            />
        </div>
    );
}
