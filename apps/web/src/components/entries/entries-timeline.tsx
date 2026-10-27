import { PlusIcon } from '@phosphor-icons/react';
import { Link } from '@tanstack/react-router';
import { addDays, compareDesc, format, parseISO } from 'date-fns';
import * as React from 'react';

import { Button } from '@repo/ui/components/ui/button';
import { DrawerTrigger } from '@repo/ui/components/ui/drawer';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemTitle,
} from '@repo/ui/components/ui/item';

import type { Entry } from '../../lib/dexie/types';
import { Empty } from '../empty/empty';
import { useGetTrip } from '../trips/hooks/use-get-trip';
import {
    CreateEntryDrawer,
    createEntryDrawerHandle,
} from './create-entry-drawer';
import { EntryDetails } from './entry-details';
import { useGetEntries } from './hooks/use-get-entries';
import { getEntryDayNumber } from './utils/get-entry-day-number';

const groupEntriesByDay = <T extends { entryDate: string }>(
    entries: T[]
): Map<string, T[]> => {
    const groups = new Map<string, T[]>();

    for (const entry of entries) {
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
                CTA={<CreateEntryDrawer />}
            />
        );
    }

    const timeline = [...groupedEntries];
    const startDate = trip?.startDate ? parseISO(trip.startDate) : undefined;
    const endDate = trip?.endDate ? parseISO(trip.endDate) : undefined;

    // Add missing days to the grouped entries to ensure a continuous timeline
    if (startDate && endDate) {
        let currentDate = startDate;
        while (currentDate <= endDate) {
            const dayKey = format(currentDate, 'yyyy-MM-dd');

            if (!timeline.find(({ date }) => date === dayKey)) {
                timeline.push({
                    date: dayKey,
                    items: [],
                    dayNumber: getEntryDayNumber(dayKey, trip?.startDate),
                });
            }
            currentDate = addDays(currentDate, 1);
        }

        timeline.sort((a, b) =>
            compareDesc(parseISO(b.date), parseISO(a.date))
        );
    }

    return (
        <section className="flex flex-col gap-6 py-2">
            {timeline.map(({ date, items, dayNumber }) => {
                const hasItems = items.length > 0;

                return (
                    <div key={date}>
                        <h3 className="flex gap-2 items-center mb-2">
                            {dayNumber !== undefined && (
                                <span className="text-base">
                                    Day {dayNumber}
                                </span>
                            )}
                            <span className="text-muted-foreground font-sans">
                                {format(parseISO(date), 'PP')}
                            </span>
                        </h3>

                        <ul className="relative flex flex-col gap-2">
                            <li className="absolute inset-s-1.5 -translate-x-0.5 h-full w-px bg-muted-foreground/50" />

                            {hasItems ? (
                                items.map((item) => (
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
                                ))
                            ) : (
                                <EmptyEntry currentDate={parseISO(date)} />
                            )}
                        </ul>
                    </div>
                );
            })}
        </section>
    );
};

const EmptyEntry = ({ currentDate }: { currentDate: Date }) => (
    <li className="grid grid-cols-[auto_auto_1fr] gap-3 items-start py-2">
        <div className="block size-2.5 bg-muted rounded-full mt-1 shrink-0 z-10" />
        <Item variant="dashed" size="sm" className="col-span-2">
            <ItemContent>
                <ItemTitle>No entries for this day</ItemTitle>
            </ItemContent>

            <ItemActions>
                <DrawerTrigger
                    handle={createEntryDrawerHandle}
                    payload={{ defaultDate: currentDate }}
                    render={<Button variant="link" size="sm" />}
                >
                    <PlusIcon /> Add
                </DrawerTrigger>
            </ItemActions>
        </Item>
    </li>
);
