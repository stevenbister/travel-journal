import { CalendarBlankIcon } from '@phosphor-icons/react';
import { format } from 'date-fns';
import React from 'react';
import { type DateRange } from 'react-day-picker';

import { Button } from '@repo/ui/components/ui/button';
import { Calendar } from '@repo/ui/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@repo/ui/components/ui/popover';

type DatePickerProps = {
    id: string;
    onSelect: (date: DateRange | undefined) => void;
    ariaInvalid?: boolean;
};

export function DateRangePicker({
    id,
    onSelect,
    ariaInvalid,
}: DatePickerProps) {
    const [date, setDate] = React.useState<DateRange | undefined>(undefined);

    return (
        <Popover>
            <PopoverTrigger
                render={
                    <Button
                        variant="ghost"
                        id={id}
                        className="justify-start font-normal text-base rounded-none border-0 border-b border-input px-0! hover:bg-transparent dark:hover:bg-transparent aria-expanded:bg-transparent aria-expanded:border-b-primary aria-invalid:border-destructive aria-invalid:ring-0"
                        aria-invalid={ariaInvalid}
                        motionProps={{
                            whileTap: undefined,
                        }}
                    >
                        <CalendarBlankIcon data-icon="inline-start" />
                        {date?.from ? (
                            date.to ? (
                                <>
                                    {format(date.from, 'LLL dd, y')} -{' '}
                                    {format(date.to, 'LLL dd, y')}
                                </>
                            ) : (
                                format(date.from, 'LLL dd, y')
                            )
                        ) : (
                            <span className="text-muted-foreground">
                                Pick a date
                            </span>
                        )}
                    </Button>
                }
            />
            <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={(selectedDate) => {
                        setDate(selectedDate);
                        onSelect(selectedDate);
                    }}
                    numberOfMonths={1}
                    className="[--cell-size:--spacing(10)]"
                />
            </PopoverContent>
        </Popover>
    );
}
