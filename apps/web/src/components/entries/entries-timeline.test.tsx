import { eachDayOfInterval, format, parseISO } from 'date-fns';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { makeEntry } from '../../__fixtures__/entries';
import { renderWithRouter } from '../../__test__/helpers';
import type { Entry, Place } from '../../lib/dexie/types';
import { useGetTrip } from '../trips/hooks/use-get-trip';
import { CreateEntryDrawer } from './create-entry-drawer';
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
const TRIP_END = '2026-10-10T23:00:00.000Z';

const renderComponent = (
    entries: Entry[] | undefined,
    {
        endDate,
        withCreateEntryDrawer = false,
    }: { endDate?: string; withCreateEntryDrawer?: boolean } = {}
) => {
    vi.mocked(useGetEntries).mockReturnValue({ entries, isPending: false });
    vi.mocked(useGetTrip).mockReturnValue({
        trip: { startDate: TRIP_START, endDate } as never,
        isPending: false,
    });

    // The drawer lives in the trip route next to the timeline, so it is only
    // mounted when a test needs to open it.
    return renderWithRouter(
        <>
            <EntriesTimeline tripId="trip-1" />
            {withCreateEntryDrawer && <CreateEntryDrawer />}
        </>
    );
};

// Trip-relative day number via the shared util, so the test is not brittle
// across timezones (trip start is near midnight UTC).
const dayFor = (entryDate: string) => getEntryDayNumber(entryDate, TRIP_START);

describe('EntriesTimeline', () => {
    afterEach(() => {
        vi.clearAllMocks();
        vi.useRealTimers();
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

    it('orders entries within a day by ascending time', async () => {
        const breakfast = makeEntry('breakfast', 'trip-1', {
            entryDate: '2026-10-09T09:00:00.000Z',
        });
        const dinner = makeEntry('dinner', 'trip-1', {
            entryDate: '2026-10-09T19:00:00.000Z',
        });

        const page = await renderComponent([dinner, breakfast]);

        expect(await page.container.querySelector('ul')?.textContent).toMatch(
            /breakfast[\s\S]*dinner/
        );
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

    it('lists every day of the trip, filling in days without entries', async () => {
        const oldDate = '2026-10-08T09:00:00.000Z';
        const newDate = '2026-10-10T09:00:00.000Z';

        const tripDays = eachDayOfInterval({
            start: parseISO(TRIP_START),
            end: parseISO(TRIP_END),
        }).map((day) => format(day, 'yyyy-MM-dd'));

        const page = await renderComponent(
            [
                makeEntry('old', 'trip-1', { entryDate: oldDate }),
                makeEntry('new', 'trip-1', { entryDate: newDate }),
            ],
            { endDate: TRIP_END }
        );

        const headings = page.getByRole('heading', { level: 3 });

        expect(await headings.elements()).toHaveLength(tripDays.length);

        for (const day of tripDays) {
            await expect
                .element(
                    page.getByRole('heading', {
                        level: 3,
                        name: `Day ${dayFor(day)}`,
                    })
                )
                .toBeInTheDocument();

            await expect
                .element(
                    page.getByText(format(parseISO(day), 'PP'), {
                        exact: true,
                    })
                )
                .toBeInTheDocument();
        }

        await expect
            .element(headings.first())
            .toHaveTextContent(`Day ${dayFor(tripDays[0]!)}`);

        await expect
            .element(headings.last())
            .toHaveTextContent(`Day ${dayFor(tripDays.at(-1)!)}`);

        expect(
            await page.getByText('No entries for this day').elements()
        ).toHaveLength(2);
    });

    it('opens the entry drawer from an empty day with that day pre-filled', async () => {
        const page = await renderComponent(
            [
                makeEntry('only', 'trip-1', {
                    entryDate: '2026-10-08T09:00:00.000Z',
                }),
            ],
            { endDate: '2026-10-08T23:00:00.000Z', withCreateEntryDrawer: true }
        );

        await expect
            .element(page.getByRole('heading', { level: 3, name: 'Day 1' }))
            .toBeInTheDocument();

        await expect
            .element(
                page.getByText(format(parseISO('2026-10-07'), 'PP'), {
                    exact: true,
                })
            )
            .toBeInTheDocument();

        const addButtons = page.getByRole('button', { name: 'Add' });

        expect(await addButtons.elements()).toHaveLength(1);

        await addButtons.click();

        await expect
            .element(page.getByRole('heading', { level: 2, name: 'New Entry' }))
            .toBeInTheDocument();

        await expect
            .element(page.getByRole('button', { name: 'Day' }))
            .toHaveTextContent(format(parseISO('2026-10-07'), 'LLL dd, y'));
    });

    it('opens the entry drawer from the no-entries empty state', async () => {
        const page = await renderComponent([]);

        await page.getByRole('button', { name: 'Create a new entry' }).click();

        await expect
            .element(page.getByRole('heading', { level: 2, name: 'New Entry' }))
            .toBeInTheDocument();

        await expect.element(page.getByText('Pick a date')).toBeInTheDocument();
    });

    it('shows the today badge on the current trip day', async () => {
        vi.useFakeTimers({ toFake: ['Date'] });
        // Faked to noon on the third day of the mocked trip (Oct 7 to Oct 10)
        vi.setSystemTime(parseISO('2026-10-09T12:00:00.000Z'));

        const page = await renderComponent(
            [
                makeEntry('old', 'trip-1', {
                    entryDate: '2026-10-08T09:00:00.000Z',
                }),
                makeEntry('new', 'trip-1', {
                    entryDate: '2026-10-10T09:00:00.000Z',
                }),
            ],
            { endDate: TRIP_END }
        );

        const todayBadges = page.getByText('Today', { exact: true }).elements();

        expect(todayBadges).toHaveLength(1);

        const badgeHeader = todayBadges[0]!.closest('header')?.textContent;
        expect(badgeHeader).toContain(`Day ${dayFor('2026-10-09')}`);
        expect(badgeHeader).toContain(format(parseISO('2026-10-09'), 'PP'));
    });
});
