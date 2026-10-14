import { compareDesc, format, parseISO } from 'date-fns';
import * as React from 'react';

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

export const EntriesTimeline = ({ tripId }: { tripId: string }) => {
    const { entries } = useGetEntries(tripId);
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

    return (
        <div className="flex flex-col gap-6 py-2">
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
                            <li
                                key={item.id}
                                className="grid grid-cols-[auto_auto_1fr] gap-3 items-start py-2"
                            >
                                <div className="block size-2.5 bg-accent rounded-full mt-1 shrink-0 z-10" />

                                <EntryDetails entry={item} />
                            </li>
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};
