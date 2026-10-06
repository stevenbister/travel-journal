import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { makeCachedSession } from '../../__fixtures__/session';
import { db } from '../../lib/dexie/db';
import { CreateTripForm } from './create-trip-form';

const mockSession = makeCachedSession();
vi.mock('../../lib/auth/use-session', () => {
    return {
        useSession: () => ({
            data: mockSession,
        }),
    };
});

vi.mock('@repo/ui/components/ui/date-picker-input', () => {
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

describe('CreateTripForm', () => {
    beforeEach(async () => {
        await db.users.bulkAdd([
            mockSession.user,
            {
                id: '2',
                name: 'Grace',
                image: null,
            },
        ]);
    });

    afterEach(async () => {
        vi.clearAllMocks();
        await db.users.clear();
        await db.trips.clear();
        await db.tripMembers.clear();
    });

    it('renders the form with the correct fields and submit button', async () => {
        const page = await render(<CreateTripForm />);

        await expect
            .element(
                page.getByRole('textbox', {
                    name: 'Trip name',
                })
            )
            .toBeInTheDocument();

        await expect
            .element(
                page.getByRole('button', {
                    name: 'Dates',
                })
            )
            .toBeInTheDocument();

        await expect
            .element(
                page.getByRole('group', {
                    name: "Who's going?",
                })
            )
            .toBeInTheDocument();

        await expect
            .element(
                page.getByRole('button', {
                    name: 'Steven',
                })
            )
            .toBeInTheDocument();

        await expect
            .element(
                page.getByRole('button', {
                    name: 'Grace',
                })
            )
            .toBeInTheDocument();

        await expect
            .element(
                page.getByRole('button', {
                    name: 'Create trip',
                })
            )
            .toBeInTheDocument();
    });

    it('disables the submit button when required fields are empty', async () => {
        const page = await render(<CreateTripForm />);

        const submitButton = page.getByRole('button', {
            name: 'Create trip',
        });

        await expect.element(submitButton).toBeDisabled();
    });

    it('enables the submit button when all required fields are filled', async () => {
        const page = await render(<CreateTripForm />);

        await page
            .getByRole('textbox', {
                name: 'Trip Name',
            })
            .fill('My Trip');

        await page
            .getByRole('button', {
                name: 'Dates',
            })
            .click();

        await page
            .getByRole('button', {
                name: 'Grace',
            })
            .click();

        await expect
            .element(
                page.getByRole('button', {
                    name: 'Create trip',
                })
            )
            .toBeEnabled();
    });

    it('saves the trip when the form is submitted', async () => {
        const page = await render(<CreateTripForm />);

        await page
            .getByRole('textbox', {
                name: 'Trip Name',
            })
            .fill('My Trip');

        await page
            .getByRole('button', {
                name: 'Dates',
            })
            .click();

        await page
            .getByRole('button', {
                name: 'Grace',
            })
            .click();

        await page
            .getByRole('button', {
                name: 'Create trip',
            })
            .click();

        const [trip] = await db.trips.toArray();

        expect(trip).toEqual({
            id: expect.any(String),
            title: 'My Trip',
            createdBy: 'u1',
            coverPhotoId: null,
            endDate: expect.any(String),
            startDate: expect.any(String),
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
        });
    });
});
