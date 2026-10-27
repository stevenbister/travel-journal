import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { makeEntry } from '../../__fixtures__/entries';
import { locations } from '../../__fixtures__/locations';
import { makeTrip } from '../../__fixtures__/trips';
import { renderWithRouter } from '../../__test__/helpers';
import { db } from '../../lib/dexie/db';
import { useLocationQuery } from '../location-search/hooks/use-location-query';
import { EditEntryForm } from './edit-entry-form';

vi.mock('@repo/ui/components/ui/date-picker-input', () => {
    return {
        DatePicker: ({
            id,
            ariaInvalid,
        }: {
            id: string;
            ariaInvalid: boolean;
        }) => {
            return (
                <button type="button" id={id} aria-invalid={ariaInvalid}>
                    Day
                </button>
            );
        },
    };
});

vi.mock('../location-search/hooks/use-location-query', () => ({
    useLocationQuery: vi.fn(),
}));

const seedEntry = async () => {
    await db.trips.bulkAdd([makeTrip('t1', 8, 12, { createdBy: 'user-1' })]);
    await db.users.bulkAdd([{ id: 'user-1', name: 'Steven', image: null }]);
    await db.entries.bulkAdd([makeEntry('e1', 't1', { tag: 'food' })]);
};

vi.mocked(useLocationQuery).mockReturnValue({
    data: { locations: locations, attribution: 'osm' },
    error: null,
} as unknown as ReturnType<typeof useLocationQuery>);

const renderComponent = ({
    entryId = 'e1',
    onSubmit = () => {},
}: { entryId?: string; onSubmit?: () => void } = {}) =>
    renderWithRouter(<EditEntryForm entryId={entryId} onSubmit={onSubmit} />);

describe('EditEntryForm', () => {
    beforeEach(async () => {
        // IndexedDB persists across test files, so clear before seeding
        await Promise.all([
            db.trips.clear(),
            db.users.clear(),
            db.entries.clear(),
        ]);
        await seedEntry();
    });

    afterEach(async () => {
        vi.clearAllMocks();
    });

    it('shows the loading state before the entry resolves', async () => {
        const page = await renderComponent();

        await expect.element(page.getByText('Loading entry...'));
    });

    it('shows the not-found state when the entry does not exist', async () => {
        const page = await renderComponent({ entryId: 'missing' });

        await expect.element(page.getByText('Entry not found'));
    });

    it('renders pre-filled with the entry fields', async () => {
        const page = await renderComponent();

        await expect
            .element(page.getByRole('textbox', { name: 'Entry name' }))
            .toHaveValue('e1');

        await expect
            .element(page.getByRole('textbox', { name: 'Notes' }))
            .toHaveValue('notes');

        await expect.element(page.getByLabelText('Day')).toBeInTheDocument();

        await expect.element(page.getByLabelText('Time')).toHaveValue('12:00');
    });

    it('marks the entry tag as selected in the badge selector', async () => {
        const page = await renderComponent();

        await expect
            .element(page.getByRole('button', { name: 'food' }))
            .toHaveAttribute('aria-pressed', 'true');

        await expect
            .element(page.getByRole('button', { name: 'transport' }))
            .toHaveAttribute('aria-pressed', 'false');
    });

    it('disables the submit button until the form is edited', async () => {
        const page = await renderComponent();

        const submitButton = page.getByRole('button', { name: 'Save changes' });

        await expect.element(submitButton).toBeDisabled();

        await page
            .getByRole('textbox', { name: 'Entry name' })
            .fill('Lunch at the floating market');

        await expect.element(submitButton).toBeEnabled();
    });

    it('removes the submit button hint when validation fails', async () => {
        const page = await renderComponent();

        await page
            .getByRole('textbox', { name: 'Entry name' })
            .fill('Some new title');

        await page.getByRole('textbox', { name: 'Entry name' }).fill('');

        const submitButton = page.getByRole('button', { name: 'Save changes' });

        await expect.element(submitButton).toBeDisabled();
    });

    it('saves the entry when the form is submitted', async () => {
        const onSubmit = vi.fn();
        const page = await renderComponent({ onSubmit });

        await page
            .getByRole('textbox', { name: 'Entry name' })
            .fill('Lunch at the floating market');

        await page
            .getByRole('textbox', { name: 'Notes' })
            .fill('Cheap and delicious');

        await page.getByLabelText('Time').fill('14:30');

        await page.getByRole('button', { name: 'transport' }).click();

        await page.getByRole('button', { name: 'Save changes' }).click();

        await vi.waitFor(() => expect(onSubmit).toHaveBeenCalled());

        const entry = await db.entries.get('e1');
        expect(entry).toMatchObject({
            title: 'Lunch at the floating market',
            notes: 'Cheap and delicious',
            tag: 'transport',
            synced: false,
            updatedAt: expect.any(String),
        });
        expect(entry!.entryDate).not.toBe('2026-10-09T12:00:00.000Z');
    });
});
