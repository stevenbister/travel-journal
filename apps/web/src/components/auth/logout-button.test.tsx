import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { authClient } from '@repo/core/auth/client';

import { db } from '../../lib/dexie/db';
import { genericErrorToast } from '../../lib/generic-error-toast';
import { LogoutButton } from './logout-button';

const mocks = vi.hoisted(() => ({
    navigate: vi.fn(),
    checkIsOnline: vi.fn(),
}));

vi.mock('@repo/core/auth/client', () => ({
    authClient: {
        signOut: vi.fn(),
    },
}));

vi.mock('../../lib/generic-error-toast', () => ({
    genericErrorToast: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => mocks.navigate,
}));

vi.mock('../../lib/online/check-is-online', () => ({
    checkIsOnline: mocks.checkIsOnline,
}));

const clickLogout = async () => {
    const page = await render(<LogoutButton />);
    await page.getByRole('button', { name: 'Logout' }).click();
};

describe('LogoutButton', () => {
    beforeEach(async () => {
        vi.resetAllMocks();

        await db.authSession.clear();
        await db.authMeta.clear();

        mocks.checkIsOnline.mockResolvedValue(true);
    });

    describe('online', () => {
        it('calls signOut when the logout button is pressed', async () => {
            await clickLogout();

            expect(authClient.signOut).toHaveBeenCalled();
            await expect.poll(() => genericErrorToast).not.toHaveBeenCalled();
        });
    });

    describe('offline', () => {
        beforeEach(() => {
            mocks.checkIsOnline.mockResolvedValue(false);
        });

        it('does not call signOut when offline', async () => {
            await clickLogout();

            expect(authClient.signOut).not.toHaveBeenCalled();
            await expect.poll(() => genericErrorToast).not.toHaveBeenCalled();
        });

        it('clears the cached session and navigates to login', async () => {
            await clickLogout();

            await expect
                .poll(() => db.authSession.get('current'))
                .toBeUndefined();
            await expect.poll(() => mocks.navigate.mock.calls.length).toBe(1);
            expect(mocks.navigate).toHaveBeenCalledWith({
                to: '/login',
                search: { redirect: '/' },
            });
        });

        it('records a pending sign out for later', async () => {
            await clickLogout();

            await expect
                .poll(() => db.authMeta.get('pendingSignOut'))
                .toMatchObject({
                    key: 'pendingSignOut',
                    at: expect.any(Number),
                });
        });
    });

    it('shows a generic error toast when sign out fails', async () => {
        vi.mocked(authClient.signOut).mockRejectedValueOnce(new Error('nope'));
        await clickLogout();

        await expect.poll(() => genericErrorToast).toHaveBeenCalled();
    });
});
