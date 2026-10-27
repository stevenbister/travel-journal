import { useForm } from '@tanstack/react-form';
import * as React from 'react';
import z from 'zod';

import { wait } from '@repo/core/utils/wait';

import { Button } from '@repo/ui/components/ui/button';
import { DateRangePicker } from '@repo/ui/components/ui/date-range-picker-input';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@repo/ui/components/ui/field';
import { Input } from '@repo/ui/components/ui/input';
import { Spinner } from '@repo/ui/components/ui/spinner';
import { toast } from '@repo/ui/components/ui/toast';
import { HIDE_SHOW_ITEM } from '@repo/ui/constants/animation';

import { db } from '../../lib/dexie/db';
import type { TripWithDetails } from '../../lib/dexie/types';
import { UserPicker } from '../user-picker/user-picker';
import { useGetTrip } from './hooks/use-get-trip';

const dateRangeSchema = z
    .object({
        from: z.date().optional(),
        to: z.date().optional(),
    })
    .refine((r): r is { from: Date; to: Date } => !!r.from && !!r.to, {
        message: 'Select a start and end date',
        abort: true,
    });

const formSchema = z.object({
    tripName: z.string().min(1, 'Trip name is required'),
    dates: dateRangeSchema,
    tripMembers: z
        .array(z.string())
        .min(1, 'At least one trip member is required'),
});
type FormInput = z.input<typeof formSchema>;

type EditTripFormProps = {
    tripId: string;
    onSubmit: () => void;
};

type EditTripFormFieldsProps = {
    trip: NonNullable<TripWithDetails>;
    onSubmit: () => void;
};

export const EditTripForm = ({ tripId, onSubmit }: EditTripFormProps) => {
    const { trip, isPending } = useGetTrip(tripId);

    if (isPending) {
        return <p>Loading trip…</p>;
    }

    if (!trip) {
        return <p>Trip not found</p>;
    }

    return <EditTripFormFields trip={trip} onSubmit={onSubmit} />;
};

const EditTripFormFields = ({ trip, onSubmit }: EditTripFormFieldsProps) => {
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const defaultValues: FormInput = {
        tripName: trip.title,
        dates: {
            from: trip.startDate ? new Date(trip.startDate) : undefined,
            to: trip.endDate ? new Date(trip.endDate) : undefined,
        },
        tripMembers: trip.members.map((member) => member.id),
    };

    const handleSubmit = async ({ value }: { value: FormInput }) => {
        setIsSubmitting(true);

        try {
            await db.trips.update(trip.id, {
                title: value.tripName,
                startDate: value.dates.from?.toISOString(),
                endDate: value.dates.to?.toISOString(),
                synced: false,
                updatedAt: new Date().toISOString(),
            });

            const currentMemberIds = trip.members.map((member) => member.id);
            const selectedMemberIds = value.tripMembers;

            const addedMemberIds = selectedMemberIds.filter(
                (id) => !currentMemberIds.includes(id)
            );
            const removedMemberIds = currentMemberIds.filter(
                (id) => !selectedMemberIds.includes(id)
            );

            if (addedMemberIds.length > 0) {
                await db.tripMembers.bulkAdd(
                    addedMemberIds.map((userId) => ({
                        tripId: trip.id,
                        userId,
                    }))
                );
            }

            if (removedMemberIds.length > 0) {
                await db.tripMembers
                    .where('userId')
                    .anyOf(removedMemberIds)
                    .filter((member) => member.tripId === trip.id)
                    .delete();
            }

            await wait(500);
            onSubmit();
        } catch (error) {
            console.error('Failed to update trip:', error);
            toast.add({
                title: 'Failed to update trip',
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
            className="flex flex-col gap-4 h-full"
        >
            <FieldGroup>
                <form.Field name="tripName">
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
                                    Trip Name
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

                <form.Field name="dates">
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
                                    Dates
                                </FieldLabel>
                                <DateRangePicker
                                    id={field.name}
                                    onSelect={(dateRange) =>
                                        field.handleChange({
                                            from: dateRange?.from,
                                            to: dateRange?.to,
                                        })
                                    }
                                    defaultValue={{
                                        from: field.state.value.from,
                                        to: field.state.value.to,
                                    }}
                                    ariaInvalid={isInvalid}
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

                <form.Field name="tripMembers">
                    {(field) => {
                        const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;

                        return (
                            <Field data-invalid={isInvalid}>
                                <FieldLabel
                                    id={field.name + '-label'}
                                    className="text-muted-foreground"
                                >
                                    Who&apos;s going?
                                </FieldLabel>
                                <UserPicker
                                    id={field.name}
                                    labelledBy={field.name + '-label'}
                                    onChange={(selected) =>
                                        field.handleChange(selected)
                                    }
                                    defaultSelected={field.state.value}
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
