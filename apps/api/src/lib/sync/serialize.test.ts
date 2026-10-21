import { mockEntries, mockHistory, mockPlace, mockTrips } from '../../__fixtures__/db';
import { serializeEntry, serializeEntryHistory, serializeTrip } from './serialize';

const mockTrip = mockTrips[0]!;
const mockEntry = { ...mockEntries[0]!, location: mockPlace };
const mockEntryHistory = mockHistory[0]!;

describe('serialize', () => {
    describe('serializeTrip', () => {
        it('strips serverUpdatedAt and serializes dates to ISO strings', () => {
            expect(serializeTrip(mockTrip)).toEqual({
                id: '1',
                title: 'Japan 2026',
                startDate: '2026-04-01T00:00:00.000Z',
                endDate: '2026-04-15T00:00:00.000Z',
                coverPhotoId: null,
                createdBy: mockTrip.createdBy,
                isDeleted: false,
                createdAt: mockTrip.createdAt.toISOString(),
                updatedAt: mockTrip.updatedAt.toISOString(),
            });
        });

        it('handles null trip dates', () => {
            const trip = { ...mockTrip, startDate: null, endDate: null };

            expect(serializeTrip(trip)).toMatchObject({
                startDate: null,
                endDate: null,
            });
        });
    });

    describe('serializeEntry', () => {
        it('strips serverUpdatedAt, serializes dates and keeps the location', () => {
            expect(serializeEntry(mockEntry)).toEqual({
                id: '1',
                tripId: '1',
                authorId: mockEntry.authorId,
                title: 'Sample title',
                notes: 'Sample notes',
                entryDate: '2026-04-01T00:00:00.000Z',
                tag: 'food',
                location: mockPlace,
                isDeleted: false,
                createdAt: mockEntry.createdAt.toISOString(),
                updatedAt: mockEntry.updatedAt.toISOString(),
            });
        });
    });

    describe('serializeEntryHistory', () => {
        it('strips serverUpdatedAt and serializes editedAt', () => {
            expect(serializeEntryHistory(mockEntryHistory)).toEqual({
                id: '1',
                entryId: '1',
                editedBy: mockEntryHistory.editedBy,
                editedAt: mockEntryHistory.editedAt.toISOString(),
            });
        });
    });
});
