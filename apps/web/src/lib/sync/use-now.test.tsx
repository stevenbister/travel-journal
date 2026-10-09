import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { useNow } from './use-now';

const setVisibility = (state: DocumentVisibilityState) => {
    Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => state,
    });
};

const fireVisibilityChange = () =>
    document.dispatchEvent(new Event('visibilitychange'));

describe('useNow', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(new Date('2025-01-01T12:00:00.000Z'));
        setVisibility('visible');
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
        delete (document as { visibilityState?: unknown }).visibilityState;
    });

    it('returns the current time as an ISO string on first render', async () => {
        const { result } = await renderHook(() => useNow());

        expect(result.current).toBe('2025-01-01T12:00:00.000Z');
    });

    it('does not change over time while the tab stays visible', async () => {
        const { result } = await renderHook(() => useNow());

        vi.setSystemTime(new Date('2025-01-01T12:05:00.000Z'));

        expect(result.current).toBe('2025-01-01T12:00:00.000Z');
    });

    it('updates when the tab becomes visible again', async () => {
        const { result, act } = await renderHook(() => useNow());

        vi.setSystemTime(new Date('2025-01-01T13:00:00.000Z'));
        setVisibility('visible');
        await act(() => fireVisibilityChange());

        expect(result.current).toBe('2025-01-01T13:00:00.000Z');
    });

    it('does not update when the tab becomes hidden', async () => {
        const { result, act } = await renderHook(() => useNow());

        vi.setSystemTime(new Date('2025-01-01T13:00:00.000Z'));
        setVisibility('hidden');
        await act(() => fireVisibilityChange());

        expect(result.current).toBe('2025-01-01T12:00:00.000Z');
    });

    it('picks up the latest time on each visible transition', async () => {
        const { result, act } = await renderHook(() => useNow());

        vi.setSystemTime(new Date('2025-01-01T13:00:00.000Z'));
        await act(() => fireVisibilityChange());
        expect(result.current).toBe('2025-01-01T13:00:00.000Z');

        vi.setSystemTime(new Date('2025-01-01T14:30:00.000Z'));
        await act(() => fireVisibilityChange());
        expect(result.current).toBe('2025-01-01T14:30:00.000Z');
    });

    it('registers a single visibilitychange listener, even across re-renders', async () => {
        const addSpy = vi.spyOn(document, 'addEventListener');

        const { rerender } = await renderHook(() => useNow());
        await rerender();
        await rerender();

        const calls = addSpy.mock.calls.filter(
            ([type]) => type === 'visibilitychange'
        );
        expect(calls).toHaveLength(1);
    });

    it('removes the listener on unmount', async () => {
        const addSpy = vi.spyOn(document, 'addEventListener');
        const removeSpy = vi.spyOn(document, 'removeEventListener');

        const { unmount } = await renderHook(() => useNow());
        const [, handler] = addSpy.mock.calls.find(
            ([type]) => type === 'visibilitychange'
        )!;

        await unmount();

        expect(removeSpy).toHaveBeenCalledWith('visibilitychange', handler);
    });
});
