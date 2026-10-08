import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { makeCachedSession } from '../../__fixtures__/session';
import { db } from '../../lib/dexie/db';
import { UserPicker, type UserPickerProps } from './user-picker';

const mockSession = makeCachedSession();
vi.mock('../../lib/auth/use-session', () => {
    return {
        useSession: () => ({
            data: mockSession,
        }),
    };
});

const defaultProps: UserPickerProps = {
    id: 'user-picker',
    labelledBy: 'user-picker-label',
    onChange: vi.fn(),
};

const renderComponent = (props: Partial<UserPickerProps> = {}) => {
    return render(<UserPicker {...defaultProps} {...props} />);
};

describe('UserPicker', () => {
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
    });

    it('renders the user picker component', async () => {
        const page = await renderComponent();

        await expect
            .element(
                page.getByRole('button', {
                    name: mockSession.user.name,
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
    });

    it('calls onChange when a user is selected', async () => {
        const onChange = vi.fn();
        const page = await renderComponent({ onChange });

        await page.getByRole('button', { name: 'Grace' }).click();

        expect(onChange).toHaveBeenCalledWith([mockSession.user.id, '2']);
    });
});
