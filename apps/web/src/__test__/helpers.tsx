import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    type AnyRouter,
    Outlet,
    RouterProvider,
    createMemoryHistory,
    createRootRoute,
    createRoute,
    createRouter,
} from '@tanstack/react-router';
import * as React from 'react';
import { render } from 'vitest-browser-react';

type Options = {
    paths?: string[];
    initialPath?: string;
};

type RenderWithRouterResult = Awaited<ReturnType<typeof render>> & {
    router: AnyRouter;
};

export const renderWithRouter = async (
    ui: React.ReactNode,
    { paths = [], initialPath = '/' }: Options = {}
): Promise<RenderWithRouterResult> => {
    const rootRoute = createRootRoute({
        component: () => (
            <>
                {ui}
                <Outlet />
            </>
        ),
    });

    const childRoutes = ['/', ...paths]
        .filter((path, i, all) => all.indexOf(path) === i)
        .map((path) =>
            createRoute({
                getParentRoute: () => rootRoute,
                path,
                component: () => null,
            })
        );

    const router = createRouter({
        routeTree: rootRoute.addChildren(childRoutes),
        history: createMemoryHistory({ initialEntries: [initialPath] }),
    });

    const screen = await render(
        <QueryClientProvider client={new QueryClient()}>
            <RouterProvider router={router} />
        </QueryClientProvider>
    );

    return { ...screen, router };
};
