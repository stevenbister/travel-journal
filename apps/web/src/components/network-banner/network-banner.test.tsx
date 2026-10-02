import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from 'vitest-browser-react';

import { NetworkBanner } from './network-banner';

const mocks = vi.hoisted(() => ({
    useCheckIsOnline: vi.fn(),
}));

vi.mock('../../lib/online/use-check-is-online', () => ({
    useCheckIsOnline: mocks.useCheckIsOnline,
}));

describe('NetworkBanner', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        mocks.useCheckIsOnline.mockReturnValue({ data: true });
    });

    it('renders nothing  when online', async () => {
        const page = await render(<NetworkBanner />);
        await expect
            .element(page.getByText('You are currently offline'))
            .not.toBeInTheDocument();
    });

    it('renders offline text  when offline', async () => {
        mocks.useCheckIsOnline.mockReturnValue({ data: false });
        const page = await render(<NetworkBanner />);
        await expect
            .element(page.getByText('You are currently offline'))
            .toBeInTheDocument();
    });
});
