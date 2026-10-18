import { describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { BadgeSelector } from './badge-selector';

describe('BadgeSelector', () => {
    it('renders a list of badges', async () => {
        const page = await render(
            <BadgeSelector
                items={[
                    'Adventure',
                    'Relaxation',
                    'Cultural',
                    'Food',
                    'Nature',
                ]}
                value={['']}
                onValueChange={vi.fn()}
            />
        );

        await expect.element(page.getByText('Adventure')).toBeDefined();
        await expect.element(page.getByText('Relaxation')).toBeDefined();
        await expect.element(page.getByText('Cultural')).toBeDefined();
        await expect.element(page.getByText('Food')).toBeDefined();
        await expect.element(page.getByText('Nature')).toBeDefined();
    });

    it('calls onValueChange when a badge is clicked', async () => {
        const onValueChange = vi.fn();
        const page = await render(
            <BadgeSelector
                items={[
                    'Adventure',
                    'Relaxation',
                    'Cultural',
                    'Food',
                    'Nature',
                ]}
                value={['']}
                onValueChange={onValueChange}
            />
        );

        await page.getByText('Adventure').click();
        expect(onValueChange).toHaveBeenCalled();
    });
});
