import type { TripWithDetails } from '../lib/dexie/types';

export const tripsFixture: {
    current: TripWithDetails[];
    upcoming: TripWithDetails[];
    past: TripWithDetails[];
} = {
    current: [
        {
            id: '00000000-0000-0000-0000-000000000001',
            title: 'Two weeks in Japan',
            startDate: '2026-10-07T23:00:00.000Z',
            endDate: '2026-10-21T23:00:00.000Z',
            coverPhotoId: null,
            createdBy: 'w79VCY6Mi1xKlEBZFarfM8buBcMmFRjs',
            isDeleted: false,
            createdAt: '2026-10-09T12:48:11.325Z',
            updatedAt: '2026-10-09T12:48:11.325Z',
            entryCount: 5,
            members: [
                {
                    id: 'w79VCY6Mi1xKlEBZFarfM8buBcMmFRjq',
                    name: 'Grace',
                    image: null,
                },
                {
                    id: 'w79VCY6Mi1xKlEBZFarfM8buBcMmFRjs',
                    name: 'Steven Bister',
                    image: 'https://lh3.googleusercontent.com/a/ACg8ocLYhrclCPf7FgTUkxwBli8OTm-AbLhKbKavxHHOT4RJNKTRctTR=s96-c',
                },
            ],
        },
    ],
    upcoming: [
        {
            id: '00000000-0000-0000-0000-000000000002',
            title: 'Portugal coast',
            startDate: '2026-12-01T23:00:00.000Z',
            endDate: '2026-12-10T23:00:00.000Z',
            coverPhotoId: null,
            createdBy: 'w79VCY6Mi1xKlEBZFarfM8buBcMmFRjs',
            isDeleted: false,
            createdAt: '2026-10-09T12:48:11.325Z',
            updatedAt: '2026-10-09T12:48:11.325Z',
            entryCount: 4,
            members: [
                {
                    id: 'w79VCY6Mi1xKlEBZFarfM8buBcMmFRjq',
                    name: 'Grace',
                    image: null,
                },
                {
                    id: 'w79VCY6Mi1xKlEBZFarfM8buBcMmFRjs',
                    name: 'Steven Bister',
                    image: 'https://lh3.googleusercontent.com/a/ACg8ocLYhrclCPf7FgTUkxwBli8OTm-AbLhKbKavxHHOT4RJNKTRctTR=s96-c',
                },
            ],
        },
    ],
    past: [
        {
            id: '00000000-0000-0000-0000-000000000003',
            title: 'Tenerife',
            startDate: '2026-02-18T23:00:00.000Z',
            endDate: '2026-03-01T23:00:00.000Z',
            coverPhotoId: null,
            createdBy: 'w79VCY6Mi1xKlEBZFarfM8buBcMmFRjs',
            isDeleted: false,
            createdAt: '2026-10-09T12:48:11.325Z',
            updatedAt: '2026-10-09T12:48:11.325Z',
            entryCount: 4,
            members: [
                {
                    id: 'w79VCY6Mi1xKlEBZFarfM8buBcMmFRjq',
                    name: 'Grace',
                    image: null,
                },
                {
                    id: 'w79VCY6Mi1xKlEBZFarfM8buBcMmFRjs',
                    name: 'Steven Bister',
                    image: 'https://lh3.googleusercontent.com/a/ACg8ocLYhrclCPf7FgTUkxwBli8OTm-AbLhKbKavxHHOT4RJNKTRctTR=s96-c',
                },
            ],
        },
    ],
};
