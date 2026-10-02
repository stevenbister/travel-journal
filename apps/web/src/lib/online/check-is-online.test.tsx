import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HttpError, NetworkError, api } from '../api';
import { checkIsOnline } from './check-is-online';

vi.mock('../api', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../api')>();

    return {
        ...actual,
        api: { health: vi.fn() },
    };
});

const healthMock = vi.mocked(api.health);

const setNavigatorOnline = (value: boolean) => {
    return vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(value);
};

describe('checkIsOnline', () => {
    beforeEach(() => {
        setNavigatorOnline(true);
        healthMock.mockResolvedValue({ ok: true });
    });

    afterEach(() => {
        vi.restoreAllMocks();
        healthMock.mockReset();
    });

    it('returns false without making a request when the browser reports offline', async () => {
        setNavigatorOnline(false);

        await expect(checkIsOnline()).resolves.toBe(false);
        expect(healthMock).not.toHaveBeenCalled();
    });

    it('returns true when the health request succeeds', async () => {
        await expect(checkIsOnline()).resolves.toBe(true);
        expect(healthMock).toHaveBeenCalledTimes(1);
    });

    it('passes an AbortSignal to the health request', async () => {
        await checkIsOnline();

        expect(healthMock).toHaveBeenCalledWith({
            signal: expect.any(AbortSignal),
        });
    });

    it('uses the default 5000ms timeout', async () => {
        const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');

        await checkIsOnline();

        expect(timeoutSpy).toHaveBeenCalledWith(5000);
    });

    it('uses a custom timeout when provided', async () => {
        const timeoutSpy = vi.spyOn(AbortSignal, 'timeout');

        await checkIsOnline(1234);

        expect(timeoutSpy).toHaveBeenCalledWith(1234);
    });

    it('returns false on a NetworkError', async () => {
        healthMock.mockRejectedValue(
            new NetworkError('Network request failed')
        );

        await expect(checkIsOnline()).resolves.toBe(false);
    });

    it('returns false when the request times out', async () => {
        healthMock.mockRejectedValue(
            new DOMException('The operation timed out.', 'TimeoutError')
        );

        await expect(checkIsOnline()).resolves.toBe(false);
    });

    it.each([500, 502, 503, 504])(
        'returns false on an HTTP %i response',
        async (status) => {
            healthMock.mockRejectedValue(new HttpError(status, 'Server Error'));

            await expect(checkIsOnline()).resolves.toBe(false);
        }
    );

    it.each([400, 401, 403, 404, 429])(
        'returns true on an HTTP %i response',
        async (status) => {
            healthMock.mockRejectedValue(new HttpError(status, 'Client Error'));

            await expect(checkIsOnline()).resolves.toBe(true);
        }
    );

    it('returns true on an unrelated error (e.g. a JSON parse failure)', async () => {
        healthMock.mockRejectedValue(
            new SyntaxError('Unexpected end of JSON input')
        );

        await expect(checkIsOnline()).resolves.toBe(true);
    });
});
