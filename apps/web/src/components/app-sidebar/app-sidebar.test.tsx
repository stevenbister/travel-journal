import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { page as browserPage } from 'vitest/browser';

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
    beforeEach(async () => {
        await browserPage.viewport(1280, 720);
        vi.clearAllMocks();
    });

    afterEach(async () => {
        await browserPage.viewport(414, 896); // default size
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
