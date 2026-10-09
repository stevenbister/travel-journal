import { type Locator, locators } from 'vitest/browser';

locators.extend({
    getByAttribute: (attribute: string, value: string) =>
        `[${attribute}="${value}"]`,
});

declare module 'vitest/browser' {
    interface LocatorSelectors {
        // eslint-disable-next-line no-unused-vars
        getByAttribute(attribute: string, value: string): Locator;
    }
}
