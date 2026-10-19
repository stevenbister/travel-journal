import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import type { Trip } from '../../lib/dexie/types';
import { useGetTrip } from '../trips/hooks/use-get-trip';
import { EntryStatsGrid } from './entry-stats-grid';
import { useGetEntries } from './hooks/use-get-entries';

vi.mock('../trips/hooks/use-get-trip');
vi.mock('./hooks/use-get-entries');

const trip = {
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-05'),
};

const entry = (lat?: number, lng?: number) => ({ location: { lat, lng } });

type Options = {
    tripData?: Trip;
    isTripPending?: boolean;
    entries?: ReturnType<typeof entry>[];
    isEntriesPending?: boolean;
};

const renderComponent = (options?: Options) => {
    const {
        tripData = trip,
        isTripPending = false,
        entries = [entry(1, 1), entry(2, 2), entry(3, 3)],
        isEntriesPending = false,
    } = options || {};

    vi.mocked(useGetTrip).mockReturnValue({
        trip: tripData,
        isPending: isTripPending,
    } as never);
    vi.mocked(useGetEntries).mockReturnValue({
        entries,
        isPending: isEntriesPending,
    } as never);

    return render(<EntryStatsGrid tripId="test-trip-id" />);
};

describe('EntryStatsGrid', () => {
    afterEach(() => {
        vi.resetAllMocks();
    });

    it.each([
        ['trip', { isTripPending: true }],
        ['entries', { isEntriesPending: true }],
    ])('shows a skeleton while %s are pending', async (_, pending) => {
        const page = await renderComponent({
            ...pending,
        });

        await expect.element(page.getByText('places')).not.toBeInTheDocument();
        await expect.element(page.getByText('Entries')).not.toBeInTheDocument();
    });

    it('renders entries, places and days', async () => {
        const page = await renderComponent();

        await expect.element(page.getByText('Entries')).toBeVisible();
        await expect
            .element(page.getByText('3', { exact: true }))
            .toBeVisible();
        await expect.element(page.getByText('places')).toBeVisible();
        await expect.element(page.getByText('Days')).toBeVisible();
        await expect
            .element(page.getByText('4', { exact: true }))
            .toBeVisible();
    });

    it('counts unique places, ignoring duplicates and entries without coordinates', async () => {
        const page = await renderComponent({
            entries: [entry(1, 1), entry(1, 1), entry(2, 2), entry(), entry(5)],
        });

        // 5 entries, 2 unique places, 4 days
        await expect
            .element(page.getByText('5', { exact: true }))
            .toBeVisible();
        await expect
            .element(page.getByText('2', { exact: true }))
            .toBeVisible();
    });
});
