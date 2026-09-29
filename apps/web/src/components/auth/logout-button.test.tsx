import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { authClient } from '@repo/core/auth/client';

import { genericErrorToast } from '../../lib/generic-error-toast';
import { LogoutButton } from './logout-button';

vi.mock('@repo/core/auth/client', () => ({
    authClient: {
        signOut: vi.fn(),
    },
}));

vi.mock('../../lib/generic-error-toast', () => ({
    genericErrorToast: vi.fn(),
}));

describe('LogoutButton', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('calls signOut when the logout button is pressed', async () => {
        const page = await render(<LogoutButton />);

        await page.getByRole('button', { name: 'Logout' }).click();

        expect(authClient.signOut).toHaveBeenCalled();
        await expect.poll(() => genericErrorToast).not.toHaveBeenCalled();
    });

    it('shows a generic error toast when sign out fails', async () => {
        vi.mocked(authClient.signOut).mockRejectedValueOnce(new Error('nope'));
        const page = await render(<LogoutButton />);

        await page.getByRole('button', { name: 'Logout' }).click();

        await expect.poll(() => genericErrorToast).toHaveBeenCalled();
    });
});
