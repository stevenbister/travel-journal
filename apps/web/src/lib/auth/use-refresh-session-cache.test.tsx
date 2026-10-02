import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { getSession } from './session';
import { useRefreshSessionCache } from './use-refresh-session-cache';

// adjust to your file name

const mocks = vi.hoisted(() => ({
    getSession: vi.fn(),
    navigate: vi.fn(),
    useSession: vi.fn(),
}));

vi.mock('@tanstack/react-router', () => ({
    useNavigate: () => mocks.navigate,
}));
vi.mock('./session', () => ({ getSession: mocks.getSession }));
vi.mock('./use-session', () => ({ useSession: mocks.useSession }));

const SESSION = { id: 'current', user: { id: 'u1' } };

const setSessionState = (state: { data: unknown; isPending: boolean }) =>
    mocks.useSession.mockReturnValue(state);

let visibility: DocumentVisibilityState;

const setVisibility = (value: DocumentVisibilityState) => {
    visibility = value;
    document.dispatchEvent(new Event('visibilitychange'));
};

beforeEach(() => {
    visibility = 'visible';
    vi.spyOn(Document.prototype, 'visibilityState', 'get').mockImplementation(
        () => visibility
    );

    setSessionState({ data: SESSION, isPending: false });
    mocks.getSession.mockResolvedValue(SESSION);
});

afterEach(() => {
    vi.restoreAllMocks();
    mocks.getSession.mockReset();
    mocks.navigate.mockReset();
    mocks.useSession.mockReset();
});

describe('useRefreshSessionCache', () => {
    it('does not refresh on mount', async () => {
        await renderHook(() => useRefreshSessionCache());

        expect(getSession).not.toHaveBeenCalled();
    });

    it('refreshes when the browser comes back online', async () => {
        await renderHook(() => useRefreshSessionCache());

        window.dispatchEvent(new Event('online'));

        expect(getSession).toHaveBeenCalledTimes(1);
    });

    it('refreshes when the tab becomes visible', async () => {
        await renderHook(() => useRefreshSessionCache());

        setVisibility('visible');

        expect(getSession).toHaveBeenCalledTimes(1);
    });

    it('does not refresh when the tab becomes hidden', async () => {
        await renderHook(() => useRefreshSessionCache());

        setVisibility('hidden');

        expect(getSession).not.toHaveBeenCalled();
    });

    it('does not refresh on the offline event', async () => {
        await renderHook(() => useRefreshSessionCache());

        window.dispatchEvent(new Event('offline'));

        expect(getSession).not.toHaveBeenCalled();
    });

    it('refreshes once per event across multiple events', async () => {
        await renderHook(() => useRefreshSessionCache());

        window.dispatchEvent(new Event('online'));
        setVisibility('hidden');
        setVisibility('visible');

        expect(getSession).toHaveBeenCalledTimes(2);
    });

    it('does not re-register listeners on re-render', async () => {
        const addWindow = vi.spyOn(window, 'addEventListener');
        const addDocument = vi.spyOn(document, 'addEventListener');

        const { rerender } = await renderHook(() => useRefreshSessionCache());
        const windowCalls = addWindow.mock.calls.filter(
            ([t]) => t === 'online'
        );
        const documentCalls = addDocument.mock.calls.filter(
            ([t]) => t === 'visibilitychange'
        );

        await rerender();

        expect(
            addWindow.mock.calls.filter(([t]) => t === 'online')
        ).toHaveLength(windowCalls.length);
        expect(
            addDocument.mock.calls.filter(([t]) => t === 'visibilitychange')
        ).toHaveLength(documentCalls.length);
    });

    it('removes both listeners on unmount', async () => {
        const { unmount } = await renderHook(() => useRefreshSessionCache());

        await unmount();
        window.dispatchEvent(new Event('online'));
        setVisibility('visible');

        expect(getSession).not.toHaveBeenCalled();
    });

    it('removes the same handler references it added', async () => {
        const addWindow = vi.spyOn(window, 'addEventListener');
        const removeWindow = vi.spyOn(window, 'removeEventListener');
        const addDocument = vi.spyOn(document, 'addEventListener');
        const removeDocument = vi.spyOn(document, 'removeEventListener');

        const { unmount } = await renderHook(() => useRefreshSessionCache());
        await unmount();

        const find = (spy: typeof addWindow, type: string) =>
            spy.mock.calls.find(([t]) => t === type)?.[1];

        expect(find(addWindow, 'online')).toBeDefined();
        expect(find(removeWindow, 'online')).toBe(find(addWindow, 'online'));
        expect(find(addDocument, 'visibilitychange')).toBeDefined();
        expect(find(removeDocument, 'visibilitychange')).toBe(
            find(addDocument, 'visibilitychange')
        );
    });

    it('does not navigate while the session is pending', async () => {
        setSessionState({ data: undefined, isPending: true });

        await renderHook(() => useRefreshSessionCache());

        expect(mocks.navigate).not.toHaveBeenCalled();
    });

    it('does not navigate when a session exists', async () => {
        await renderHook(() => useRefreshSessionCache());

        expect(mocks.navigate).not.toHaveBeenCalled();
    });

    it.each([
        ['null', null],
        ['undefined', undefined],
    ])('navigates to login when settled with %s data', async (_label, data) => {
        setSessionState({ data, isPending: false });

        await renderHook(() => useRefreshSessionCache());

        expect(mocks.navigate).toHaveBeenCalledTimes(1);
        expect(mocks.navigate).toHaveBeenCalledWith({
            to: '/login',
            search: { redirect: window.location.href },
        });
    });

    it('navigates once loading finishes with no session', async () => {
        setSessionState({ data: undefined, isPending: true });
        const { rerender } = await renderHook(() => useRefreshSessionCache());
        expect(mocks.navigate).not.toHaveBeenCalled();

        setSessionState({ data: null, isPending: false });
        await rerender();

        expect(mocks.navigate).toHaveBeenCalledTimes(1);
    });

    it('navigates when a live session is revoked', async () => {
        const { rerender } = await renderHook(() => useRefreshSessionCache());
        expect(mocks.navigate).not.toHaveBeenCalled();

        setSessionState({ data: null, isPending: false });
        await rerender();

        expect(mocks.navigate).toHaveBeenCalledTimes(1);
    });

    it('does not navigate again on re-render with unchanged state', async () => {
        setSessionState({ data: null, isPending: false });
        const { rerender } = await renderHook(() => useRefreshSessionCache());

        await rerender();
        await rerender();

        expect(mocks.navigate).toHaveBeenCalledTimes(1);
    });

    it('does not navigate when a session appears after loading', async () => {
        setSessionState({ data: undefined, isPending: true });
        const { rerender } = await renderHook(() => useRefreshSessionCache());

        setSessionState({ data: SESSION, isPending: false });
        await rerender();

        expect(mocks.navigate).not.toHaveBeenCalled();
    });
});
