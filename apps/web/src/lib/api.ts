const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
    const res = await fetch(`/api/v1${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...init,
    });
    if (!res.ok) throw new Error(`API error ${res.status}`);
    return res.json();
};

export const api = {
    health: () => apiFetch('/health'),
};
