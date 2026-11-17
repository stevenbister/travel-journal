import { createFileRoute } from '@tanstack/react-router';
import { compareDesc, parseISO } from 'date-fns';

import { BackButton } from '../components/back-button/back-button';
import { EntryMap } from '../components/entries/entry-map';
import { db } from '../lib/dexie/db';
import { getUniqueObjectsFromArray } from '../lib/utils/get-unique-objects';

export const Route = createFileRoute('/_auth/map/{-$tripId}')({
    loader: async ({ params: { tripId } }) => {
        if (tripId) {
            const entries = (
                await db.entries.where({ tripId }).toArray()
            ).filter((e) => !e.isDeleted);

            return { entries };
        }

        const entries = (await db.entries.toArray())
            .filter((e) => !e.isDeleted && e.location?.countryCode !== 'gb')
            .sort((a, b) =>
                compareDesc(parseISO(a.entryDate), parseISO(b.entryDate))
            );

        return {
            entries: getUniqueObjectsFromArray(entries, 'tripId'),
        };
    },
    component: MapRouteComponent,
});

function MapRouteComponent() {
    const { entries } = Route.useLoaderData();
    const { tripId } = Route.useParams();

    return (
        <div className="relative h-full w-full">
            {tripId ? (
                <BackButton className="absolute top-4 left-4 z-20" to="/map" />
            ) : null}

            <EntryMap entries={entries} />
        </div>
    );
}
