import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { HttpError, api } from '../../../lib/api';

export const MIN_LOCATION_QUERY_LENGTH = 3;

export const useLocationQuery = (query: string) => {
    const trimmed = query.trim();

    const result = useQuery({
        queryKey: ['location', trimmed],
        queryFn: async ({ signal }) => {
            const res = await api.geocode.search({ q: trimmed }, { signal });

            return res;
        },
        enabled: trimmed.length >= MIN_LOCATION_QUERY_LENGTH,
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
            // Don't hammer the geocoder when it tells us to back off.
            if (error instanceof HttpError && error.status === 429)
                return false;
            // A 502 means the upstream geocoder errored; a single retry is
            // reasonable but repeated retries won't help.
            if (error instanceof HttpError && error.status === 502)
                return failureCount < 1;
            return failureCount < 1;
        },
    });

    return result;
};
