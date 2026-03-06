import { createClient } from "redis";

const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
    },
});

// Error handler
redisClient.on("error", (err) => {
    console.error("Redis Client Error:", err);
});

let connectionPromise: Promise<void> | null = null;

export const connectRedis = async () => {
    if (redisClient.isOpen) return;

    if (!connectionPromise) {
        connectionPromise = redisClient
            .connect()
            .then(() => {
                console.log("Redis connected");
            })
            .catch((err) => {
                console.error("Redis connection failed:", err);
                throw err;
            })
            .finally(() => {
                connectionPromise = null;
            });
    }

    await connectionPromise;
};

export const disconnectRedis = async (): Promise<void> => {
    if (redisClient.isOpen) {
        await redisClient.quit();
        console.log("Redis disconnected");
    }
};

process.on("SIGINT", async () => {
    await disconnectRedis();
    process.exit(0);
});

process.on("SIGTERM", async () => {
    await disconnectRedis();
    process.exit(0);
});

export default redisClient;