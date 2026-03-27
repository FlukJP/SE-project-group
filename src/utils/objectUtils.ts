// Returns a new object containing only the allowed keys from the source object, omitting keys with undefined values.
export const pickFields = <T extends Record<string, unknown>, K extends keyof T>(
    data: Partial<T>,
    allowedKeys: readonly K[],
): Partial<Pick<T, K>> => {
    const result: Partial<Pick<T, K>> = {};
    for (const key of allowedKeys) {
        if (data[key] !== undefined) result[key] = data[key];
    }
    return result;
};
