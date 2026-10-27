export const MAX_CLOCK_SKEW_MS = 5 * 60 * 1000; // 5 minutes

export const isFromTheFuture = (updatedAt: Date | string) =>
    new Date(updatedAt).getTime() > Date.now() + MAX_CLOCK_SKEW_MS;
