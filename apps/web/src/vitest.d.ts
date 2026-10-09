// vitest-browser.d.ts
import type { Locator } from 'vitest/browser';

declare module 'vitest/browser' {
    interface LocatorSelectors {
        // eslint-disable-next-line no-unused-vars
        getByAttribute(attribute: string, value: string): Locator;
    }
}
