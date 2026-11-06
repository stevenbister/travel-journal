export const getUniqueObjectsFromArray = <T extends object>(
    array: T[],
    identifier: keyof T
): T[] => {
    const unique: T[] = [
        ...new Map(array.map((item) => [item[identifier], item])).values(),
    ];

    return unique;
};
