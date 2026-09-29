import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { authClient } from '@repo/core/auth/client';

import { genericErrorToast } from '../../lib/generic-error-toast';
import { LoginForm } from './login-form';

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

describe('LoginForm', () => {
    beforeEach(() => {
        vi.resetAllMocks();
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

    it('calls signIn.social when the Google Button is pressed', async () => {
        vi.mocked(authClient.signIn.social).mockResolvedValueOnce({});
        const page = await render(<LoginForm />);

        await page
            .getByRole('button', { name: 'Continue with Google' })
            .click();

        expect(authClient.signIn.social).toHaveBeenCalledWith({
            provider: 'google',
            callbackURL: '/',
        });
        await expect.poll(() => genericErrorToast).not.toHaveBeenCalled();
    });

    it('shows a generic error toast when sign in fails', async () => {
        vi.mocked(authClient.signIn.social).mockRejectedValueOnce(
            new Error('nope')
        );
        const page = await render(<LoginForm />);

        await page
            .getByRole('button', { name: 'Continue with Google' })
            .click();

        await expect.poll(() => genericErrorToast).toHaveBeenCalled();
    });
});
