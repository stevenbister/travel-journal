import { useCheckIsOnline } from '../../lib/online/use-check-is-online';

export const NetworkBanner = () => {
    const { data: isOnline } = useCheckIsOnline();

    if (isOnline) return null;

    return (
        <div className="bg-card text-center p-0.5">
            <p className="text-card-foreground text-xs">
                You are currently offline
            </p>
        </div>
    );
};
