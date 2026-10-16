import { PlusIcon } from '@phosphor-icons/react';
import type { ComponentProps } from 'react';

import { buttonVariants } from '@repo/ui/components/ui/button';
import { cn } from '@repo/ui/lib/utils';

import { MotionLink } from '../motion-link/motion-link';

type FloatingActionButtonProps = ComponentProps<typeof MotionLink> & {
    className?: string;
};

export const FloatingActionButton = ({
    className,
    ...rest
}: FloatingActionButtonProps) => {
    return (
        <MotionLink
            {...rest}
            className={cn(
                buttonVariants({ size: 'icon-lg' }),
                'fixed bottom-4 inset-e-4 bg-accent text-foreground hover:bg-accent/80 rounded-full size-13 drop-shadow-sm drop-shadow-accent/50',
                className
            )}
        >
            <PlusIcon weight="bold" className="size-5" />
            <span className="sr-only">Add</span>
        </MotionLink>
    );
};
