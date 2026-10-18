import { MagnifyingGlassIcon, MapPinIcon } from '@phosphor-icons/react';
import * as React from 'react';

import { Button } from '@repo/ui/components/ui/button';
import {
    Drawer,
    DrawerContent,
    DrawerTrigger,
} from '@repo/ui/components/ui/drawer';
import {
    Field,
    FieldContent,
    FieldDescription,
    FieldLabel,
    FieldTitle,
} from '@repo/ui/components/ui/field';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@repo/ui/components/ui/input-group';
import { RadioGroup, RadioGroupItem } from '@repo/ui/components/ui/radio-group';
import { toast } from '@repo/ui/components/ui/toast';
import { cn } from '@repo/ui/lib/utils';

import { HttpError } from '../../lib/api';
import type { Place } from '../../lib/dexie/types';
import { genericErrorToast } from '../../lib/generic-error-toast';
import { useLocationQuery } from './hooks/use-location-query';

export type LocationSearchProps = {
    id: string;
    onLocationSelect: (_location: Place) => void;
};

export const LocationSearch = ({
    id,
    onLocationSelect,
}: LocationSearchProps) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [value, setValue] = React.useState('');
    const [query, setQuery] = React.useState('');
    const [selectedLocation, setSelectedLocation] =
        React.useState<Place | null>(null);

    const { data, error } = useLocationQuery(query);

    if (error && error instanceof HttpError) {
        if (error.status === 429) {
            toast.add({
                title: 'Search is busy',
                description:
                    'The location search is rate limited. Please wait a moment and try again.',
                type: 'warning',
            });
            return;
        }

        if (error.status === 502) {
            toast.add({
                title: 'Search unavailable',
                description:
                    'The location search is temporarily unavailable. Please try again later.',
                type: 'error',
            });
            return;
        }
    } else if (error) {
        genericErrorToast();
    }

    const hasResults = data && (data.locations ?? []).length > 0;

    return (
        <Drawer open={isOpen} onOpenChange={setIsOpen} showSwipeHandle>
            <DrawerTrigger
                render={
                    <Button
                        id={id}
                        variant="outline"
                        className={cn(
                            'justify-start',
                            !selectedLocation && 'text-muted-foreground'
                        )}
                        motionProps={{
                            whileTap: undefined,
                        }}
                    />
                }
            >
                <MapPinIcon className="text-accent" />
                {selectedLocation?.name ?? 'Location'}
            </DrawerTrigger>

            <DrawerContent className="container h-[50vh]">
                <InputGroup>
                    <InputGroupInput
                        placeholder="Search a place"
                        type="search"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyUp={(e) => {
                            if (e.key === 'Enter') {
                                setQuery(e.currentTarget.value);
                            }
                        }}
                    />
                    <InputGroupAddon align="inline-end">
                        <InputGroupButton
                            aria-label="Copy"
                            title="Copy"
                            size="icon-sm"
                            onClick={() => {
                                setQuery(value);
                            }}
                        >
                            <MagnifyingGlassIcon weight="duotone" />
                        </InputGroupButton>
                    </InputGroupAddon>
                </InputGroup>

                <div className="flex-1 overflow-y-auto py-4">
                    {hasResults ? (
                        <RadioGroup
                            value={selectedLocation}
                            onValueChange={(location) => {
                                setSelectedLocation(location);
                                onLocationSelect(location);
                                setIsOpen(false);
                            }}
                            className="max-w-sm"
                        >
                            {data.locations.map((location) => (
                                <FieldLabel
                                    key={location.osmId}
                                    htmlFor={`location-${location.osmId}`}
                                >
                                    <Field orientation="horizontal">
                                        <FieldContent>
                                            <FieldTitle>
                                                {location.name}
                                            </FieldTitle>
                                            <FieldDescription>
                                                {location.displayName}
                                            </FieldDescription>
                                        </FieldContent>

                                        <RadioGroupItem
                                            value={location}
                                            id={`location-${location.osmId}`}
                                        />
                                    </Field>
                                </FieldLabel>
                            ))}
                        </RadioGroup>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            No results found.
                        </p>
                    )}
                </div>
            </DrawerContent>
        </Drawer>
    );
};
