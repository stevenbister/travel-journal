import {
    BowlFoodIcon,
    HouseIcon,
    type Icon,
    MapPinIcon,
    SynagogueIcon,
    TrainSimpleIcon,
} from '@phosphor-icons/react';
import { compareDesc, format, parseISO } from 'date-fns';
import * as React from 'react';

import type { Entry } from '../../lib/dexie/types';
import { IconBox } from '../icon-box/icon-box';
import { useGetEntries } from './hooks/use-get-entries';

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
    const groupedEntries = React.useMemo(
        () =>
            [...groupEntriesByDay(entries ?? [])].map(([date, items]) => ({
                date,
                items,
            })),
        [entries]
    );

    return (
        <div className="flex flex-col gap-6 py-2">
            {groupedEntries.map(({ date, items }, index) => (
                <div key={date}>
                    <h3 className="flex gap-2 items-center mb-2">
                        <span className="text-base">
                            Day {groupedEntries.length - index}
                        </span>
                        <span className="text-muted-foreground font-sans">
                            {format(parseISO(date), 'PP')}
                        </span>
                    </h3>

                    <ul className="relative flex flex-col gap-2">
                        <li className="absolute inset-s-1.5 -translate-x-0.5 h-full w-px bg-muted-foreground/50" />

                        {items.map((item) => (
                            <EntryItem key={item.id} entry={item} />
                        ))}
                    </ul>
                </div>
            ))}
        </div>
    );
};

type EntryItemProps = {
    entry: Entry;
};

const EntryItem = ({ entry }: EntryItemProps) => {
    const { note, entryDate, lat, lng, tag } = entry;

    const tagIconMap: Record<string, Icon> = {
        // TODO: Add more tag-icon mappings as needed (need to decide how best to handle this so it's scalable)
        food: BowlFoodIcon,
        sights: SynagogueIcon,
        transport: TrainSimpleIcon,
        accommodation: HouseIcon,
    };

    return (
        <li className="grid grid-cols-[auto_auto_1fr] gap-3 items-start py-2">
            <div className="block size-2.5 bg-accent rounded-full mt-1 shrink-0 z-10" />

            <IconBox
                size="sm"
                Icon={tag ? (tagIconMap[tag] ?? MapPinIcon) : MapPinIcon}
                className="shrink-0"
            />

            <div className="flex flex-col gap-px">
                <p className="text-muted-foreground text-xs">
                    {format(parseISO(entryDate), 'p')}
                </p>

                <h4 className="font-display text-base">{note}</h4>

                <p className="flex gap-px items-center text-muted-foreground text-xs">
                    {/* TODO: Once geocoding is implemented, replace lat/lng with the actual location name */}
                    <MapPinIcon weight="duotone" /> {lat}, {lng}
                </p>
            </div>
        </li>
    );
};
