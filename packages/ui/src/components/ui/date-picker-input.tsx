import { CalendarBlankIcon } from '@phosphor-icons/react';
import { format } from 'date-fns';
import React from 'react';

import { Button } from '@repo/ui/components/ui/button';
import { Calendar } from '@repo/ui/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@repo/ui/components/ui/popover';

type DatePickerProps = {
    id: string;
    onSelect: (_date: Date | undefined) => void;
    ariaInvalid?: boolean;
    defaultValue?: Date | undefined;
};

export function DatePicker({
    id,
    onSelect,
    ariaInvalid,
    defaultValue,
}: DatePickerProps) {
    const [date, setDate] = React.useState<Date | undefined>(defaultValue);

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
                        {date ? (
                            format(date, 'LLL dd, y')
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
                    mode="single"
                    defaultMonth={date}
                    selected={date}
                    onSelect={(selectedDate) => {
                        setDate(selectedDate);
                        onSelect(selectedDate);
                    }}
                    className="[--cell-size:--spacing(10)]"
                />
            </PopoverContent>
        </Popover>
    );
}
