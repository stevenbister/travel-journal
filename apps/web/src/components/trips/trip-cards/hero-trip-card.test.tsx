import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { tripsFixture } from '../../../__fixtures__/trips';
import { renderWithRouter } from '../../../__test__/helpers';
import type { TripType, TripWithDetails } from '../../../lib/dexie/types';
import { HeroTripCard, type HeroTripCardProps } from './hero-trip-card';

const defaultProps: HeroTripCardProps = {
    trip: tripsFixture.current[0]!,
    tripType: 'current',
};

const renderComponent = (props?: Partial<HeroTripCardProps>) => {
    const date = new Date('2026-10-09T12:48:11.325Z');
    vi.setSystemTime(date);

    return renderWithRouter(<HeroTripCard {...defaultProps} {...props} />);
};

describe('HeroTripCard', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it.each<{
        trip: TripWithDetails;
        tripType: TripType;
        description: string;
        badge: string;
    }>([
        {
            trip: tripsFixture.current[0]!,
            tripType: 'current',
            description: 'Currently traveling • 5 entries',
            badge: 'Day 1 of 14',
        },
        {
            trip: tripsFixture.upcoming[0]!,
            tripType: 'upcoming',
            description: 'Starts in 2 months',
            badge: '22  days to go!',
        },
    ])(
        'renders the $tripType trip card',
        async ({ trip, tripType, description, badge }) => {
            const page = await renderComponent({ trip, tripType });

            await expect
                .element(page.getByText(trip.title))
                .toBeInTheDocument();

            await expect
                .element(page.getByText(description))
                .toBeInTheDocument();

            await expect.element(page.getByText(badge)).toBeInTheDocument();
        }
    );
});
