import { type Icon, MapTrifoldIcon } from '@phosphor-icons/react';

import { cn } from '@repo/ui/lib/utils';

type IconBoxProps = {
    Icon?: Icon;
    size?: 'default' | 'sm';
    ref?: React.Ref<HTMLDivElement>;
};

export const IconBox = ({
    Icon = MapTrifoldIcon,
    size = 'default',
    ref,
}: IconBoxProps) => {
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
                'grid place-items-center bg-secondary text-secondary-foreground',
                sizes[size].container,
                sizes[size].radius
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
