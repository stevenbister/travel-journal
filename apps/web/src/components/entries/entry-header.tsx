import { ClockIcon, MapPinIcon } from '@phosphor-icons/react';
import { format, parseISO } from 'date-fns';

import { Badge } from '@repo/ui/components/ui/badge';

import type { Entry, Trip } from '../../lib/dexie/types';
import { getEntryDayNumber } from './utils/get-entry-day-number';

type EntryHeaderProps = {
    entry: Entry;
    trip: Trip;
};

export const EntryHeader = ({ entry, trip }: EntryHeaderProps) => {
    const dayNumber = getEntryDayNumber(entry?.entryDate, trip?.startDate);

    return (
        <header className="flex flex-col gap-4">
            <div className="container-x flex flex-col gap-1">
                <div className="flex gap-1 text-sm text-muted-foreground">
                    <p>
                        {trip?.title} &bull; Day {dayNumber}
                    </p>
                </div>

                <h1>{entry?.title}</h1>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                        <ClockIcon />
                        <p>{format(parseISO(entry?.entryDate ?? ''), 'p')}</p>
                    </span>

                    <span className="flex items-center gap-0.5">
                        {entry?.location ? (
                            <>
                                <MapPinIcon /> <p>{entry?.location?.name}</p>
                            </>
                        ) : null}
                    </span>
                </div>
            </div>

            <div className="container-x">
                {entry?.tag ? (
                    <Badge variant="accent">{entry?.tag}</Badge>
                ) : null}
            </div>
        </header>
    );
};
