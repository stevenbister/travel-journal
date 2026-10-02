import { HttpError, NetworkError, api } from '../api';

const isConnectivityError = (error: unknown): boolean =>
    error instanceof NetworkError ||
    (error instanceof HttpError && error.status >= 500);

export const checkIsOnline = async (timeoutMs = 5000) => {
    if (!navigator.onLine) return false;

    // Navigator.onLine isn't reliable for detecting actual connectivity
    // So we attempt to make an actual network request to determine connectivity.
    // https://developer.mozilla.org/en-US/docs/Web/API/Navigator/onLine
    try {
        await api.health({ signal: AbortSignal.timeout(timeoutMs) });

        return true;
    } catch (error) {
        if (error instanceof DOMException && error.name === 'TimeoutError') {
            return false;
        }

        return !isConnectivityError(error);
    }
};
