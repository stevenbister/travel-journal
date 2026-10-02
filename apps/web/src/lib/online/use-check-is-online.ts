import { useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';

import { checkIsOnline } from './check-is-online';

const ONLINE_QUERY_KEY = ['isOnline'] as const;

export const useCheckIsOnline = () => {
    const queryClient = useQueryClient();

    React.useEffect(() => {
        const recheck = () => {
            queryClient.invalidateQueries({ queryKey: ONLINE_QUERY_KEY });
        };
        const handleOffline = () => {
            queryClient.setQueryData(ONLINE_QUERY_KEY, false);
        };

        window.addEventListener('online', recheck);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', recheck);
            window.removeEventListener('offline', handleOffline);
        };
    }, [queryClient]);

    return useQuery({
        queryKey: ONLINE_QUERY_KEY,
        queryFn: async () => await checkIsOnline(),
        networkMode: 'always',
        notifyOnChangeProps: ['data'],
        retry: false,
        initialData: false, // Assume offline so we read from the cache initially
    });
};
