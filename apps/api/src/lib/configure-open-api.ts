import type { OpenAPIHono } from '@hono/zod-openapi';
import { Scalar } from '@scalar/hono-api-reference';

import { requireAuth } from '../middleware/require-auth';
import type { AppBindings } from '../types';

export const configureOpenAPI = (app: OpenAPIHono<AppBindings>) => {
    app.doc('/openapi.json', {
        openapi: '3.1.0',
        info: {
            title: 'Where in the World API',
            version: '0.1.0',
            description: 'API for shared travel logs.',
        },
    });

    app.get(
        '/docs',
        requireAuth,
        Scalar(async () => {
            return {
                sources: [
                    { url: '/api/v1/openapi.json', title: 'API v1' },
                    {
                        url: '/api/v1/auth/open-api/generate-schema',
                        title: 'Auth',
                    },
                ],
            };
        })
    );
};
