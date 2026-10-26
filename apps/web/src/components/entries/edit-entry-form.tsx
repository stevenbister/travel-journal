import { ClockIcon } from '@phosphor-icons/react';
import { useForm } from '@tanstack/react-form';
import { format } from 'date-fns';
import * as React from 'react';
import z from 'zod';

import { wait } from '@repo/core/utils/wait';

import { Button } from '@repo/ui/components/ui/button';
import { DatePicker } from '@repo/ui/components/ui/date-picker-input';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@repo/ui/components/ui/field';
import { Input } from '@repo/ui/components/ui/input';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
} from '@repo/ui/components/ui/input-group';
import { Spinner } from '@repo/ui/components/ui/spinner';
import { Textarea } from '@repo/ui/components/ui/textarea';
import { toast } from '@repo/ui/components/ui/toast';
import { HIDE_SHOW_ITEM } from '@repo/ui/constants/animation';

import { db } from '../../lib/dexie/db';
import type { EntryWithAuthor } from '../../lib/dexie/types';
import { BadgeSelector } from '../badge-selector/badge-selector';
import { LocationSearch } from '../location-search/location-search';
import { useGetEntry } from './hooks/use-get-entry';
import { TAGS_LIST } from './tags-list';

const placeSchema = z.object({
    osmType: z.string().nullable(),
    osmId: z.number().nullable(),
    displayName: z.string(),
    name: z.string().nullable(),
    lat: z.number(),
    lng: z.number(),
    category: z.string().nullable(),
    type: z.string().nullable(),
    locality: z.string().nullable(),
    country: z.string().nullable(),
    countryCode: z.string().nullable(),
    boundingBox: z
        .tuple([z.string(), z.string(), z.string(), z.string()])
        .nullable(),
});

const formSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    notes: z.string().optional(),
    date: z.date(),
    time: z.string(),
    location: placeSchema.optional(),
    tag: z.string().optional(),
});
type FormInput = z.input<typeof formSchema>;

type EditEntryFormProps = {
    entryId: string;
    onSubmit: () => void;
};

type EditEntryFormFieldsProps = {
    entry: NonNullable<EntryWithAuthor>;
    onSubmit: () => void;
};

export const EditEntryForm = ({ entryId, onSubmit }: EditEntryFormProps) => {
    const { entry, isPending } = useGetEntry(entryId);

    if (isPending) {
        return <p>Loading entry...</p>;
    }

    if (!entry) {
        return <p>Entry not found</p>;
    }

    return <EditEntryFormFields entry={entry} onSubmit={onSubmit} />;
};

const EditEntryFormFields = ({ entry, onSubmit }: EditEntryFormFieldsProps) => {
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    // Split the date and time from the entry's datetime if available
    const entryDate = entry.entryDate ? new Date(entry.entryDate) : new Date();
    const entryTime = entry.entryDate ? format(entry.entryDate, 'HH:mm') : '';

    const defaultValues: FormInput = {
        title: entry.title ?? '',
        notes: entry.notes ?? '',
        date: entryDate,
        time: entryTime,
        location: entry.location ?? undefined,
        tag: entry.tag ?? '',
    };

    const handleSubmit = async ({ value }: { value: FormInput }) => {
        setIsSubmitting(true);

        const entryDate: Date = new Date(value.date);
        if (value.time) {
            const [hours, minutes] = value.time.split(':').map(Number);
            entryDate.setHours(hours ?? 0, minutes);
        }

        try {
            await db.entries.update(entry.id, {
                title: value.title,
                notes: value.notes,
                entryDate: entryDate.toISOString(),
                location: value.location,
                tag: value.tag,
                synced: false,
                updatedAt: new Date().toISOString(),
            });

            await wait(500);
            onSubmit();
        } catch (error) {
            console.error('Failed to update entry:', error);
            toast.add({
                title: 'Failed to update entry',
                description: 'Please try again later.',
                type: 'error',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const form = useForm({
        defaultValues,
        validators: {
            onChange: formSchema,
        },
        onSubmit: handleSubmit,
    });

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
            }}
            className="flex flex-col gap-4 h-full pb-12"
        >
            <FieldGroup>
                <form.Field name="title">
                    {(field) => {
                        const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;

                        return (
                            <Field data-invalid={isInvalid}>
                                <FieldLabel
                                    htmlFor={field.name}
                                    className="text-muted-foreground"
                                >
                                    Entry name
                                </FieldLabel>
                                <Input
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                        field.handleChange(e.target.value)
                                    }
                                    aria-invalid={isInvalid}
                                    placeholder="Lunch at the the floating market"
                                    autoComplete="off"
                                />
                                {isInvalid && (
                                    <FieldError
                                        errors={field.state.meta.errors}
                                    />
                                )}
                            </Field>
                        );
                    }}
                </form.Field>
            </FieldGroup>

            <FieldGroup className="flex-row gap-4">
                <form.Field name="date">
                    {(field) => {
                        const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;

                        return (
                            <Field data-invalid={isInvalid}>
                                <FieldLabel
                                    htmlFor={field.name}
                                    className="text-muted-foreground"
                                >
                                    Day
                                </FieldLabel>
                                <DatePicker
                                    id={field.name}
                                    onSelect={(date) => {
                                        if (!date) return;
                                        return field.handleChange(date);
                                    }}
                                    ariaInvalid={isInvalid}
                                    defaultValue={field.state.value}
                                />
                                {isInvalid && (
                                    <FieldError
                                        errors={field.state.meta.errors}
                                    />
                                )}
                            </Field>
                        );
                    }}
                </form.Field>

                <form.Field name="time">
                    {(field) => {
                        const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;

                        return (
                            <Field data-invalid={isInvalid}>
                                <FieldLabel
                                    htmlFor={field.name}
                                    className="text-muted-foreground"
                                >
                                    Time
                                </FieldLabel>

                                <InputGroup>
                                    <InputGroupInput
                                        type="time"
                                        id={field.name}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        aria-invalid={isInvalid}
                                        className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                                    />
                                    <InputGroupAddon>
                                        <ClockIcon />
                                    </InputGroupAddon>
                                </InputGroup>

                                {isInvalid && (
                                    <FieldError
                                        errors={field.state.meta.errors}
                                    />
                                )}
                            </Field>
                        );
                    }}
                </form.Field>
            </FieldGroup>

            <FieldGroup>
                <form.Field name="location">
                    {(field) => {
                        const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;

                        return (
                            <Field data-invalid={isInvalid}>
                                <FieldLabel
                                    htmlFor={field.name}
                                    className="text-muted-foreground"
                                >
                                    Location
                                </FieldLabel>

                                <LocationSearch
                                    id={field.name}
                                    value={field.state.value ?? null}
                                    onLocationSelect={(location) =>
                                        field.handleChange(location)
                                    }
                                />

                                {isInvalid && (
                                    <FieldError
                                        errors={field.state.meta.errors}
                                    />
                                )}
                            </Field>
                        );
                    }}
                </form.Field>
            </FieldGroup>

            <FieldGroup>
                <form.Field name="tag">
                    {(field) => {
                        const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;

                        return (
                            <Field data-invalid={isInvalid}>
                                <FieldLabel
                                    htmlFor={field.name}
                                    className="text-muted-foreground"
                                >
                                    Tags
                                </FieldLabel>

                                <BadgeSelector
                                    items={Object.keys(TAGS_LIST)}
                                    value={[field.state.value ?? '']}
                                    onValueChange={(tag) => {
                                        field.handleChange(tag.join(', '));
                                    }}
                                />

                                {isInvalid && (
                                    <FieldError
                                        errors={field.state.meta.errors}
                                    />
                                )}
                            </Field>
                        );
                    }}
                </form.Field>
            </FieldGroup>

            <FieldGroup>
                <form.Field name="notes">
                    {(field) => {
                        const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;

                        return (
                            <Field data-invalid={isInvalid}>
                                <FieldLabel
                                    htmlFor={field.name}
                                    className="text-muted-foreground"
                                >
                                    Notes
                                </FieldLabel>
                                <Textarea
                                    id={field.name}
                                    name={field.name}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) =>
                                        field.handleChange(e.target.value)
                                    }
                                    aria-invalid={isInvalid}
                                    placeholder="Two weeks in Japan"
                                    autoComplete="off"
                                />
                                {isInvalid && (
                                    <FieldError
                                        errors={field.state.meta.errors}
                                    />
                                )}
                            </Field>
                        );
                    }}
                </form.Field>
            </FieldGroup>

            <form.Subscribe
                selector={({ canSubmit, isPristine, isSubmitted }) => ({
                    canSubmit,
                    isPristine,
                    isSubmitted,
                })}
            >
                {({ canSubmit, isPristine, isSubmitted }) => {
                    const isDisabled = !canSubmit || isPristine;
                    return (
                        <Button
                            type="submit"
                            className="mt-auto md:mt-0"
                            disabled={isDisabled}
                            motionProps={{
                                variants: {
                                    ...(isDisabled
                                        ? {
                                              ...HIDE_SHOW_ITEM,
                                              show: {
                                                  ...HIDE_SHOW_ITEM.show,
                                                  opacity: 0.5,
                                              },
                                          }
                                        : HIDE_SHOW_ITEM),
                                },
                            }}
                        >
                            {isSubmitting ? <Spinner /> : null}
                            {!isSubmitting && isSubmitted
                                ? 'Changes saved!'
                                : ''}
                            {isSubmitting ? 'Saving' : 'Save changes'}
                        </Button>
                    );
                }}
            </form.Subscribe>
        </form>
    );
};
