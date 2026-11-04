import { useLiveQuery } from 'dexie-react-hooks';

import { useSession } from '../../lib/auth/use-session';
import { db } from '../../lib/dexie/db';
import { StatsGrid, StatsGridItem } from '../stats-grid/stats-grid';

export const ProfileStats = () => {
    const { data: session } = useSession();
    const userId = session?.user?.id ?? '';

    const tripCount = useLiveQuery(() => db.trips.count());
    const entryCount = useLiveQuery(
        () => db.entries.where('authorId').equals(userId).count(),
        [userId]
    );
    const countryCount = useLiveQuery(async () => {
        const entries = await db.entries.toArray();
        const countries = new Set(
            entries.reduce<string[]>((acc, curr) => {
                const country = curr.location?.country;
                if (country) acc.push(country);
                return acc;
            }, [])
        );
        return countries.size;
    }, [userId]);

    return (
        <StatsGrid className="bg-transparent">
            <StatsGridItem value={tripCount ?? 0} label="Trips" />
            <StatsGridItem value={entryCount ?? 0} label="Entries added" />
            <StatsGridItem value={countryCount ?? 0} label="Countries" />
        </StatsGrid>
    );
};
