import type {
    Entry,
    EntryHistory,
    Trip,
    TripMember,
    User,
} from './dexie/types';

export class NetworkError extends Error {
    constructor(message: string, options?: ErrorOptions) {
        super(message, options);
        this.name = 'NetworkError';
    }
}

export class HttpError extends Error {
    readonly status: number;
    readonly statusText: string;

    constructor(status: number, statusText: string) {
        super(`API error ${status}`);
        this.name = 'HttpError';
        this.status = status;
        this.statusText = statusText;
    }
}

const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
    let res: Response;

    try {
        res = await fetch(`/api/v1${path}`, {
            ...init,
            headers: { 'Content-Type': 'application/json', ...init?.headers },
        });
    } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError')
            throw error;
        throw new NetworkError('Network request failed', { cause: error });
    }

    if (!res.ok) throw new HttpError(res.status, res.statusText);

    return res.json();
};

type Page<R> = {
    rows: R[];
    cursor: string | null;
    hasMore: boolean;
};

export type PullResponse = {
    users: User[];
    tripMembers: TripMember[];
    trips: Page<Trip>;
    entries: Page<Entry>;
    entryHistory: Page<EntryHistory>;
};

export const api = {
    health: (init?: RequestInit) => {
        return apiFetch<{ ok: boolean }>('/health', {
            cache: 'no-store',
            ...init,
        });
    },
    sync: {
        pull: (
            params: { trips?: string; entries?: string; entryHistory?: string },
            init?: RequestInit
        ) => {
            const searchParams = new URLSearchParams();
            for (const [key, value] of Object.entries(params)) {
                if (value !== undefined) searchParams.set(key, value);
            }

            return apiFetch<PullResponse>(`/sync/pull?${searchParams}`, init);
        },
    },
};
