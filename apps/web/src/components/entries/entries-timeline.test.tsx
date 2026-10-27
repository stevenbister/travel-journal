import { format, parseISO } from 'date-fns';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { makeEntry } from '../../__fixtures__/entries';
import { renderWithRouter } from '../../__test__/helpers';
import type { Entry, Place } from '../../lib/dexie/types';
import { useGetTrip } from '../trips/hooks/use-get-trip';
import { EntriesTimeline } from './entries-timeline';
import { useGetEntries } from './hooks/use-get-entries';
import { getEntryDayNumber } from './utils/get-entry-day-number';

const SAGRES_LOCATION: Place = {
    osmType: null,
    osmId: null,
    displayName: 'Sagres, Algarve, Portugal',
    name: 'Sagres',
    lat: 37.0086,
    lng: -8.9411,
    category: null,
    type: null,
    locality: 'Sagres',
    country: 'Portugal',
    countryCode: 'pt',
    boundingBox: null,
};

vi.mock('./hooks/use-get-entries', () => ({
    useGetEntries: vi.fn(),
}));

vi.mock('../trips/hooks/use-get-trip', () => ({
    useGetTrip: vi.fn(),
}));

const TRIP_START = '2026-10-07T23:00:00.000Z';

const renderComponent = (entries: Entry[] | undefined) => {
    vi.mocked(useGetEntries).mockReturnValue({ entries, isPending: false });
    vi.mocked(useGetTrip).mockReturnValue({
        trip: { startDate: TRIP_START } as never,
        isPending: false,
    });
    return renderWithRouter(<EntriesTimeline tripId="trip-1" />);
};

// Trip-relative day number via the shared util, so the test is not brittle
// across timezones (trip start is near midnight UTC).
const dayFor = (entryDate: string) => getEntryDayNumber(entryDate, TRIP_START);

describe('EntriesTimeline', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('groups entries by day, oldest first with trip-relative day numbers', async () => {
        const oldDate = '2026-10-08T09:00:00.000Z';
        const newDate = '2026-10-10T09:00:00.000Z';
        const page = await renderComponent([
            makeEntry('old', 'trip-1', { entryDate: oldDate }),
            makeEntry('new', 'trip-1', { entryDate: newDate }),
        ]);

        const headings = page.getByRole('heading', { level: 3 });
        await expect
            .element(headings.first())
            .toHaveTextContent(`Day ${dayFor(oldDate)}`);
        await expect
            .element(headings.last())
            .toHaveTextContent(`Day ${dayFor(newDate)}`);

        await expect
            .element(page.getByText(format(parseISO('2026-10-10'), 'PP')))
            .toBeInTheDocument();
        await expect
            .element(page.getByText(format(parseISO('2026-10-08'), 'PP')))
            .toBeInTheDocument();
    });

    it('renders the title, time, and location for each entry', async () => {
        const entry = makeEntry('a1', 'trip-1', {
            entryDate: '2026-10-10T09:30:00.000Z',
            title: 'Morning ramen',
            location: SAGRES_LOCATION,
        });
        const page = await renderComponent([entry]);

        await expect.element(page.getByText(entry.title!)).toBeInTheDocument();
        await expect
            .element(page.getByText(format(parseISO(entry.entryDate), 'p')))
            .toBeInTheDocument();
        await expect
            .element(page.getByText(entry.location!.name!))
            .toBeInTheDocument();
    });

    it('renders the empty state when there are no entries', async () => {
        const page = await renderComponent([]);

        await expect
            .element(
                page.getByRole('heading', {
                    name: 'No entries',
                })
            )
            .toBeInTheDocument();

        await expect
            .element(page.getByText('Add your plans for this trip'))
            .toBeInTheDocument();

        await expect
            .element(
                page.getByRole('button', {
                    name: 'Create a new entry',
                })
            )
            .toBeInTheDocument();
    });
});
