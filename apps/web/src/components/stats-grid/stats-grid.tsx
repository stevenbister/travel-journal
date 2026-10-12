import { Children, type ReactNode } from 'react';

import { cn } from '@repo/ui/lib/utils';

import { CountUp } from '../count-up/count-up';

const MAX_COLUMNS = 4;

const columnClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
} as const;

type StatsGridProps = {
    children: ReactNode;
    className?: string;
};

export const StatsGrid = ({ className, children }: StatsGridProps) => {
    const items = Children.toArray(children).slice(0, MAX_COLUMNS);
    const count = items.length as keyof typeof columnClasses;

    return (
        <div
            className={cn(
                'grid divide-x divide-border border-y border-border bg-card',
                columnClasses[count],
                className
            )}
        >
            {items}
        </div>
    );
};

type StatsBarItemProps = {
    value: ReactNode;
    label: ReactNode;
    className?: string;
};

export const StatsGridItem = ({
    value,
    label,
    className,
}: StatsBarItemProps) => {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center gap-1.5 p-4',
                className
            )}
        >
            <CountUp
                to={typeof value === 'number' ? value : 0}
                className="font-serif text-xl leading-none text-foreground tabular-nums"
            />

            <span className="text-xs text-muted-foreground">{label}</span>
        </div>
    );
};
