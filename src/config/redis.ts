import { createClient } from "redis";

const REDIS_URL = process.env.REDIS_URL;

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

export const disconnectRedis = async (): Promise<void> => {
    if (redisClient.isOpen) {
        await redisClient.quit();
        redisAvailable = false;
        console.log("Redis disconnected");
    }
};

// --- In-memory fallback store ---
const memoryStore = new Map<string, { value: string; expiresAt: number | null }>();

function memoryCleanup() {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
        if (entry.expiresAt && entry.expiresAt <= now) {
            memoryStore.delete(key);
        }
    }
}

// Cleanup expired keys every 60 seconds
setInterval(memoryCleanup, 60_000).unref();

// --- Cache adapter: same API as redis client subset used in auth.service ---
const cacheAdapter = {
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

    async setEx(key: string, seconds: number, value: string): Promise<void> {
        if (redisAvailable && redisClient.isOpen) {
            await redisClient.setEx(key, seconds, value);
            return;
        }
        memoryStore.set(key, { value, expiresAt: Date.now() + seconds * 1000 });
    },

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

    async ttl(key: string): Promise<number> {
        if (redisAvailable && redisClient.isOpen) {
            return redisClient.ttl(key);
        }
        const entry = memoryStore.get(key);
        if (!entry || !entry.expiresAt) return -1;
        const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : -2;
    },

    async del(key: string): Promise<number> {
        if (redisAvailable && redisClient.isOpen) {
            return redisClient.del(key);
        }
        return memoryStore.delete(key) ? 1 : 0;
    },

    get isOpen(): boolean {
        return true; // adapter is always "open"
    },
};

export const isRedisAvailable = () => redisAvailable;

// Fix #15: Removed duplicate SIGINT/SIGTERM handlers (server.ts handles graceful shutdown)

export default cacheAdapter;
