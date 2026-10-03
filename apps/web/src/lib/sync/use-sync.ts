import { useQuery } from '@tanstack/react-query';

import { HttpError } from '../api';
import { pull } from './pull';

let running: Promise<void> | null = null;
let rerun = false;

/**
 * Overlapping calls (online event + focus + interval + after-write)
 * collapse into one run, plus one follow-up run if something asked mid-flight.
 */
export const syncNow = (): Promise<void> => {
    if (running !== null) {
        rerun = true;
        return running;
    }

    const executeSync = async () => {
        do {
            rerun = false;
            // await push() // TODO: push first, so local edits are sent before we pull
            await pull();
        } while (rerun);
    };

    running = executeSync().finally(() => {
        running = null;
    });

    return running;
};

export const SYNC_KEY = ['sync'] as const;

export const useSync = () => {
    return useQuery({
        queryKey: SYNC_KEY,
        queryFn: async () => {
            await syncNow();
            return Date.now(); // becomes dataUpdatedAt-friendly "last synced"
        },
        staleTime: 15_000, // focus/reconnect within 15s of the last sync are skipped
        refetchInterval: 60_000, // pauses in background tabs and while offline by default
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        gcTime: Infinity,
        retry: (count, error) =>
            !(error instanceof HttpError && error.status === 401) && count < 3,
    });
};
