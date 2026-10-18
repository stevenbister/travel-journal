import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { locations } from '../../../__fixtures__/locations';
import { HttpError, api } from '../../../lib/api';
import {
    MIN_LOCATION_QUERY_LENGTH,
    useLocationQuery,
} from './use-location-query';

vi.mock('../../../lib/api', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../../../lib/api')>();
    return {
        ...actual,
        api: { geocode: { search: vi.fn() } },
    };
});

const searchMock = vi.mocked(api.geocode.search);

const setup = (query: string) => {
    const client = new QueryClient({
        defaultOptions: { queries: { retryDelay: 0, gcTime: Infinity } },
    });
    const wrapper = ({ children }: { children: ReactNode }) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
    return renderHook(() => useLocationQuery(query), { wrapper });
};

beforeEach(() => {
    searchMock.mockReset();
    searchMock.mockResolvedValue({ locations, attribution: 'osm' });
});

describe('useLocationQuery', () => {
    it(`does not fetch when the query is shorter than ${MIN_LOCATION_QUERY_LENGTH} chars`, async () => {
        const { result } = await setup('ab');

        await expect.poll(() => result.current.fetchStatus).toBe('idle');
        expect(result.current.isPending).toBe(true);
        expect(searchMock).not.toHaveBeenCalled();
    });

    it('does not fetch for a blank query', async () => {
        const { result } = await setup('   ');

        await expect.poll(() => result.current.fetchStatus).toBe('idle');
        expect(searchMock).not.toHaveBeenCalled();
    });

    it('trims the query and returns locations', async () => {
        const { result } = await setup('  Paris  ');

        await expect.poll(() => result.current.isSuccess).toBe(true);
        expect(searchMock).toHaveBeenCalledWith(
            { q: 'Paris' },
            expect.objectContaining({ signal: expect.any(AbortSignal) })
        );
        expect(result.current.data?.locations).toEqual(locations);
    });

    it('does not retry a 429 but retries other errors once', async () => {
        searchMock.mockRejectedValue(new HttpError(429, 'Too Many Requests'));
        const rateLimited = await setup('Paris');
        await expect.poll(() => rateLimited.result.current.isError).toBe(true);
        expect(searchMock).toHaveBeenCalledTimes(1);

        searchMock.mockReset();
        searchMock.mockRejectedValue(new Error('boom'));
        const failed = await setup('Paris');
        await expect.poll(() => failed.result.current.isError).toBe(true);
        expect(searchMock).toHaveBeenCalledTimes(2);
    });
});
