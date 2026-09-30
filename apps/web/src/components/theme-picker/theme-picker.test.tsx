import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';

import { ThemeProvider } from '../providers/theme-provider';
import { ThemePicker } from './theme-picker';

describe('ThemePicker', () => {
    it('sets the users chosen theme', async () => {
        const page = await render(
            <ThemeProvider>
                <ThemePicker />
            </ThemeProvider>
        );

        const lightButton = page.getByRole('button', {
            name: 'light',
        });

        await expect
            .element(
                page.getByRole('button', {
                    name: 'System',
                })
            )
            .toHaveAttribute('aria-pressed', 'true');

        await lightButton.click();

        await expect
            .element(lightButton)
            .toHaveAttribute('aria-pressed', 'true');
    });
});
