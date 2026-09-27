import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

import { ThemeProvider } from '../components/providers/theme-provider';

const RootLayout = () => (
    <ThemeProvider>
        <Outlet />
        <TanStackRouterDevtools />
    </ThemeProvider>
);

export const Route = createRootRoute({
    component: RootLayout,
});
