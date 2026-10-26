import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';

import { makeEntry } from '../../../__fixtures__/entries';
import { makeTrip } from '../../../__fixtures__/trips';
import { db } from '../../../lib/dexie/db';
import { useDeleteEntry } from './use-delete-entry';

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

const deleteEntry = async (tripId: string, entryId: string) => {
    const { result } = await renderHook(() => useDeleteEntry());
    await result.current({ tripId, entryId });
};

describe('useDeleteEntry', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(NOW);

        await Promise.all([db.trips.clear(), db.entries.clear()]);

        await db.trips.bulkAdd([makeTrip('t1', 8, 12)]);
        await db.entries.bulkAdd([
            makeEntry('t1-e1', 't1'),
            makeEntry('t1-e2', 't1', { isDeleted: true }),
        ]);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('marks the entry deleted and unsynced with a fresh updatedAt', async () => {
        await deleteEntry('t1', 't1-e1');

        expect(await db.entries.get('t1-e1')).toMatchObject({
            tripId: 't1',
            isDeleted: true,
            synced: false,
            updatedAt: NOW.toISOString(),
        });
    });

    it('leaves other entries untouched', async () => {
        await deleteEntry('t1', 't1-e1');

        expect(await db.entries.get('t1-e2')).toMatchObject({
            isDeleted: true,
            synced: true,
            updatedAt: '2026-10-01T12:00:00.000Z',
        });
    });

    it('navigates back to the entrys trip after deleting', async () => {
        await deleteEntry('t1', 't1-e1');

        expect(navigateMock).toHaveBeenCalledWith({
            to: '/trip/$tripId',
            params: { tripId: 't1' },
        });
    });

    it('shows a toast and changes nothing when the delete fails', async () => {
        vi.spyOn(db.entries, 'update').mockRejectedValueOnce(
            new Error('update failed')
        );

        await deleteEntry('t1', 't1-e1');

        expect(navigateMock).not.toHaveBeenCalled();
        expect(toastAddMock).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Failed to delete entry',
                type: 'error',
            })
        );

        // Rolled back: the entry was not marked deleted
        expect(await db.entries.get('t1-e1')).toMatchObject({
            isDeleted: false,
            synced: true,
        });
    });
});
