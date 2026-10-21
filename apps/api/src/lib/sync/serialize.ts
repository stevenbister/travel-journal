import type { entries, entryHistory, trips } from '../../db/schema';

export const serializeTrip = ({
    serverUpdatedAt: _serverUpdatedAt,
    ...row
}: typeof trips.$inferSelect) => ({
    ...row,
    startDate: row.startDate ? row.startDate.toISOString() : null,
    endDate: row.endDate ? row.endDate.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
});

export const serializeEntry = ({
    serverUpdatedAt: _serverUpdatedAt,
    ...row
}: typeof entries.$inferSelect) => ({
    ...row,
    entryDate: row.entryDate.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
});

export const serializeEntryHistory = ({
    serverUpdatedAt: _serverUpdatedAt,
    ...row
}: typeof entryHistory.$inferSelect) => ({
    ...row,
    editedAt: row.editedAt.toISOString(),
});
