import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import { userEvent } from 'vitest/browser';

import { locations } from '../../__fixtures__/locations';
import type { GeocodeSearchResponse } from '../../lib/api';
import { genericErrorToast } from '../../lib/generic-error-toast';
import { useLocationQuery } from './hooks/use-location-query';
import { LocationSearch, type LocationSearchProps } from './location-search';

vi.mock('./hooks/use-location-query', () => ({
    useLocationQuery: vi.fn(),
}));

vi.mock('@repo/ui/components/ui/toast', () => ({
    toast: { add: vi.fn() },
}));

vi.mock('../../lib/generic-error-toast', () => ({
    genericErrorToast: vi.fn(),
}));

const locationMock = vi.mocked(useLocationQuery);

const paris = locations[0];

const defaultProps: LocationSearchProps = {
    id: 'location',
    onLocationSelect: vi.fn(),
};

type Options = {
    locations?: GeocodeSearchResponse['locations'];
};

const renderComponent = async (
    props?: Partial<LocationSearchProps>,
    options?: Options
) => {
    locationMock.mockReturnValue({
        data: { locations: options?.locations ?? [], attribution: 'osm' },
        error: null,
    } as unknown as ReturnType<typeof useLocationQuery>);

    return render(<LocationSearch {...defaultProps} {...props} />);
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('LocationSearch', () => {
    it('shows the pre-selected location name on the trigger', async () => {
        const page = await renderComponent({ value: paris ?? null });

        await expect
            .element(page.getByRole('button', { name: 'Paris' }))
            .toBeInTheDocument();
        await expect
            .element(page.getByRole('button', { name: 'Location' }))
            .not.toBeInTheDocument();
    });

    it('renders a trigger with a location placeholder', async () => {
        const page = await renderComponent();

        await expect
            .element(page.getByRole('button', { name: 'Location' }))
            .toBeInTheDocument();
        expect(locationMock).toHaveBeenCalledWith('');
        expect(genericErrorToast).not.toHaveBeenCalled();
    });

    it('searches on enter and lists matching locations', async () => {
        const page = await renderComponent({}, { locations: [paris!] });
        await page.getByRole('button', { name: 'Location' }).click();

        await page.getByPlaceholder('Search a place').fill('Paris');
        await userEvent.keyboard('{Enter}');

        expect(locationMock).toHaveBeenCalledWith('Paris');
        await expect
            .element(page.getByText('Paris', { exact: true }))
            .toBeInTheDocument();
        await expect
            .element(page.getByText('Paris, France'))
            .toBeInTheDocument();
    });

    it('shows an empty state when there are no results', async () => {
        const page = await renderComponent();
        await page.getByRole('button', { name: 'Location' }).click();

        await expect
            .element(page.getByText('No results found.'))
            .toBeInTheDocument();
    });

    it('calls onLocationSelect when a location is selected', async () => {
        const mockOnLocationSelect = vi.fn();
        const page = await renderComponent(
            {
                onLocationSelect: mockOnLocationSelect,
            },
            {
                locations: [paris!],
            }
        );

        await page.getByRole('button', { name: 'Location' }).click();

        await page.getByText('Paris', { exact: true }).click();

        expect(mockOnLocationSelect).toHaveBeenCalled();
    });
});
