import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { tripsFixture } from '../../../__fixtures__/trips';
import { renderWithRouter } from '../../../__test__/helpers';
import type { TripType, TripWithDetails } from '../../../lib/dexie/types';
import { TripCard, type TripCardProps } from './trip-card';

const defaultProps: TripCardProps = {
    trip: tripsFixture.upcoming[0]!,
    tripType: 'upcoming',
};

const renderComponent = (props?: Partial<TripCardProps>) => {
    const date = new Date('2026-10-09T12:48:11.325Z');
    vi.setSystemTime(date);

    return renderWithRouter(<TripCard {...defaultProps} {...props} />);
};

describe('TripCard', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });
    afterEach(() => {
        vi.useRealTimers();
    });

    it.each<{ trip: TripWithDetails; tripType: TripType; description: string }>(
        [
            {
                trip: tripsFixture.upcoming[0]!,
                tripType: 'upcoming',
                description: 'Starts in 2 months',
            },
            {
                trip: tripsFixture.past[0]!,
                tripType: 'past',
                description: '8 months ago • 4 entries',
            },
        ]
    )(
        'renders the $tripType trip card',
        async ({ trip, tripType, description }) => {
            const page = await renderComponent({ trip, tripType });

            await expect
                .element(page.getByText(trip.title))
                .toBeInTheDocument();

            await expect
                .element(page.getByText(description))
                .toBeInTheDocument();
        }
    );
});
