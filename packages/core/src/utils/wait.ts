export const wait = (delay = 300) =>
    new Promise((resolve) => setTimeout(resolve, delay));
