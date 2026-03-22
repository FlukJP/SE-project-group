import { createClient } from "redis";
import { REDIS_URL } from "./constants";

const redisClient = createClient({
    url: REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries >= 3) {
                return new Error("Redis max retries reached");
            }
            return Math.min(retries * 100, 1000);
        },
        connectTimeout: 5000,
    },
});

let redisErrorLogged = false;
redisClient.on("error", (err) => {
    if (!redisErrorLogged) {
        console.error("Redis Client Error:", err.message || err);
        redisErrorLogged = true;
    }
});

let redisAvailable = false;
let connectionPromise: Promise<void> | null = null;

// Connects to Redis if not already connected. Marks Redis as unavailable if the connection times out or fails.
export const connectRedis = async () => {
    if (redisClient.isOpen) {
        redisAvailable = true;
        return;
    }

    if (!connectionPromise) {
        connectionPromise = new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                redisAvailable = false;
                resolve();
            }, 5000);

            redisClient
                .connect()
                .then(() => {
                    clearTimeout(timeout);
                    redisAvailable = true;
                    console.log("Redis connected");
                    resolve();
                })
                .catch(() => {
                    clearTimeout(timeout);
                    redisAvailable = false;
                    resolve();
                })
                .finally(() => {
                    connectionPromise = null;
                });
        });
    }

    await connectionPromise;
};

// Gracefully disconnects the Redis client and marks Redis as unavailable.
export const disconnectRedis = async (): Promise<void> => {
    if (redisClient.isOpen) {
        await redisClient.quit();
        redisAvailable = false;
        console.log("Redis disconnected");
    }
};

// In-memory fallback store used when Redis is unavailable.
const memoryStore = new Map<string, { value: string; expiresAt: number | null }>();

// Removes all expired entries from the in-memory store.
function memoryCleanup() {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
        if (entry.expiresAt && entry.expiresAt <= now) {
            memoryStore.delete(key);
        }
    }
}

// Periodically purge expired in-memory keys every 60 seconds.
setInterval(memoryCleanup, 60_000).unref();

// Unified cache adapter that uses Redis when available, falling back to an in-memory store.
const cacheAdapter = {
    // Returns the cached value for the given key, or null if not found or expired.
    async get(key: string): Promise<string | null> {
        if (redisAvailable && redisClient.isOpen) {
            return redisClient.get(key);
        }
        const entry = memoryStore.get(key);
        if (!entry) return null;
        if (entry.expiresAt && entry.expiresAt <= Date.now()) {
            memoryStore.delete(key);
            return null;
        }
        return entry.value;
    },

    // Stores a value with a TTL (in seconds) under the given key.
    async setEx(key: string, seconds: number, value: string): Promise<void> {
        if (redisAvailable && redisClient.isOpen) {
            await redisClient.setEx(key, seconds, value);
            return;
        }
        memoryStore.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
    },

    // Increments the integer value of the given key by one, creating it at 1 if it does not exist.
    async incr(key: string): Promise<number> {
        if (redisAvailable && redisClient.isOpen) {
            return redisClient.incr(key);
        }
        const entry = memoryStore.get(key);
        if (entry && entry.expiresAt && entry.expiresAt <= Date.now()) {
            memoryStore.delete(key);
        }
        const existing = memoryStore.get(key);
        const newVal = existing ? parseInt(existing.value, 10) + 1 : 1;
        memoryStore.set(key, {
            value: String(newVal),
            expiresAt: existing?.expiresAt ?? null,
        });
        return newVal;
    },

    // Sets a TTL (in seconds) on an existing key. Returns true if the key exists, false otherwise.
    async expire(key: string, seconds: number): Promise<boolean> {
        if (redisAvailable && redisClient.isOpen) {
            const result = await redisClient.expire(key, seconds);
            return Boolean(result);
        }
        const entry = memoryStore.get(key);
        if (!entry) return false;
        entry.expiresAt = Date.now() + seconds * 1000;
        return true;
    },

    // Returns the remaining TTL in seconds for the given key, or -1 if no expiry is set, -2 if expired.
    async ttl(key: string): Promise<number> {
        if (redisAvailable && redisClient.isOpen) {
            return redisClient.ttl(key);
        }
        const entry = memoryStore.get(key);
        if (!entry || !entry.expiresAt) return -1;
        const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
    },

    // Deletes the given key. Returns 1 if deleted, 0 if not found.
    async del(key: string): Promise<number> {
        if (redisAvailable && redisClient.isOpen) {
            return redisClient.del(key);
        }
        return memoryStore.delete(key) ? 1 : 0;
    },

    // Always returns true because the adapter itself is always operational.
    get isOpen(): boolean {
        return true;
    },
};

// Returns whether the Redis connection is currently active.
export const isRedisAvailable = () => redisAvailable;

export default cacheAdapter;
