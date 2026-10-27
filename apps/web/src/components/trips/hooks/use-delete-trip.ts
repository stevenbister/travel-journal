import { useNavigate } from '@tanstack/react-router';

import { toast } from '@repo/ui/components/ui/toast';

import { db } from '../../../lib/dexie/db';

type DeleteTripParams = {
    tripId: string;
};

export const useDeleteTrip = () => {
    const navigate = useNavigate();

    const deleteTrip = async ({ tripId }: DeleteTripParams) => {
        try {
            const updates = {
                isDeleted: true,
                synced: false,
                updatedAt: new Date().toISOString(),
            };

            await db.transaction('rw', db.trips, db.entries, async () => {
                await db.entries.where({ tripId }).modify(updates);
                await db.trips.update(tripId, updates);
            });

            navigate({ to: '/' });
        } catch (error) {
            console.error('Failed to delete trip:', error);
            toast.add({
                title: 'Failed to delete trip',
                description:
                    'An error occurred while trying to delete the trip. Please try again.',
                type: 'error',
            });
        }
    };

    return deleteTrip;
};
