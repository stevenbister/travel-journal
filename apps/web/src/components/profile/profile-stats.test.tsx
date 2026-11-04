import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { makeEntry } from '../../__fixtures__/entries';
import { makeCachedSession } from '../../__fixtures__/session';
import { makeTrip } from '../../__fixtures__/trips';
import { db } from '../../lib/dexie/db';
import type { Place } from '../../lib/dexie/types';
import { ProfileStats } from './profile-stats';

const mockSession = makeCachedSession();
const userId = mockSession.user.id;

vi.mock('../../lib/auth/use-session', () => {
    return {
        useSession: () => ({
            data: mockSession,
        }),
    };
});

const makePlace = (country: string | null): Place => ({
    osmType: 'node',
    osmId: 1,
    displayName: country ? `Somewhere, ${country}` : 'Somewhere',
    name: 'Somewhere',
    lat: 1,
    lng: 1,
    category: null,
    type: null,
    locality: null,
    country,
    countryCode: null,
    boundingBox: null,
});

// Counts are kept distinct within each test so the numbers can be matched by text
const entry = (id: string, country: string | null, authorId = userId) =>
    makeEntry(id, 't1', { authorId, location: makePlace(country) });

const expectCount = (page: Awaited<ReturnType<typeof render>>, count: number) =>
    expect.element(page.getByText(String(count), { exact: true })).toBeVisible();

const renderComponent = async () => render(<ProfileStats />);

describe('ProfileStats', () => {
    beforeEach(async () => {
        await Promise.all([db.trips.clear(), db.entries.clear()]);
    });

    afterEach(async () => {
        vi.clearAllMocks();
        await Promise.all([db.trips.clear(), db.entries.clear()]);
    });

    it('renders the three stats when there is no data', async () => {
        const page = await renderComponent();

        await expect.element(page.getByText('Trips')).toBeVisible();
        await expect.element(page.getByText('Entries added')).toBeVisible();
        await expect.element(page.getByText('Countries')).toBeVisible();
    });

    it('renders the trip, entry and country counts', async () => {
        await db.trips.bulkAdd([makeTrip('t1', 1, 2)]);
        await db.entries.bulkAdd([
            entry('e1', 'France'),
            entry('e2', 'Japan'),
            // Another user's entry still counts towards the countries stat
            entry('e3', 'Germany', 'someone-else'),
        ]);

        const page = await renderComponent();

        // 1 trip, 2 entries by the current user, 3 unique countries across all entries
        await expectCount(page, 1);
        await expectCount(page, 2);
        await expectCount(page, 3);
    });

    it('only counts entries authored by the current user', async () => {
        await db.entries.bulkAdd([
            entry('e1', null),
            entry('e2', 'Japan', 'someone-else'),
            entry('e3', 'Germany', 'someone-else'),
        ]);

        const page = await renderComponent();

        // 1 entry by the current user, 2 unique countries across all entries
        await expectCount(page, 1);
        await expectCount(page, 2);
    });

    it('counts unique countries, ignoring duplicates and entries without a country', async () => {
        await db.trips.bulkAdd([
            makeTrip('t1', 1, 2),
            makeTrip('t2', 3, 4),
            makeTrip('t3', 5, 6),
        ]);
        await db.entries.bulkAdd([
            entry('e1', 'France'),
            entry('e2', 'France'),
            entry('e3', null),
            makeEntry('e4', 't1', { authorId: userId, location: null }),
        ]);

        const page = await renderComponent();

        // 3 trips, 4 entries by the current user, but only 1 unique country
        await expectCount(page, 3);
        await expectCount(page, 4);
        await expectCount(page, 1);
    });

    it('updates the counts when an entry is added after mount', async () => {
        const page = await renderComponent();

        await expect.element(page.getByText('Entries added')).toBeVisible();

        await db.entries.add(entry('e1', null));

        // The live query should pick up the new entry
        await expectCount(page, 1);
    });
});
