export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        // Proxy API requests to the backend service
        if (url.pathname.startsWith('/api/')) {
            return env.API.fetch(request);
        }

        // Fall through to static assets (handled automatically by the "assets" config + SPA fallback
        return new Response('Not found', { status: 404 });
    },
};
