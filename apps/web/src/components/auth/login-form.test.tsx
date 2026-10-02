import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { authClient } from '@repo/core/auth/client';

import { genericErrorToast } from '../../lib/generic-error-toast';
import { LoginForm } from './login-form';

const mocks = vi.hoisted(() => ({
    checkIsOnline: vi.fn(),
    toast: vi.fn(),
}));

vi.mock('@repo/core/auth/client', () => ({
    authClient: {
        signIn: {
            social: vi.fn(),
        },
    },
}));

vi.mock('../../lib/generic-error-toast', () => ({
    genericErrorToast: vi.fn(),
}));

vi.mock('../../lib/online/check-is-online', () => ({
    checkIsOnline: mocks.checkIsOnline,
}));

vi.mock('../../lib/toast', () => ({
    toast: mocks.toast,
}));

const submitForm = async () => {
    const page = await render(<LoginForm />);
    await page.getByRole('button', { name: 'Continue with Google' }).click();
};

describe('LoginForm', () => {
    beforeEach(() => {
        vi.resetAllMocks();

        mocks.checkIsOnline.mockResolvedValue(true);
    });

    it('renders heading, Google login button, and alert', async () => {
        const page = await render(<LoginForm />);

        await expect
            .element(
                page.getByRole('heading', { level: 1, name: 'Travel Journal' })
            )
            .toBeInTheDocument();
        await expect
            .element(page.getByRole('button', { name: 'Continue with Google' }))
            .toBeInTheDocument();
        await expect
            .element(
                page.getByText(
                    'Travel Log is invite-only. Sign in with the Google account that has been invited.'
                )
            )
            .toBeInTheDocument();
    });

    describe('online', () => {
        it('calls signIn.social when the Google Button is pressed', async () => {
            vi.mocked(authClient.signIn.social).mockResolvedValueOnce({});
            await submitForm();

            await expect
                .poll(() => vi.mocked(authClient.signIn.social).mock.calls)
                .toEqual([[{ provider: 'google', callbackURL: '/' }]]);
            await expect.poll(() => genericErrorToast).not.toHaveBeenCalled();
        });
    });

    describe('offline', () => {
        beforeEach(() => {
            mocks.checkIsOnline.mockResolvedValue(false);
        });

        it('does not call signIn.social when offline', async () => {
            await submitForm();

            expect(authClient.signIn.social).not.toHaveBeenCalled();
            await expect.poll(() => genericErrorToast).not.toHaveBeenCalled();
        });
    });

    it('shows a generic error toast when sign in fails', async () => {
        vi.mocked(authClient.signIn.social).mockRejectedValueOnce(
            new Error('nope')
        );
        await submitForm();

        await expect.poll(() => genericErrorToast).toHaveBeenCalled();
    });
});
