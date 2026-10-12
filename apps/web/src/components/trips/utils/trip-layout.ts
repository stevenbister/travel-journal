export const tripLayoutIds = (tripId: string) =>
    ({
        container: `trip-${tripId}`,
        badge: `trip-badge-${tripId}`,
        title: `trip-title-${tripId}`,
        members: `trip-members-${tripId}`,
    }) as const;

export type TripLayoutIds = ReturnType<typeof tripLayoutIds>;
