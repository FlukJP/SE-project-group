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
import { ENV } from "./config/serverEnv";
import pool from "./lib/mysql";
import { ChatModel } from "./models/chatModel";
import { verifyAccessToken } from "./utils/jwt";

// TYPES

interface AuthenticatedSocket extends Socket {
    user?: { userID: number; role: string };
}

// APP + SERVER SETUP

const app = express();
const server = http.createServer(app);
app.set("trust proxy", 1);

const CLIENT_URLS = ENV.CLIENT_URLS;

// SOCKET.IO
const io = new SocketIOServer(server, {
    cors: {
        origin: CLIENT_URLS,
        credentials: true,
    },
});

/**
 * Authenticates each incoming Socket.IO connection.
 * Uses verifyAccessToken helper instead of raw jwt.verify()
 * to avoid TypeScript overload intersection error (Jwt & JwtPayload & void).
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

/** Handles Socket.IO connection lifecycle — joining/leaving chat rooms and broadcasting messages. */
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

// MIDDLEWARE

// Security headers
app.use(
    helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
    })
);

// CORS
app.use(
    cors({
        origin: CLIENT_URLS,
        credentials: true,
    })
);

// Compression
app.use(compression());

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

// Static files — ต้องมี middleware นี้ ไม่งั้น /uploads ไม่ทำงาน
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ROUTES

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

// BOOTSTRAP
const PORT = Number(ENV.PORT) || 5000;

/** Verifies DB connection, connects to Redis, then starts the HTTP server. */
async function bootstrap() {
    // 1. MySQL
    try {
        const conn = await pool.getConnection();
        console.log("[MySQL] Connected");
        conn.release();
    } catch (err) {
        console.error("[MySQL] Connection failed:", err);
        process.exit(1);
    }

    // 2. Redis (non-blocking — falls back to in-memory on failure)
    await connectRedis();
    if (isRedisAvailable()) {
        console.log("[Redis] Connected");
    } else {
        console.warn("[Redis] Not available — using in-memory fallback");
    }

    // 3. HTTP server
    server.listen(PORT, () => {
        console.log(`[Server] Running on http://localhost:${PORT}`);
        console.log(`[Server] Static files at http://localhost:${PORT}/uploads`);
        console.log(`[Server] Environment: ${ENV.NODE_ENV}`);
    });
}

// GRACEFUL SHUTDOWN

/** Gracefully closes HTTP server, Socket.IO, Redis, and MySQL pool before exiting. */
async function shutdown(signal: string) {
    console.log(`\n[${signal}] Shutting down...`);

    await new Promise<void>((resolve) => server.close(() => {
        console.log("[HTTP] Closed");
        resolve();
    }));

    await new Promise<void>((resolve) => io.close(() => {
        console.log("[Socket] Closed");
        resolve();
    }));

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
