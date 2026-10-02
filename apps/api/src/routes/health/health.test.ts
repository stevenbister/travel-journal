import { env } from 'cloudflare:workers';

import app from '../../index';

vi.mock('../../lib/configure-better-auth');

describe('Health', () => {
    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('returns ok', async () => {
        const response = await app.request('/api/v1/health', {}, env);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ ok: true });
    });
});
