import { createClient } from "redis";
import { SERVER_ENV as ENV } from "./env";

const allowMemoryFallback = ENV.NODE_ENV !== "production";

// CLIENT SETUP
const redisClient = createClient({
    url: ENV.REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries >= 3) return new Error("Redis max retries reached");
            return Math.min(retries * 100, 1000);
        },
        connectTimeout: 5000,
    },
});

let redisAvailable = false;
let connectionPromise: Promise<void> | null = null;

redisClient.on("error", (err) => {
    console.error("[Redis] Client error:", err.message ?? err);
});

redisClient.on("ready", () => {
    redisAvailable = true;
    console.log("[Redis] Connected");
});

redisClient.on("end", () => {
    redisAvailable = false;
    console.warn("[Redis] Connection closed");
});

redisClient.on("reconnecting", () => {
    console.log("[Redis] Reconnecting...");
});

const assertMemoryFallbackAllowed = () => {
    if (!allowMemoryFallback) {
        throw new Error("[Redis] Redis is unavailable and in-memory fallback is disabled in production");
    }
};

// CONNECT / DISCONNECT
/** Connect to Redis once at app startup. Safe to call multiple times. */
export const connectRedis = async (): Promise<void> => {
    if (redisClient.isOpen) {
        redisAvailable = true;
        return;
    }

    if (!connectionPromise) {
        connectionPromise = new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => {
                const error = new Error("[Redis] Connection timed out");
                redisAvailable = false;

                if (allowMemoryFallback) {
                    console.warn(`${error.message} - falling back to in-memory store`);
                    resolve();
                    return;
                }

                reject(error);
            }, 5000);

            redisClient
                .connect()
                .then(() => {
                    clearTimeout(timeout);
                    resolve();
                })
                .catch((err) => {
                    clearTimeout(timeout);
                    console.error("[Redis] Failed to connect:", err.message ?? err);
                    redisAvailable = false;

                    if (allowMemoryFallback) {
                        resolve();
                        return;
                    }

                    reject(err instanceof Error ? err : new Error(String(err)));
                })
                .finally(() => {
                    connectionPromise = null;
                });
        });
    }

    await connectionPromise;
};

/** Gracefully disconnect the Redis client. */
export const disconnectRedis = async (): Promise<void> => {
    if (redisClient.isOpen) {
        await redisClient.quit();
        redisAvailable = false;
        console.log("[Redis] Disconnected");
    }
};

/** Returns whether the Redis connection is currently active. */
export const isRedisAvailable = (): boolean => redisAvailable;

// IN-MEMORY FALLBACK
type MemoryEntry = { value: string; expiresAt: number | null };
const memoryStore = new Map<string, MemoryEntry>();

const isExpired = (entry: MemoryEntry): boolean =>
    entry.expiresAt !== null && entry.expiresAt <= Date.now();

const getMemory = (key: string): MemoryEntry | null => {
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (isExpired(entry)) {
        memoryStore.delete(key);
        return null;
    }
    return entry;
};

// Purge expired in-memory keys every 60 seconds
setInterval(() => {
    for (const [key, entry] of memoryStore) {
        if (isExpired(entry)) memoryStore.delete(key);
    }
}, 60_000).unref();

// CACHE ADAPTER
// Unified interface: Redis when available, in-memory fallback only outside production
const cacheAdapter = {
    /** Returns the cached value for the given key, or null if not found/expired. */
    async get(key: string): Promise<string | null> {
        if (redisAvailable && redisClient.isOpen) return redisClient.get(key);
        assertMemoryFallbackAllowed();
        return getMemory(key)?.value ?? null;
    },

    /**
     * SET with optional NX (only if not exists) and EX (TTL in seconds).
     * Returns "OK" on success, null if NX condition not met.
     * Used for atomic OTP storage.
     */
    async set(
        key: string,
        value: string,
        options?: { NX?: boolean; EX?: number }
    ): Promise<string | null> {
        if (redisAvailable && redisClient.isOpen) {
            return redisClient.set(key, value, options ?? {});
        }

        assertMemoryFallbackAllowed();

        if (options?.NX && getMemory(key) !== null) return null;

        const expiresAt = options?.EX ? Date.now() + options.EX * 1000 : null;
        memoryStore.set(key, { value, expiresAt });
        return "OK";
    },

    /** Stores a value with a TTL (in seconds) under the given key. */
    async setEx(key: string, seconds: number, value: string): Promise<void> {
        if (redisAvailable && redisClient.isOpen) {
            await redisClient.setEx(key, seconds, value);
            return;
        }

        assertMemoryFallbackAllowed();
        memoryStore.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
    },

    /** Increments the integer value of the given key by one, creating it at 1 if absent. */
    async incr(key: string): Promise<number> {
        if (redisAvailable && redisClient.isOpen) return redisClient.incr(key);

        assertMemoryFallbackAllowed();

        const entry = getMemory(key);
        const newVal = entry ? parseInt(entry.value, 10) + 1 : 1;
        memoryStore.set(key, {
            value: String(newVal),
            expiresAt: entry?.expiresAt ?? null,
        });
        return newVal;
    },

    /** Sets a TTL (in seconds) on an existing key. Returns true if the key exists. */
    async expire(key: string, seconds: number): Promise<boolean> {
        if (redisAvailable && redisClient.isOpen) {
            return Boolean(await redisClient.expire(key, seconds));
        }

        assertMemoryFallbackAllowed();

        const entry = getMemory(key);
        if (!entry) return false;
        entry.expiresAt = Date.now() + seconds * 1000;
        return true;
    },

    /** Returns the remaining TTL in seconds. -1 = no expiry, -2 = expired/missing. */
    async ttl(key: string): Promise<number> {
        if (redisAvailable && redisClient.isOpen) return redisClient.ttl(key);

        assertMemoryFallbackAllowed();

        const entry = getMemory(key);
        if (!entry || !entry.expiresAt) return -1;
        const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
    },

    /**
     * Deletes one or more keys.
     * Accepts variadic args to match redis client's del(...keys) signature.
     * Returns the number of keys deleted.
     */
    async del(...keys: string[]): Promise<number> {
        if (redisAvailable && redisClient.isOpen) return redisClient.del(keys);

        assertMemoryFallbackAllowed();

        let count = 0;
        for (const key of keys) {
            if (memoryStore.delete(key)) count++;
        }
        return count;
    },

    /** The adapter is usable when Redis is connected, or when memory fallback is allowed. */
    get isOpen(): boolean {
        return redisAvailable || allowMemoryFallback;
    },
};

export default cacheAdapter;
