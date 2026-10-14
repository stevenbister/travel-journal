import {
    BowlFoodIcon,
    HouseIcon,
    type Icon,
    MapPinIcon,
    SynagogueIcon,
    TrainSimpleIcon,
} from '@phosphor-icons/react';
import { format, parseISO } from 'date-fns';

import type { Entry } from '../../lib/dexie/types';
import { IconBox } from '../icon-box/icon-box';

type EntryDetailsProps = {
    entry: Entry;
    dateType?: 'time' | 'date';
};

export const EntryDetails = ({
    entry,
    dateType = 'time',
}: EntryDetailsProps) => {
    const { entryDate, title, location, tag } = entry;
    const tagIconMap: Record<string, Icon> = {
        // TODO: Add more tag-icon mappings as needed (need to decide how best to handle this so it's scalable)
        food: BowlFoodIcon,
        sights: SynagogueIcon,
        transport: TrainSimpleIcon,
        accommodation: HouseIcon,
    };

    const getFormattedDate = () => {
        if (dateType === 'time') return format(parseISO(entryDate), 'p');

        return format(parseISO(entryDate), 'PP');
    };

    return (
        <>
            <IconBox
                size="sm"
                Icon={tag ? (tagIconMap[tag] ?? MapPinIcon) : MapPinIcon}
                className="shrink-0"
            />

            <div className="flex flex-col gap-px">
                <p className="text-muted-foreground text-xs">
                    {getFormattedDate()}
                </p>

                <h4 className="font-display text-base">{title}</h4>

                <p className="flex gap-px items-center text-muted-foreground text-xs">
                    <MapPinIcon weight="duotone" /> {location?.name ?? ''}
                </p>
            </div>
        </>
    );
};
