import { differenceInCalendarDays, parseISO } from 'date-fns';

export const getEntryDayNumber = (
    entryDate: string | undefined,
    tripStartDate: string | undefined
): number | undefined => {
    if (!entryDate || !tripStartDate) return undefined;

    return (
        differenceInCalendarDays(parseISO(entryDate), parseISO(tripStartDate)) +
        1
    );
};
