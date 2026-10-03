import { configureOpenAPI } from './lib/configure-open-api';
import { createApp } from './lib/create-app';
import { healthCheckRoutes } from './routes/health/health.index';
import { pullRoutes } from './routes/sync/pull/pull.index';

const app = createApp();

app.openapiRoutes([...healthCheckRoutes, ...pullRoutes] as const);

configureOpenAPI(app);

export default app;
