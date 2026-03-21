/** Picks only the specified keys from an object, ignoring undefined values. */
export const pickFields = <T extends object, K extends keyof T>( data: Partial<T> | any, allowedKeys: K[]): Partial<Pick<T, K>> => {
    const result: Partial<Pick<T, K>> = {};
    for (const key of allowedKeys) {
        if (data[key] !== undefined) result[key] = data[key];
    }
    return result;
};