import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { format, parseISO } from 'date-fns';

import type { Entry } from '../../lib/dexie/types';
import { EntriesTimeline } from './entries-timeline';
import { useGetEntries } from './hooks/use-get-entries';

vi.mock('./hooks/use-get-entries', () => ({
    useGetEntries: vi.fn(),
}));

const makeEntry = (
    id: string,
    entryDate: string,
    overrides: Partial<Entry> = {}
): Entry => ({
    id,
    tripId: 'trip-1',
    authorId: 'user-1',
    note: `note-${id}`,
    entryDate,
    lat: 35.68,
    lng: 139.69,
    tag: null,
    isDeleted: false,
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
});

const renderComponent = (entries: Entry[] | undefined) => {
    vi.mocked(useGetEntries).mockReturnValue(entries);
    return render(<EntriesTimeline tripId="trip-1" />);
};

describe('EntriesTimeline', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('groups entries by day, newest first with ascending day numbers', async () => {
        const page = await renderComponent([
            makeEntry('old', '2026-10-08T09:00:00.000Z'),
            makeEntry('new', '2026-10-10T09:00:00.000Z'),
        ]);

        const headings = page.getByRole('heading', { level: 3 });
        await expect.element(headings.first()).toHaveTextContent('Day 2');
        await expect.element(headings.last()).toHaveTextContent('Day 1');

        await expect
            .element(page.getByText(format(parseISO('2026-10-10'), 'PP')))
            .toBeInTheDocument();
        await expect
            .element(page.getByText(format(parseISO('2026-10-08'), 'PP')))
            .toBeInTheDocument();
    });

    it('renders the note, time, and location for each entry', async () => {
        const entry = makeEntry('a1', '2026-10-10T09:30:00.000Z', {
            note: 'Morning ramen',
        });
        const page = await renderComponent([entry]);

        await expect
            .element(page.getByText('Morning ramen'))
            .toBeInTheDocument();
        await expect
            .element(
                page.getByText(format(parseISO(entry.entryDate), 'p'))
            )
            .toBeInTheDocument();
        await expect
            .element(page.getByText('35.68, 139.69'))
            .toBeInTheDocument();
    });

    it('renders nothing when there are no entries', async () => {
        const page = await renderComponent([]);

        await expect
            .element(page.getByRole('heading').first())
            .not.toBeInTheDocument();
    });
});
