import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeCachedSession } from '../../__fixtures__/session';
import { makeTrip } from '../../__fixtures__/trips';
import { renderWithRouter } from '../../__test__/helpers';
import { db } from '../../lib/dexie/db';
import { EditTripForm } from './edit-trip-form';

const mockSession = makeCachedSession();
vi.mock('../../lib/auth/use-session', () => {
    return {
        useSession: () => ({
            data: mockSession,
        }),
    };
});

vi.mock('@repo/ui/components/ui/date-range-picker-input', () => {
    return {
        DateRangePicker: ({ id, onSelect, ariaInvalid }: any) => {
            return (
                <button
                    type="button"
                    id={id}
                    aria-invalid={ariaInvalid}
                    onClick={() =>
                        onSelect({ from: new Date(), to: new Date() })
                    }
                >
                    Dates
                </button>
            );
        },
    };
});

const seedTrip = async () => {
    await Promise.all(db.tables.map((table) => table.clear()));

    await db.trips.bulkAdd([makeTrip('t1', 8, 12)]);
    await db.users.bulkAdd([
        { id: 'u1', name: 'Steven', image: null },
        { id: 'u2', name: 'Grace', image: null },
        { id: 'u3', name: 'Alex', image: null },
    ]);
    await db.tripMembers.bulkAdd([
        { tripId: 't1', userId: 'u1' },
        { tripId: 't1', userId: 'u2' },
    ]);
};

const renderComponent = ({
    tripId = 't1',
    onSubmit = () => {},
}: { tripId?: string; onSubmit?: () => void } = {}) =>
    renderWithRouter(<EditTripForm tripId={tripId} onSubmit={onSubmit} />);

describe('EditTripForm', () => {
    beforeEach(seedTrip);

    afterEach(async () => {
        vi.clearAllMocks();
        await db.users.clear();
        await db.trips.clear();
        await db.tripMembers.clear();
    });

    it('shows the loading state before the trip resolves', async () => {
        const page = await renderComponent();

        await expect.element(page.getByText('Loading trip…'));
    });

    it('shows the not-found state when the trip does not exist', async () => {
        const page = await renderComponent({ tripId: 'missing' });

        await expect.element(page.getByText('Trip not found'));
    });

    it('renders pre-filled with the trip name and dates', async () => {
        const page = await renderComponent();

        await expect
            .element(page.getByRole('textbox', { name: 'Trip Name' }))
            .toHaveValue('t1');

        await expect
            .element(page.getByRole('button', { name: 'Dates' }))
            .toBeInTheDocument();
    });

    it('pre-selects the existing trip members in the user picker', async () => {
        const page = await renderComponent();

        for (const name of ['Steven', 'Grace']) {
            await expect
                .element(page.getByRole('button', { name }))
                .toHaveAttribute('aria-pressed', 'true');
        }

        await expect
            .element(page.getByRole('button', { name: 'Alex' }))
            .toHaveAttribute('aria-pressed', 'false');
    });

    it('disables the submit button until the form is edited', async () => {
        const page = await renderComponent();

        const submitButton = page.getByRole('button', { name: 'Save changes' });

        await expect.element(submitButton).toBeDisabled();

        await page
            .getByRole('textbox', { name: 'Trip Name' })
            .fill('Two weeks in Japan');

        await expect.element(submitButton).toBeEnabled();
    });

    it('updates the trip when the form is submitted', async () => {
        const onSubmit = vi.fn();
        const page = await renderComponent({ onSubmit });

        await page
            .getByRole('textbox', { name: 'Trip Name' })
            .fill('Two weeks in Japan');

        await page.getByRole('button', { name: 'Dates' }).click();

        await page.getByRole('button', { name: 'Save changes' }).click();

        await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());

        const trip = await db.trips.get('t1');
        expect(trip).toMatchObject({
            title: 'Two weeks in Japan',
            startDate: expect.any(String),
            endDate: expect.any(String),
            synced: false,
            updatedAt: expect.any(String),
        });
    });

    it('creates a trip member for users added in the picker', async () => {
        const onSubmit = vi.fn();
        const page = await renderComponent({ onSubmit });

        await page
            .getByRole('textbox', { name: 'Trip Name' })
            .fill('Two weeks in Japan');

        await page.getByRole('button', { name: 'Dates' }).click();

        await page.getByRole('button', { name: 'Alex' }).click();

        await page.getByRole('button', { name: 'Save changes' }).click();

        await vi.waitFor(async () =>
            expect(await db.tripMembers.where({ tripId: 't1' }).toArray())
                .toEqual([
                    { tripId: 't1', userId: 'u1' },
                    { tripId: 't1', userId: 'u2' },
                    { tripId: 't1', userId: 'u3' },
                ])
        );
    });

    it('removes a trip member for users deselected in the picker', async () => {
        const onSubmit = vi.fn();
        const page = await renderComponent({ onSubmit });

        await page
            .getByRole('textbox', { name: 'Trip Name' })
            .fill('Two weeks in Japan');

        await page.getByRole('button', { name: 'Dates' }).click();

        await page.getByRole('button', { name: 'Grace' }).click();

        await page.getByRole('button', { name: 'Save changes' }).click();

        await vi.waitFor(async () =>
            expect(await db.tripMembers.where({ tripId: 't1' }).toArray())
                .toEqual([{ tripId: 't1', userId: 'u1' }])
        );
    });
});
