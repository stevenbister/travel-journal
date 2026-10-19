import { PlusIcon } from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';
import { compareDesc, format, parseISO } from 'date-fns';
import * as React from 'react';

import { buttonVariants } from '@repo/ui/components/ui/button';
import { HIDE_SHOW_ITEM } from '@repo/ui/constants/animation';

import type { Entry } from '../../lib/dexie/types';
import { Empty } from '../empty/empty';
import { MotionLink } from '../motion-link/motion-link';
import { useGetTrip } from '../trips/hooks/use-get-trip';
import { EntryDetails } from './entry-details';
import { useGetEntries } from './hooks/use-get-entries';
import { getEntryDayNumber } from './utils/get-entry-day-number';

const groupEntriesByDay = <T extends { entryDate: string }>(
    entries: T[]
): Map<string, T[]> => {
    const sorted = [...entries].sort((a, b) =>
        compareDesc(parseISO(a.entryDate), parseISO(b.entryDate))
    );

    const groups = new Map<string, T[]>();

    for (const entry of sorted) {
        const dayKey = format(parseISO(entry.entryDate), 'yyyy-MM-dd');
        const group = groups.get(dayKey);

        if (group) {
            group.push(entry);
        } else {
            groups.set(dayKey, [entry]);
        }
    }

    return groups;
};

type EntriesTimelineProps = {
    tripId: string;
    entries?: Entry[];
};

export const EntriesTimeline = ({
    tripId,
    entries: initialEntries,
}: EntriesTimelineProps) => {
    const { entries } = useGetEntries(tripId, initialEntries);
    const { trip } = useGetTrip(tripId);
    const groupedEntries = React.useMemo(
        () =>
            [...groupEntriesByDay(entries ?? [])].map(([date, items]) => ({
                date,
                items,
                dayNumber: getEntryDayNumber(date, trip?.startDate),
            })),
        [entries, trip?.startDate]
    );

    if (groupedEntries.length === 0) {
        return (
            <Empty
                size="sm"
                heading="No entries"
                description="Add your plans for this trip"
                CTA={
                    <MotionLink
                        to="/trip/$tripId/entry/new"
                        params={{
                            tripId,
                        }}
                        className={buttonVariants({
                            size: 'lg',
                        })}
                        variants={HIDE_SHOW_ITEM}
                    >
                        <PlusIcon /> Create your first entry
                    </MotionLink>
                }
            />
        );
    }

    return (
        <section className="flex flex-col gap-6 py-2">
            {groupedEntries.map(({ date, items, dayNumber }) => (
                <div key={date}>
                    <h3 className="flex gap-2 items-center mb-2">
                        {dayNumber !== undefined && (
                            <span className="text-base">Day {dayNumber}</span>
                        )}
                        <span className="text-muted-foreground font-sans">
                            {format(parseISO(date), 'PP')}
                        </span>
                    </h3>

                    <ul className="relative flex flex-col gap-2">
                        <li className="absolute inset-s-1.5 -translate-x-0.5 h-full w-px bg-muted-foreground/50" />

                        {items.map((item) => (
                            <li key={item.id}>
                                <Link
                                    to="/trip/$tripId/entry/$entryId"
                                    params={{
                                        tripId,
                                        entryId: item.id,
                                    }}
                                    className="grid grid-cols-[auto_auto_1fr] gap-3 items-start py-2"
                                >
                                    <div className="block size-2.5 bg-accent rounded-full mt-1 shrink-0 z-10" />

                                    <EntryDetails entry={item} />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </section>
    );
};
