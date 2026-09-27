import { z } from '@hono/zod-openapi';

export const json = <T extends z.ZodObject | z.ZodArray<z.ZodObject>>(
    schema: T,
    description: string
) => {
    return {
        content: {
            'application/json': {
                schema,
            },
        },
        description,
    };
};

export const text = <T extends z.ZodLiteral | z.ZodString>(
    schema: T,
    description: string
) => {
    return {
        content: {
            'text/plain': {
                schema,
            },
        },
        description,
    };
};

export const unauthorized = () => {
    return {
        content: {
            'text/json': {
                schema: z.object({
                    error: z.literal('Unauthorized'),
                }),
            },
        },
        description: 'The user is not authenticated.',
    };
};

export const notFound = () => {
    return {
        content: {
            'text/json': {
                schema: z.object({
                    error: z.literal('Not Found'),
                }),
            },
        },
        description: 'The requested resource was not found.',
    };
};

export const unprocessableEntity = () => {
    return {
        content: {
            'text/json': {
                schema: z.object({
                    error: z.string(),
                    source: z.string(),
                }),
            },
        },
        description:
            'The request was well-formed but was unable to be followed due to semantic errors.',
    };
};
