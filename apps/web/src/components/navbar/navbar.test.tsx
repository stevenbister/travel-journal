import { beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '../../__test__/helpers';
import { Navbar } from './navbar';

const renderComponent = () => renderWithRouter(<Navbar />);

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
