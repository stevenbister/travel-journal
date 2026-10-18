import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';

import { makeCachedSession } from '../../__fixtures__/session';
import { makeTrip, renderWithRouter } from '../../__test__/helpers';
import { db } from '../../lib/dexie/db';
import { useLocationQuery } from '../location-search/hooks/use-location-query';
import { CreateEntryForm } from './create-entry-form';

const mockSession = makeCachedSession();
vi.mock('../../lib/auth/use-session', () => {
    return {
        useSession: () => ({
            data: mockSession,
        }),
    };
});

vi.mock('@tanstack/react-router', async (importOriginal) => {
    const actual =
        await importOriginal<typeof import('@tanstack/react-router')>();
    return {
        ...actual,
        useParams: () => ({ tripId: 'test-trip' }),
    };
});

const now = new Date();
vi.mock('@repo/ui/components/ui/date-picker-input', () => {
    return {
        DatePicker: ({ id, onSelect, ariaInvalid }: any) => {
            return (
                <button
                    type="button"
                    id={id}
                    aria-invalid={ariaInvalid}
                    onClick={() => onSelect(now)}
                >
                    Dates
                </button>
            );
        },
    };
});

vi.mock('../location-search/hooks/use-location-query', () => ({
    useLocationQuery: vi.fn(),
}));

const paris = {
    osmType: 'node',
    osmId: 1,
    displayName: 'Paris, France',
    name: 'Paris',
    lat: 48.85,
    lng: 2.35,
    category: null,
    type: null,
    locality: null,
    country: 'France',
    countryCode: 'fr',
    boundingBox: null,
};

vi.mocked(useLocationQuery).mockReturnValue({
    data: { locations: [paris], attribution: 'osm' },
    error: null,
} as unknown as ReturnType<typeof useLocationQuery>);

const renderComponent = () =>
    renderWithRouter(<CreateEntryForm motionVariants={{}} />);

describe('CreateEntryForm', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        await db.trips.add(makeTrip('test-trip', 1, 5));
    });

    afterEach(async () => {
        await db.trips.clear();
        await db.entries.clear();
    });

    it('renders the form with the correct fields and submit button', async () => {
        const page = await renderComponent();

        await expect
            .element(
                page.getByRole('textbox', {
                    name: 'Entry Name',
                })
            )
            .toBeInTheDocument();

        await expect
            .element(
                page.getByRole('button', {
                    name: 'Day',
                })
            )
            .toBeInTheDocument();

        await expect
            .element(
                page.getByRole('textbox', {
                    name: 'Time',
                })
            )
            .toBeInTheDocument();

        await expect
            .element(
                page.getByRole('button', {
                    name: 'Location',
                })
            )
            .toBeInTheDocument();

        await expect
            .element(
                page.getByRole('textbox', {
                    name: 'Notes',
                })
            )
            .toBeInTheDocument();

        await expect
            .element(
                page.getByRole('button', {
                    name: 'Save entry',
                })
            )
            .toBeInTheDocument();
    });

    it('disables the submit button when required fields are empty', async () => {
        const page = await renderComponent();

        await expect
            .element(
                page.getByRole('button', {
                    name: 'Save entry',
                })
            )
            .toBeDisabled();
    });

    it('enables the submit button when all required fields are filled', async () => {
        const page = await renderComponent();

        await page
            .getByRole('textbox', {
                name: 'Entry Name',
            })
            .fill('My entry');

        await page
            .getByRole('button', {
                name: 'Day',
            })
            .click();

        await page
            .getByRole('textbox', {
                name: 'Time',
            })
            .fill('10:30');

        await expect
            .element(
                page.getByRole('button', {
                    name: 'Save entry',
                })
            )
            .toBeEnabled();
    });

    it('saves the entry when the form is submitted', async () => {
        const page = await renderComponent();

        await page
            .getByRole('textbox', {
                name: 'Entry Name',
            })
            .fill('My entry');

        await page
            .getByRole('button', {
                name: 'Day',
            })
            .click();

        await page
            .getByRole('textbox', {
                name: 'Time',
            })
            .fill('10:30');

        await page.getByRole('button', { name: 'Location' }).click();
        await page.getByPlaceholder('Search a place').fill('Paris');
        await userEvent.keyboard('{Enter}');

        await page.getByText('Paris', { exact: true }).click();

        await page
            .getByRole('textbox', {
                name: 'Notes',
            })
            .fill('Some notes');

        await page
            .getByRole('button', {
                name: 'Save entry',
            })
            .click();

        const [entry] = await db.entries.toArray();
        expect(entry).toEqual({
            id: expect.any(String),
            tripId: 'test-trip',
            title: 'My entry',
            authorId: 'u1',
            location: paris,
            notes: 'Some notes',
            entryDate: new Date(now.setHours(10, 30)).toISOString(),
            tag: '',
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
        });
    });
});
