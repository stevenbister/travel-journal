import type { TripType } from '../../lib/dexie/types';
import { Section } from '../section/section';
import { EmptyTrips } from './empty-trips';
import { useGetTrips } from './hooks/use-get-trips';
import { HeroTripCard } from './trip-cards/hero-trip-card';
import { TripCard } from './trip-cards/trip-card';

const mapKeyToHeading: Record<string, string> = {
    current: 'Currently traveling',
    upcoming: 'Upcoming',
    past: 'Past trips',
};

export const TripsList = () => {
    const { trips, isPending } = useGetTrips();

    if (isPending) return <div>Loading trips...</div>;

    if (!trips || Object.values(trips).flat().length === 0) {
        return <EmptyTrips className="pb-16" />;
    }

    const groups = Object.entries(trips);
    const firstTripId = groups.flatMap(([, value]) => value)[0]?.id;

    return (
        <>
            {groups.map(([key, value]) => {
                if (key === 'upcoming' && (!value || value.length === 0)) {
                    return (
                        <Section heading={mapKeyToHeading[key]} key={key}>
                            <EmptyTrips
                                size="sm"
                                heading="No upcoming trips"
                                description="No trips planned? Start by creating your first trip."
                                showButton={false}
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
