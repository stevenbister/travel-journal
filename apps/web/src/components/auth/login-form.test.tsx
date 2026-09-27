import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { authClient } from '@repo/core/auth/client';

import { genericErrorToast } from '../../lib/generic-error-toast';
import { LoginForm } from './login-form';

vi.mock('@repo/core/auth/client', () => ({
    authClient: {
        signIn: {
            email: vi.fn(),
        },
    },
}));

vi.mock('../../lib/generic-error-toast', () => ({
    genericErrorToast: vi.fn(),
}));

describe('LoginForm', () => {
    beforeEach(() => {
        vi.mocked(authClient.signIn.email).mockReset();
        vi.mocked(genericErrorToast).mockReset();
    });

    it('renders email, password, and submit fields', async () => {
        const page = await render(<LoginForm />);

        await expect.element(page.getByLabelText('Email')).toBeInTheDocument();
        await expect
            .element(page.getByLabelText('Password'))
            .toBeInTheDocument();
        await expect
            .element(page.getByRole('button', { name: 'Login' }))
            .toBeInTheDocument();
        await expect
            .element(
                page.getByRole('button', { name: /Continue with Google/i })
            )
            .toBeInTheDocument();
    });

    it('marks email and password as required', async () => {
        const page = await render(<LoginForm />);

        await expect
            .element(page.getByLabelText('Email'))
            .toHaveAttribute('required');
        await expect
            .element(page.getByLabelText('Password'))
            .toHaveAttribute('required');
    });

    it('calls signIn.email with form values on submit', async () => {
        vi.mocked(authClient.signIn.email).mockResolvedValueOnce({} as never);
        const page = await render(<LoginForm />);

        await page.getByLabelText('Email').fill('user@example.com');
        await page.getByLabelText('Password').fill('password123');
        await page.getByRole('button', { name: 'Login' }).click();

        expect(authClient.signIn.email).toHaveBeenCalledWith({
            email: 'user@example.com',
            password: 'password123',
            callbackURL: '/',
        });
    });

    it('shows a generic error toast when sign in fails', async () => {
        vi.mocked(authClient.signIn.email).mockRejectedValueOnce(
            new Error('nope')
        );
        const page = await render(<LoginForm />);

        await page.getByLabelText('Email').fill('user@example.com');
        await page.getByLabelText('Password').fill('password123');
        await page.getByRole('button', { name: 'Login' }).click();

        await expect.poll(() => genericErrorToast).toHaveBeenCalled();
    });

    it('does not submit the form when clicking the Google button', async () => {
        const page = await render(<LoginForm />);

        await page
            .getByRole('button', { name: /Continue with Google/i })
            .click();

        expect(authClient.signIn.email).not.toHaveBeenCalled();
    });
});
