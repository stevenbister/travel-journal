import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SidebarProvider } from '@repo/ui/components/ui/sidebar';

import { renderWithRouter } from '../../__test__/helpers';
import { AppSidebar } from './app-sidebar';

vi.mock('@repo/ui/hooks/use-mobile', () => ({
    useIsMobile: () => false,
}));

const renderComponent = () =>
    renderWithRouter(
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
