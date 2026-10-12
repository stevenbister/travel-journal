import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderWithRouter } from '../../__test__/helpers';
import { TripBadge, type TripBadgeProps } from './trip-badge';

const defaultProps: TripBadgeProps = {
    startDate: '2026-10-10',
    endDate: '2026-10-15',
};

const renderComponent = (props?: Partial<TripBadgeProps>) => {
    const date = new Date('2026-10-09T12:48:11.325Z');
    vi.setSystemTime(date);

    return renderWithRouter(<TripBadge {...defaultProps} {...props} />);
};

describe('TripBadge', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders the correct badge content for an upcoming trip', async () => {
        const page = await renderComponent();
        await expect
            .element(page.getByText('11 hours to go!'))
            .toBeInTheDocument();
    });

    it('renders the correct badge content for a current trip', async () => {
        const page = await renderComponent({
            startDate: '2026-10-08',
            endDate: '2026-10-12',
        });
        await expect.element(page.getByText('Day 1 of 4')).toBeInTheDocument();
    });

    it('renders the correct badge content for a past trip', async () => {
        const page = await renderComponent({
            startDate: '2026-10-01',
            endDate: '2026-10-05',
        });
        await expect.element(page.getByText('9 days ago')).toBeInTheDocument();
    });
});
