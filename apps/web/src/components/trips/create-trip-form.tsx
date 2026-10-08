import { MapPinIcon } from '@phosphor-icons/react';
import { useForm } from '@tanstack/react-form';
import { useNavigate } from '@tanstack/react-router';
import { type Variants, motion } from 'motion/react';
import React from 'react';
import z from 'zod';

import { wait } from '@repo/core/utils/wait';

import { Button } from '@repo/ui/components/ui/button';
import { DateRangePicker } from '@repo/ui/components/ui/date-picker-input';
import {
    Field,
    FieldError,
    FieldGroup,
    FieldLabel,
} from '@repo/ui/components/ui/field';
import { Input } from '@repo/ui/components/ui/input';
import { Spinner } from '@repo/ui/components/ui/spinner';
import { toast } from '@repo/ui/components/ui/toast';

import { useSession } from '../../lib/auth/use-session';
import { db } from '../../lib/dexie/db';
import { UserPicker } from '../user-picker/user-picker';

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

const MotionField = motion.create(Field);

type CreateTripFormProps = {
    motionVariants: Variants;
};

export const CreateTripForm = ({ motionVariants }: CreateTripFormProps) => {
    const { data: session } = useSession();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const defaultValues: FormInput = {
        tripName: '',
        dates: {
            from: undefined,
            to: undefined,
        },
        tripMembers: [session?.user?.id ?? ''],
    };

    const handleSubmit = async ({ value }: { value: FormInput }) => {
        const userId = session?.user?.id;
        if (!userId) {
            throw new Error('User is not authenticated');
        }

        if (!value.dates.from || !value.dates.to) {
            throw new Error('Start and end dates are required');
        }

        const tripId = crypto.randomUUID();
        setIsSubmitting(true);

        try {
            await db.trips.add({
                id: tripId,
                title: value.tripName,
                startDate: value.dates.from.toISOString(),
                endDate: value.dates.to.toISOString(),
                coverPhotoId: null,
                createdBy: userId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            await db.tripMembers.bulkAdd(
                value.tripMembers.map((tripMemberId) => ({
                    tripId,
                    userId: tripMemberId,
                }))
            );

            // Writing to indexDB is very fast, delay briefly so we can show the loading state as a bit of a nicety
            await wait(500);

            form.reset();
            // TODO: Navigate to the newly created trip's page once implemented
            await navigate({ to: '/' });
        } catch (error) {
            console.error('Failed to create trip:', error);
            toast.add({
                title: 'Failed to create trip',
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
            <motion.div
                className="grid place-content-center bg-secondary text-secondary-foreground w-full h-32 rounded-2xl"
                variants={motionVariants}
            >
                <MapPinIcon size={32} />
            </motion.div>

            <FieldGroup>
                <form.Field name="tripName">
                    {(field) => {
                        const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;

                        return (
                            <MotionField
                                data-invalid={isInvalid}
                                variants={motionVariants}
                            >
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
                            </MotionField>
                        );
                    }}
                </form.Field>

                <form.Field name="dates">
                    {(field) => {
                        const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;

                        return (
                            <MotionField
                                data-invalid={isInvalid}
                                variants={motionVariants}
                            >
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
                                    ariaInvalid={isInvalid}
                                />
                                {isInvalid && (
                                    <FieldError
                                        errors={field.state.meta.errors}
                                    />
                                )}
                            </MotionField>
                        );
                    }}
                </form.Field>

                <form.Field name="tripMembers">
                    {(field) => {
                        const isInvalid =
                            field.state.meta.isTouched &&
                            !field.state.meta.isValid;

                        return (
                            <MotionField
                                data-invalid={isInvalid}
                                variants={motionVariants}
                            >
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
                                />
                                {isInvalid && (
                                    <FieldError
                                        errors={field.state.meta.errors}
                                    />
                                )}
                            </MotionField>
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
                                              ...motionVariants,
                                              show: {
                                                  ...motionVariants.show,
                                                  opacity: 0.5,
                                              },
                                          }
                                        : motionVariants),
                                },
                            }}
                        >
                            {isSubmitting ? <Spinner /> : null}
                            {!isSubmitting && isSubmitted
                                ? 'Trip created!'
                                : ''}
                            {isSubmitting ? 'Creating trip' : 'Create trip'}
                        </Button>
                    );
                }}
            </form.Subscribe>
        </form>
    );
};
