import { ClockIcon } from '@phosphor-icons/react';
import { formatDistance, isEqual, parseISO } from 'date-fns';

import { cn } from '@repo/ui/lib/utils';

type ByLineProps = {
    author: string;
    createdAt: string;
    updatedAt: string;
    className?: string;
};

export const ByLine = ({
    author,
    createdAt,
    updatedAt,
    className,
}: ByLineProps) => {
    const now = new Date();
    const createdAtDate = parseISO(createdAt);
    const updatedAtDate = parseISO(updatedAt);
    const isEdited = !isEqual(createdAtDate, updatedAtDate);

    const getEditedDate = (date: Date) => {
        return formatDistance(date, now, {
            addSuffix: true,
        });
    };

    return (
        <aside
            className={cn(
                'flex gap-2 items-center container border-t text-muted-foreground',
                className
            )}
        >
            <ClockIcon />

            <p className="text-sm">
                Created by {author},{' '}
                {isEdited
                    ? `(edited ${getEditedDate(updatedAtDate)})`
                    : getEditedDate(createdAtDate)}
            </p>
        </aside>
    );
};
