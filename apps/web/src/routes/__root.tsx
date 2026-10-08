import { Outlet, createRootRoute } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { MotionConfig } from 'motion/react';

import { SPRING_TRANSITION } from '@repo/ui/constants/animation';

import { ThemeProvider } from '../components/providers/theme-provider';

const RootLayout = () => (
    <ThemeProvider>
        <MotionConfig transition={SPRING_TRANSITION} reducedMotion="user">
            <Outlet />
        </MotionConfig>
        <TanStackRouterDevtools position="top-right" />
    </ThemeProvider>
);

export const Route = createRootRoute({
    component: RootLayout,
});
