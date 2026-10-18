import { type Locator, locators } from 'vitest/browser';

// @ts-expect-error CSS is loaded by the bundler and has no TypeScript declarations.
import '@repo/ui/globals.css';

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
