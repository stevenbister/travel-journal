import { type Icon, MapTrifoldIcon } from '@phosphor-icons/react';

import { cn } from '@repo/ui/lib/utils';

type IconBoxProps = {
    Icon?: Icon;
    size?: 'default' | 'sm';
    variant?: 'default' | 'accent';
    className?: string;
    ref?: React.Ref<HTMLDivElement>;
};

export const IconBox = ({
    Icon = MapTrifoldIcon,
    size = 'default',
    variant = 'default',
    className,
    ref,
}: IconBoxProps) => {
    const variants = {
        default: 'bg-secondary text-secondary-foreground',
        accent: 'bg-accent text-accent-foreground',
    };

    const sizes = {
        default: {
            container: 'size-28',
            icon: 'size-12',
            radius: 'rounded-xl',
        },
        sm: {
            container: 'size-14',
            icon: 'size-7',
            radius: 'rounded-md',
        },
    };

    return (
        <div
            ref={ref}
            className={cn(
                'grid place-items-center',
                variants[variant],
                sizes[size].container,
                sizes[size].radius,
                className
            )}
        >
            <Icon
                weight="duotone"
                aria-hidden="true"
                className={sizes[size].icon}
            />
        </div>
    );
};
