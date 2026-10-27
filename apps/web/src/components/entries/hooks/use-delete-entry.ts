import { useNavigate } from '@tanstack/react-router';

import { toast } from '@repo/ui/components/ui/toast';

import { db } from '../../../lib/dexie/db';

type DeleteEntryParams = {
    tripId: string;
    entryId: string;
};

export const useDeleteEntry = () => {
    const navigate = useNavigate();

    const deleteEntry = async ({ tripId, entryId }: DeleteEntryParams) => {
        try {
            await db.entries.update(entryId, {
                isDeleted: true,
                synced: false,
                updatedAt: new Date().toISOString(),
            });

            navigate({
                to: '/trip/$tripId',
                params: { tripId },
            });
        } catch (error) {
            console.error('Failed to delete entry:', error);
            toast.add({
                title: 'Failed to delete entry',
                description:
                    'An error occurred while trying to delete the entry. Please try again.',
                type: 'error',
            });
        }
    };

    return deleteEntry;
};
