import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { ByLine } from './by-line';

describe('ByLine', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('renders the component with author name and created date when created at and updated at are the same', async () => {
        const page = await render(
            <ByLine
                author="John Doe"
                createdAt="2025-01-01T12:00:00.000Z"
                updatedAt="2025-01-01T12:00:00.000Z"
            />
        );

        await expect
            .element(page.getByText('Created by John Doe'))
            .toBeInTheDocument();
        await expect
            .element(page.getByText('less than a minute ago'))
            .toBeInTheDocument();
    });

    it('renders the edited text when the updated at is different from the created at', async () => {
        const page = await render(
            <ByLine
                author="John Doe"
                createdAt="2025-01-01T12:00:00.000Z"
                updatedAt="2025-01-01T11:55:00.000Z"
            />
        );

        await expect
            .element(page.getByText('(edited 5 minutes ago)'))
            .toBeInTheDocument();
    });
});
