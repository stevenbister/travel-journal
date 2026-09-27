import { createRoute, z } from '@hono/zod-openapi';

import {
    insertTripSchema,
    selectTripSchema,
    updateTripSchema,
} from '../../db/schema/trips';
import {
    json,
    notFound,
    unauthorized,
    unprocessableEntity,
} from '../../lib/response-schema';
import { requireAuth } from '../../middleware/require-auth';

export type TripsRoute = typeof getTrips;
export type TripByIdRoute = typeof getTripById;
export type CreateTripRoute = typeof createTrip;
export type UpdateTripRoute = typeof updateTrip;
export type DeleteTripRoute = typeof deleteTrip;

const tags = ['Trips'];

const paramsSchema = z.object({
    id: z.string().openapi({
        param: {
            name: 'id',
            in: 'path',
            required: true,
        },
        example: 'd08a367b-5bfc-4b2b-ac7f-3f9a8bbcf202',
    }),
});

export const getTrips = createRoute({
    method: 'get',
    path: '/trips',
    summary: 'Trips',
    description: 'Returns a list of trips created by the authenticated user.',
    tags,
    middleware: [requireAuth],
    responses: {
        200: json(
            z.array(selectTripSchema),
            'A list of trips created by the authenticated user.'
        ),
        401: unauthorized(),
    },
});

export const getTripById = createRoute({
    method: 'get',
    path: '/trips/{id}',
    summary: 'Trip by ID',
    description: 'Returns a trip by its ID for the authenticated user.',
    tags,
    middleware: [requireAuth],
    request: {
        params: paramsSchema,
    },
    responses: {
        200: json(selectTripSchema, 'The trip with the specified ID.'),
        404: notFound(),
        401: unauthorized(),
    },
});

export const createTrip = createRoute({
    method: 'post',
    path: '/trips',
    summary: 'Create Trip',
    description: 'Creates a new trip for the authenticated user.',
    tags,
    middleware: [requireAuth],
    request: {
        body: {
            ...json(
                insertTripSchema,
                'The request body for creating a new trip.'
            ),
            required: true,
        },
    },
    responses: {
        200: json(selectTripSchema, 'The newly created trip.'),
        401: unauthorized(),
        422: unprocessableEntity(),
    },
});

export const updateTrip = createRoute({
    method: 'put',
    path: '/trips/{id}',
    summary: 'Update Trip',
    description: 'Updates an existing trip for the authenticated user.',
    tags,
    middleware: [requireAuth],
    request: {
        params: paramsSchema,
        body: {
            ...json(
                updateTripSchema,
                'The request body for updating an existing trip.'
            ),
            required: true,
        },
    },
    responses: {
        200: json(selectTripSchema.partial(), 'The updated trip.'),
        401: unauthorized(),
        404: notFound(),
        422: unprocessableEntity(),
    },
});

export const deleteTrip = createRoute({
    method: 'delete',
    path: '/trips/{id}',
    summary: 'Delete Trip',
    description: 'Deletes an existing trip for the authenticated user.',
    tags,
    middleware: [requireAuth],
    request: {
        params: paramsSchema,
    },
    responses: {
        200: json(selectTripSchema, 'The deleted trip.'),
        401: unauthorized(),
        404: notFound(),
    },
});
