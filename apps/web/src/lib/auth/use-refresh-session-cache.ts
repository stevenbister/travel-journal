import { useNavigate } from '@tanstack/react-router';
import React from 'react';

import { getSession } from './session';
import { useSession } from './use-session';

// Refresh the session so long lived tabs don't hold stale session data
export const useRefreshSessionCache = () => {
    const { data, isPending } = useSession();
    const navigate = useNavigate();

    React.useEffect(() => {
        const refresh = () => void getSession();
        const onVisible = () =>
            document.visibilityState === 'visible' && refresh();

        window.addEventListener('online', refresh);
        document.addEventListener('visibilitychange', onVisible);
        return () => {
            window.removeEventListener('online', refresh);
            document.removeEventListener('visibilitychange', onVisible);
        };
    }, []);

    // If the server revokes the session, the helper clears the row and we land here
    React.useEffect(() => {
        if (!isPending && !data)
            navigate({
                to: '/login',
                search: {
                    redirect: window.location.href,
                },
            });
    }, [isPending, data, navigate]);
};
