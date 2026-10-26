import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { makeEntry } from '../../../__fixtures__/entries';
import { makeTrip } from '../../../__fixtures__/trips';
import { db } from '../../../lib/dexie/db';
import { useDeleteTrip } from './use-delete-trip';

const NOW = new Date(2026, 9, 9, 12, 0, 0);

const { navigateMock, toastAddMock } = vi.hoisted(() => ({
    navigateMock: vi.fn(),
    toastAddMock: vi.fn(),
}));

vi.mock('@tanstack/react-router', async (importOriginal) => ({
    ...(await importOriginal<typeof import('@tanstack/react-router')>()),
    useNavigate: () => navigateMock,
}));

vi.mock('@repo/ui/components/ui/toast', async (importOriginal) => {
    const actual =
        await importOriginal<typeof import('@repo/ui/components/ui/toast')>();
    return { ...actual, toast: { ...actual.toast, add: toastAddMock } };
});

const deleteTrip = async (tripId: string) => {
    const { result } = await renderHook(() => useDeleteTrip());
    await result.current({ tripId });
};

describe('useDeleteTrip', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(NOW);

        await Promise.all([
            db.trips.clear(),
            db.entries.clear(),
        ]);

        await db.trips.bulkAdd([makeTrip('t1', 8, 12), makeTrip('t2', 8, 12)]);
        await db.entries.bulkAdd([
            makeEntry('t1-e1', 't1'),
            makeEntry('t1-e2', 't1', { isDeleted: true }),
            makeEntry('t2-e1', 't2'),
        ]);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('marks the trip and all of its entries deleted and unsynced with a fresh updatedAt', async () => {
        await deleteTrip('t1');

        expect(await db.trips.get('t1')).toMatchObject({
            isDeleted: true,
            synced: false,
            updatedAt: NOW.toISOString(),
        });

        for (const id of ['t1-e1', 't1-e2']) {
            expect(await db.entries.get(id)).toMatchObject({
                tripId: 't1',
                isDeleted: true,
                synced: false,
                updatedAt: NOW.toISOString(),
            });
        }
    });

    it('leaves other trips and their entries untouched', async () => {
        await deleteTrip('t1');

        expect(await db.trips.get('t2')).toMatchObject({
            isDeleted: false,
            synced: true,
            updatedAt: makeTrip('t2', 8, 12).updatedAt,
        });
        expect(await db.entries.get('t2-e1')).toMatchObject({
            isDeleted: false,
            synced: true,
        });
    });

    it('navigates to the trips list after deleting', async () => {
        await deleteTrip('t1');

        expect(navigateMock).toHaveBeenCalledWith({ to: '/' });
    });

    it('shows a toast and changes nothing when the delete fails', async () => {
        vi.spyOn(db, 'transaction').mockRejectedValueOnce(
            new Error('transaction failed')
        );

        await deleteTrip('t1');

        expect(navigateMock).not.toHaveBeenCalled();
        expect(toastAddMock).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Failed to delete trip',
                type: 'error',
            })
        );

        // Rolled back: nothing was marked deleted
        expect(await db.trips.get('t1')).toMatchObject({
            isDeleted: false,
            synced: true,
        });
        expect(await db.entries.get('t1-e1')).toMatchObject({
            isDeleted: false,
            synced: true,
        });
    });
});
