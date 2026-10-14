import { describe, expect, it } from 'vitest';

import { getEntryDayNumber } from './get-entry-day-number';

describe('getEntryDayNumber', () => {
    it('returns 1 for an entry on the same calendar day as the trip start', () => {
        expect(
            getEntryDayNumber('2026-10-08T10:00:00', '2026-10-08T00:00:00')
        ).toBe(1);
    });

    it('counts calendar days from the trip start, skipping days without entries', () => {
        expect(
            getEntryDayNumber('2026-10-09T10:00:00', '2026-10-08T00:00:00')
        ).toBe(2);
        expect(
            getEntryDayNumber('2026-10-13T10:00:00', '2026-10-08T00:00:00')
        ).toBe(6);
    });

    it('returns undefined when either date is missing', () => {
        expect(getEntryDayNumber(undefined, '2026-10-08T00:00:00')).toBeUndefined();
        expect(getEntryDayNumber('2026-10-08T10:00:00', undefined)).toBeUndefined();
        expect(getEntryDayNumber(undefined, undefined)).toBeUndefined();
    });
});
