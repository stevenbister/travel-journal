import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
// or @testing-library/react
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { HttpError } from '../api';
import { pull } from './pull';
import { syncNow, useSync } from './use-sync';

vi.mock('./pull', () => ({ pull: vi.fn() }));

const pullMock = vi.mocked(pull);

const deferred = () => {
    let resolve!: () => void;
    let reject!: (e: unknown) => void;
    const promise = new Promise<void>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};

beforeEach(() => {
    pullMock.mockReset();
    pullMock.mockResolvedValue(undefined);
});

describe('syncNow', () => {
    it('collapses overlapping calls into one run', async () => {
        const d = deferred();
        pullMock.mockReturnValueOnce(d.promise);

        const a = syncNow();
        const b = syncNow();

        expect(a).toBe(b);
        expect(pullMock).toHaveBeenCalledTimes(1);

        d.resolve();
        await a;
    });

    it('runs exactly one follow-up if asked mid-flight', async () => {
        const d = deferred();
        pullMock.mockReturnValueOnce(d.promise);

        const run = syncNow();
        syncNow();
        syncNow();
        syncNow();

        d.resolve();
        await run;

        expect(pullMock).toHaveBeenCalledTimes(2);
    });

    it('starts a fresh run once the previous one has settled', async () => {
        await syncNow();
        await syncNow();

        expect(pullMock).toHaveBeenCalledTimes(2);
    });

    it('propagates failures and recovers on the next call', async () => {
        pullMock.mockRejectedValueOnce(new Error('boom'));

        await expect(syncNow()).rejects.toThrow('boom');

        await syncNow();
        expect(pullMock).toHaveBeenCalledTimes(2);
    });
});

describe('useSync', () => {
    const setup = async () => {
        const client = new QueryClient({
            defaultOptions: { queries: { retryDelay: 0 } },
        });
        const wrapper = ({ children }: { children: ReactNode }) => (
            <QueryClientProvider client={client}>
                {children}
            </QueryClientProvider>
        );
        return renderHook(() => useSync(), { wrapper });
    };

    it('syncs on mount and exposes a last-synced timestamp', async () => {
        const { result } = await setup();

        await vi.waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(pullMock).toHaveBeenCalledTimes(1);
        expect(result.current.data).toEqual(expect.any(Number));
    });

    it('does not retry 401s', async () => {
        pullMock.mockRejectedValue(new HttpError(401, 'Unauthorized')); // adjust ctor

        const { result } = await setup();

        await vi.waitFor(() => expect(result.current.isError).toBe(true));
        expect(pullMock).toHaveBeenCalledTimes(1);
    });

    it('retries other errors up to 3 times', async () => {
        pullMock.mockRejectedValue(new Error('network'));

        const { result } = await setup();

        await vi.waitFor(() => expect(result.current.isError).toBe(true));
        expect(pullMock).toHaveBeenCalledTimes(4); // initial + 3 retries
    });
});
