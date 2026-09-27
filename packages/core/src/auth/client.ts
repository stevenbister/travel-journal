import { adminClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export type AuthClient = ReturnType<typeof createAuthClient>;

export const authClient: AuthClient = createAuthClient({
    basePath: '/api/v1/auth',
    plugins: [adminClient()],
});
