import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { SidebarProvider } from '@repo/ui/components/ui/sidebar';

import { AppSidebar } from './app-sidebar';

vi.mock('@tanstack/react-router', () => ({
    Link: vi
        .fn()
        .mockImplementation(({ children }) => <a href="#">{children}</a>),
}));

vi.mock('@repo/ui/hooks/use-mobile', () => ({
    useIsMobile: () => false,
}));

const renderComponent = () =>
    render(
        <SidebarProvider>
            <AppSidebar />
        </SidebarProvider>
    );

describe('AppSidebar', () => {
    beforeEach(() => {
        vi.clearAllMocks();
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
            .element(page.getByRole('link', { name: 'New trip' }))
            .toBeInTheDocument();
    });
});
