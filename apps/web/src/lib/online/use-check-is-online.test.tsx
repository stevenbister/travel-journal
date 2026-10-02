import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { checkIsOnline } from './check-is-online';
import { useCheckIsOnline } from './use-check-is-online';

vi.mock('./check-is-online', () => ({ checkIsOnline: vi.fn() }));

const checkMock = vi.mocked(checkIsOnline);

let queryClient: QueryClient;

const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const renderUseCheckIsOnline = () =>
    renderHook(() => useCheckIsOnline(), { wrapper });

const dispatch = async (type: 'online' | 'offline') => {
    await act(async () => {
        window.dispatchEvent(new Event(type));
    });
};

const waitForIdle = () => expect.poll(() => queryClient.isFetching()).toBe(0);

beforeEach(() => {
    queryClient = new QueryClient({
        defaultOptions: { queries: { gcTime: Infinity } },
    });
    checkMock.mockResolvedValue(true);
});

afterEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
    checkMock.mockReset();
});

describe('useCheckIsOnline', () => {
    it('starts as offline before the first check resolves', async () => {
        checkMock.mockReturnValue(new Promise(() => {})); // never resolves

        const { result } = await renderUseCheckIsOnline();

        expect(result.current.data).toBe(false);
    });

    it('runs a check on mount and updates to online', async () => {
        const { result } = await renderUseCheckIsOnline();

        await expect.poll(() => result.current.data).toBe(true);
        expect(checkMock).toHaveBeenCalledTimes(1);
    });

    it('stays offline when the initial check reports offline', async () => {
        checkMock.mockResolvedValue(false);

        const { result } = await renderUseCheckIsOnline();

        await expect.poll(() => checkMock.mock.calls.length).toBe(1);
        await waitForIdle();
        expect(result.current.data).toBe(false);
    });

    it('passes no arguments to checkIsOnline (uses its default timeout)', async () => {
        const { result } = await renderUseCheckIsOnline();

        await expect.poll(() => result.current.data).toBe(true);
        expect(checkMock).toHaveBeenCalledWith();
    });

    it('sets data to false immediately without another request', async () => {
        const { result } = await renderUseCheckIsOnline();
        await expect.poll(() => result.current.data).toBe(true);
        checkMock.mockClear();

        await dispatch('offline');

        expect(result.current.data).toBe(false);
        expect(checkMock).not.toHaveBeenCalled();
    });

    it('re-verifies with a real check instead of trusting the event', async () => {
        checkMock.mockResolvedValue(false);
        await renderUseCheckIsOnline();
        await waitForIdle();
        checkMock.mockClear();

        await dispatch('online');

        await expect.poll(() => checkMock.mock.calls.length).toBe(1);
    });

    it('flips to online once the recheck succeeds', async () => {
        const { result } = await renderUseCheckIsOnline();
        await expect.poll(() => result.current.data).toBe(true);

        await dispatch('offline');
        expect(result.current.data).toBe(false);

        await dispatch('online');

        await expect.poll(() => result.current.data).toBe(true);
    });

    it('stays offline if the recheck still fails (e.g. backend down)', async () => {
        const { result } = await renderUseCheckIsOnline();
        await expect.poll(() => result.current.data).toBe(true);

        await dispatch('offline');
        checkMock.mockResolvedValue(false);
        checkMock.mockClear();

        await dispatch('online');

        await expect.poll(() => checkMock.mock.calls.length).toBe(1);
        await waitForIdle();
        expect(result.current.data).toBe(false);
    });

    it('does not retry when the query function rejects', async () => {
        checkMock.mockRejectedValue(new Error('unexpected'));

        const { result } = await renderUseCheckIsOnline();

        await expect
            .poll(() => queryClient.getQueryState(['isOnline'])?.status)
            .toBe('error');
        expect(checkMock).toHaveBeenCalledTimes(1);
        // initialData is preserved, so consumers still see a boolean
        expect(result.current.data).toBe(false);
    });

    it('does not re-render when a refetch returns the same value', async () => {
        let renders = 0;
        const { result } = await renderHook(
            () => {
                renders++;
                return useCheckIsOnline();
            },
            { wrapper }
        );
        await expect.poll(() => result.current.data).toBe(true);
        await waitForIdle();
        const rendersBefore = renders;

        await dispatch('online'); // recheck resolves true again
        await expect.poll(() => checkMock.mock.calls.length).toBe(2);
        await waitForIdle();

        expect(renders).toBe(rendersBefore);
    });
});
