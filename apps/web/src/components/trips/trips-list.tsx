import type { TripType, TripWithDetails } from '../../lib/dexie/types';
import { Empty } from '../empty/empty';
import { Section } from '../section/section';
import { CreateTripDrawer } from './create-trip-drawer';
import { useGetTrips } from './hooks/use-get-trips';
import { HeroTripCard } from './trip-cards/hero-trip-card';
import { TripCard } from './trip-cards/trip-card';

const mapKeyToHeading: Record<string, string> = {
    current: 'Currently traveling',
    upcoming: 'Upcoming',
    past: 'Past trips',
};

type TripsListProps = {
    initialTrips?: TripWithDetails[];
};

export const TripsList = ({ initialTrips }: TripsListProps) => {
    const { trips, isPending } = useGetTrips(initialTrips);

    if (isPending) return <div>Loading trips...</div>;

    if (!trips || Object.values(trips).flat().length === 0) {
        return (
            <Empty
                className="pb-16"
                heading="No trips yet"
                description="Start a trip and every place you visit will show up here, day by day."
                CTA={<CreateTripDrawer />}
            />
        );
    }

    const groups = Object.entries(trips);
    const firstTripId = groups.flatMap(([, value]) => value)[0]?.id;

    return (
        <>
            {groups.map(([key, value]) => {
                if (key === 'upcoming' && (!value || value.length === 0)) {
                    return (
                        <Section heading={mapKeyToHeading[key]} key={key}>
                            <Empty
                                size="sm"
                                heading="No upcoming trips"
                                description="No trips planned? Start by creating your first trip."
                            />
                        </Section>
                    );
                }

                if (!value || value.length === 0) return null;

                return (
                    <Section heading={mapKeyToHeading[key]} key={key}>
                        {value.map((trip) => {
                            if (trip.id === firstTripId) {
                                return (
                                    <HeroTripCard
                                        key={trip.id}
                                        trip={trip}
                                        tripType={key as TripType}
                                    />
                                );
                            }

                            return (
                                <TripCard
                                    key={trip.id}
                                    trip={trip}
                                    tripType={key as TripType}
                                />
                            );
                        })}
                    </Section>
                );
            })}
        </>
    );
};
