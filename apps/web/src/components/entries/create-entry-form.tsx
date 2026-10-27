import { ClockIcon } from '@phosphor-icons/react';
import { useForm } from '@tanstack/react-form';
import { useNavigate, useParams } from '@tanstack/react-router';
import type { Variants } from 'motion';
import { motion } from 'motion/react';
import z from 'zod';

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
import { Textarea } from '@repo/ui/components/ui/textarea';
import { toast } from '@repo/ui/components/ui/toast';

import { useSession } from '../../lib/auth/use-session';
import { db } from '../../lib/dexie/db';
import { BadgeSelector } from '../badge-selector/badge-selector';
import { LocationSearch } from '../location-search/location-search';
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
    location: placeSchema.optional(), // Optional so we can save as a draft without location
    tag: z.string().optional(), // Only support one tag for now?
});
type FormInput = z.input<typeof formSchema>;

const MotionField = motion.create(Field);

type CreateEntryFormProps = {
    motionVariants: Variants;
};

export const CreateEntryForm = ({ motionVariants }: CreateEntryFormProps) => {
    const { data: session } = useSession();
    const navigate = useNavigate();
    const params = useParams({ strict: false });

    const defaultValues: FormInput = {
        title: '',
        notes: '',
        date: new Date(),
        time: '',
        location: undefined,
        tag: '',
    };

    const handleSubmit = async ({ value }: { value: FormInput }) => {
        const userId = session?.user?.id;
        if (!userId) {
            throw new Error('User is not authenticated');
        }

        if (!params.tripId) {
            throw new Error('Trip ID is not available');
        }

        const entryId = crypto.randomUUID();

        const entryDate: Date = new Date(value.date);
        if (value.time) {
            const [hours, minutes] = value.time.split(':').map(Number);
            entryDate.setHours(hours ?? 0, minutes);
        }

        try {
            await db.entries.add({
                id: entryId,
                tripId: params.tripId,
                title: value.title,
                authorId: userId,
                notes: value.notes ?? null,
                entryDate: entryDate?.toISOString(),
                location: value.location ?? null,
                tag: value.tag ?? null,
                isDeleted: false,
                synced: false,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            });

            form.reset();
            await navigate({
                to: '/trip/$tripId/entry/$entryId',
                params: {
                    tripId: params.tripId,
                    entryId,
                },
            });
        } catch (error) {
            console.error('Failed to create entry:', error);
            toast.add({
                title: 'Failed to create entry',
                description: 'Please try again later.',
                type: 'error',
            });
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
                            <MotionField
                                data-invalid={isInvalid}
                                variants={motionVariants}
                            >
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
                            </MotionField>
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
                            <MotionField
                                data-invalid={isInvalid}
                                variants={motionVariants}
                            >
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

                <form.Field name="time">
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
                            </MotionField>
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
                            <MotionField
                                data-invalid={isInvalid}
                                variants={motionVariants}
                            >
                                <FieldLabel
                                    htmlFor={field.name}
                                    className="text-muted-foreground"
                                >
                                    Location
                                </FieldLabel>

                                <LocationSearch
                                    id={field.name}
                                    onLocationSelect={(location) =>
                                        field.handleChange(location)
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

            <FieldGroup>
                <form.Field name="tag">
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
                            </MotionField>
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
                            <MotionField
                                data-invalid={isInvalid}
                                variants={motionVariants}
                            >
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
                {({ canSubmit, isPristine }) => {
                    const isDisabled = !canSubmit || isPristine;
                    // TODO: Save draft option
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
                            Save entry
                        </Button>
                    );
                }}
            </form.Subscribe>
        </form>
    );
};
