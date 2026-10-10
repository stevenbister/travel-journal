import { useParams } from '@tanstack/react-router';

import { BackButton } from '../back-button/back-button';
import { MemberAvatarGroup } from '../member-avatar-group/member-avatar-group';
import { useGetTrip } from './hooks/use-get-trip';
import { TripBadge } from './trip-badge';

export const TripHeader = () => {
    const { tripId } = useParams({ strict: false });
    const { trip } = useGetTrip(tripId!);

    if (!trip) return null;

    const { title, startDate, endDate, members } = trip;

    return (
        <header className="container flex flex-col justify-end gap-6 text-primary-foreground dark:text-card-foreground bg-linear-to-br from-primary to-[hsl(168_55%_13%)] min-h-52">
            <BackButton />

            <div className="flex flex-col gap-1">
                <TripBadge startDate={startDate!} endDate={endDate!} />

                <h1>{title}</h1>

                <MemberAvatarGroup members={members} />
            </div>
        </header>
    );
};
