import { intervalToDuration } from 'date-fns';

import { Skeleton } from '@repo/ui/components/ui/skeleton';

import { StatsGrid, StatsGridItem } from '../stats-grid/stats-grid';
import { useGetTrip } from '../trips/hooks/use-get-trip';
import { useGetEntries } from './hooks/use-get-entries';

type EntryStatsGridProps = {
    tripId: string;
};

export const EntryStatsGrid = ({ tripId }: EntryStatsGridProps) => {
    const { trip, isPending: isTripPending } = useGetTrip(tripId!);
    const { entries, isPending: isEntiesPending } = useGetEntries(tripId);

    const isPending = isTripPending || isEntiesPending;

    if (isPending) {
        return (
            <StatsGrid>
                <Skeleton className="h-20 rounded-none" />
            </StatsGrid>
        );
    }

    const lengthOfTrip =
        trip &&
        intervalToDuration({
            start: trip.startDate,
            end: trip.endDate,
        });

    const entryLatLng = entries?.reduce<string[]>((acc, entry) => {
        if (!entry.location) return acc;

        if (entry.location.lat && entry.location.lng) {
            acc.push(`${entry.location.lat},${entry.location.lng}`);
        }

        return acc;
    }, []);
    const uniquePlaces = Array.from(new Set(entryLatLng));

    return (
        <StatsGrid>
            {entries && entries.length > 1 ? (
                <StatsGridItem value={entries.length} label="Entries" />
            ) : null}

            {uniquePlaces.length > 0 ? (
                <StatsGridItem value={uniquePlaces.length} label="places" />
            ) : null}

            {lengthOfTrip ? (
                <StatsGridItem value={lengthOfTrip.days ?? 0} label="Days" />
            ) : null}
        </StatsGrid>
    );
};
