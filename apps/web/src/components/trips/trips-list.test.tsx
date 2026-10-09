import { afterEach, describe, expect, it, vi } from 'vitest';

import { tripsFixture } from '../../__fixtures__/trips';
import { renderWithRouter } from '../../__test__/helpers';
import { useGetTrips } from './hooks/use-get-trips';
import { TripsList } from './trips-list';

vi.mock('./hooks/use-get-trips', () => ({
    useGetTrips: vi.fn(),
}));

type Options = {
    trips?: typeof tripsFixture;
    isPending?: boolean;
};

const renderComponent = (options?: Options) => {
    vi.mocked(useGetTrips).mockReturnValue({
        trips: options?.trips ?? tripsFixture,
        isPending: options?.isPending ?? false,
    });

    return renderWithRouter(<TripsList />);
};

describe('TripsList', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('renders a list of trips', async () => {
        const page = await renderComponent();

        await expect
            .element(
                page.getByRole('heading', {
                    name: 'Currently traveling',
                })
            )
            .toBeInTheDocument();

        await expect
            .element(page.getByText(tripsFixture.current[0]!.title))
            .toBeInTheDocument();

        await expect
            .element(
                page.getByRole('heading', {
                    name: 'Upcoming',
                })
            )
            .toBeInTheDocument();

        await expect
            .element(page.getByText(tripsFixture.upcoming[0]!.title))
            .toBeInTheDocument();

        await expect
            .element(
                page.getByRole('heading', {
                    name: 'Past trips',
                })
            )
            .toBeInTheDocument();

        await expect
            .element(page.getByText(tripsFixture.past[0]!.title))
            .toBeInTheDocument();
    });

    it('renders the loading state when trips are pending', async () => {
        const page = await renderComponent({ isPending: true });

        await expect
            .element(page.getByText('Loading trips...'))
            .toBeInTheDocument();
    });

    it('renders the empty state when there are no trips', async () => {
        const page = await renderComponent({
            trips: { current: [], upcoming: [], past: [] },
        });

        await expect
            .element(page.getByRole('heading', { name: 'No trips yet' }))
            .toBeInTheDocument();

        await expect
            .element(
                page.getByText(
                    'Start a trip and every place you visit will show up here, day by day.'
                )
            )
            .toBeInTheDocument();

        await expect
            .element(page.getByRole('link', { name: 'Create your first trip' }))
            .toBeInTheDocument();
    });

    it('renders the empty upcoming trips state when there are no upcoming trips', async () => {
        const page = await renderComponent({
            trips: {
                ...tripsFixture,
                upcoming: [],
            },
        });

        await expect
            .element(
                page.getByRole('heading', { name: 'Upcoming', exact: true })
            )
            .toBeInTheDocument();

        await expect
            .element(page.getByRole('heading', { name: 'No upcoming trips' }))
            .toBeInTheDocument();
    });

    it('renders the first trip card as the hero', async () => {
        const page = await renderComponent();

        await expect
            .element(page.getByAttribute('data-slot', 'card').first())
            .toHaveAttribute('data-hero-card');
    });
});
