import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import http from "http";
import path from "path";
import { Server as SocketIOServer, Socket } from "socket.io";

import apiRoutes from "./routes";
import { AppError } from "./errors/AppError";
import { errorHandler } from "./middleware/error.middleware";
import { globalLimiter } from "./middleware/rateLimit.middleware";
import { connectRedis, disconnectRedis, isRedisAvailable } from "./config/redis";
import { SERVER_ENV as ENV } from "./config/env";
import pool from "./lib/mysql";
import { ChatModel } from "./models/chatModel";
import { verifyAccessToken } from "./utils/jwt";

interface AuthenticatedSocket extends Socket {
    user?: { userID: number; role: string };
}

const app = express();
const server = http.createServer(app);
app.set("trust proxy", 1);

const CLIENT_URLS = ENV.CLIENT_URLS;

const io = new SocketIOServer(server, {
    cors: {
        origin: CLIENT_URLS,
        credentials: true,
    },
});

/**
 * Authenticates each incoming Socket.IO connection.
 * Uses verifyAccessToken helper instead of raw jwt.verify().
 */
io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Authentication required"));

    try {
        const decoded = verifyAccessToken(token);
        (socket as AuthenticatedSocket).user = {
            userID: decoded.userID,
            role: decoded.role,
        };
        next();
    } catch {
        next(new Error("Invalid or expired token"));
    }
});

/** Handles Socket.IO connection lifecycle: joining/leaving rooms and broadcasting messages. */
io.on("connection", (socket) => {
    const socketUser = (socket as AuthenticatedSocket).user;
    console.log(`[Socket] Connected: ${socket.id}, userID: ${socketUser?.userID}`);

    socket.on("join", async (roomId: string) => {
        if (!socketUser) return;
        try {
            const chat = await ChatModel.findByID(Number(roomId));
            if (
                !chat ||
                (socketUser.userID !== chat.Participant_1 &&
                    socketUser.userID !== chat.Participant_2)
            ) {
                return;
            }
            socket.join(roomId);
        } catch (err) {
            console.error(`[Socket] join error for room ${roomId}:`, err);
        }
    });

    socket.on("leave", (roomId: string) => {
        socket.leave(roomId);
    });

    socket.on("sendMessage", (data: { roomId: string; message: unknown }) => {
        if (!socketUser) return;
        const msg = data.message as Record<string, unknown> | undefined;
        if (!msg || msg.Sender_ID !== socketUser.userID || !msg.Messages_ID) return;
        socket.to(data.roomId).emit("newMessage", data.message);
    });

    socket.on("disconnect", (reason) => {
        console.log(`[Socket] Disconnected: ${socket.id}, reason: ${reason}`);
    });
});

app.set("io", io);

app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

app.use(
    cors({
        origin: CLIENT_URLS,
        credentials: true,
    })
);

app.use(compression());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/health", (_req, res) => {
    res.json({
        status: "ok",
        uptime: process.uptime(),
        redis: isRedisAvailable() ? "connected" : "fallback",
    });
});

app.use("/api", apiRoutes);

app.use("/{*path}", (req, _res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorHandler);

const PORT = Number(ENV.PORT) || 5000;

/** Verifies DB connection, connects to Redis, then starts the HTTP server. */
async function bootstrap() {
    try {
        const conn = await pool.getConnection();
        console.log("[MySQL] Connected");
        conn.release();
    } catch (err) {
        console.error("[MySQL] Connection failed:", err);
        process.exit(1);
    }

    try {
        await connectRedis();
    } catch (err) {
        console.error("[Redis] Connection failed:", err);
        process.exit(1);
    }

    if (isRedisAvailable()) {
        console.log("[Redis] Connected");
    } else {
        console.warn("[Redis] Using in-memory fallback outside production");
    }

    server.listen(PORT, () => {
        console.log(`[Server] Running on http://localhost:${PORT}`);
        console.log(`[Server] Static files at http://localhost:${PORT}/uploads`);
        console.log(`[Server] Environment: ${ENV.NODE_ENV}`);
    });
}

/** Gracefully closes HTTP server, Socket.IO, Redis, and MySQL pool before exiting. */
async function shutdown(signal: string) {
    console.log(`\n[${signal}] Shutting down...`);

    await new Promise<void>((resolve) =>
        server.close(() => {
            console.log("[HTTP] Closed");
            resolve();
        })
    );

    await new Promise<void>((resolve) =>
        io.close(() => {
            console.log("[Socket] Closed");
            resolve();
        })
    );

    try {
        await disconnectRedis();
    } catch (err) {
        console.error("[Redis] Error during disconnect:", err);
    }

    try {
        await pool.end();
        console.log("[MySQL] Pool closed");
    } catch (err) {
        console.error("[MySQL] Error during pool close:", err);
    }

    process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
    console.error("[Server] Uncaught exception:", err);
    shutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
    console.error("[Server] Unhandled rejection:", reason);
});

bootstrap();
