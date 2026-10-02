import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { Navbar } from './navbar';

vi.mock('@tanstack/react-router', () => ({
    Link: vi
        .fn()
        .mockImplementation(({ children }) => <a href="#">{children}</a>),
}));

const renderComponent = () =>
    render(
        <QueryClientProvider client={new QueryClient()}>
            <Navbar />
        </QueryClientProvider>
    );

describe('Navbar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the Navbar', async () => {
        const page = await renderComponent();

        await expect.element(page.getByRole('navigation')).toBeInTheDocument();
    });

    it('renders the navigation items', async () => {
        const page = await renderComponent();

        await expect
            .element(page.getByRole('link', { name: 'Trips' }))
            .toBeInTheDocument();
        await expect
            .element(page.getByRole('link', { name: 'Search' }))
            .toBeInTheDocument();
        await expect
            .element(page.getByRole('link', { name: 'Map' }))
            .toBeInTheDocument();
        await expect
            .element(page.getByRole('link', { name: 'Profile' }))
            .toBeInTheDocument();
    });

    it('renders the add button', async () => {
        const page = await renderComponent();

        await expect
            .element(page.getByRole('link', { name: 'Add' }))
            .toBeInTheDocument();
    });
});
