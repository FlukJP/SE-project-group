import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

import apiRoutes from './routes/index.js';
import { AppError } from './errors/AppError';
import { errorHandler } from './middleware/error.middleware';
import { globalLimiter } from './middleware/rateLimit.middleware';
import { connectRedis, disconnectRedis, isRedisAvailable } from './config/redis';
import { ENV } from './config/env';
import pool from './lib/mysql';
import { ChatModel } from './models/chatModel';


interface AuthenticatedSocket extends Socket {
    user?: { userID: number; role: string };
}

const app = express();
const server = http.createServer(app);
app.set('trust proxy', 1);

const CLIENT_URLS = (ENV.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map(u => u.trim());
if (!CLIENT_URLS.includes('http://localhost:3001')) CLIENT_URLS.push('http://localhost:3001');

const io = new SocketIOServer(server, {
    cors: {
        origin: CLIENT_URLS,
        credentials: true,
    },
});

// Authenticates each incoming Socket.IO connection by verifying the JWT token in the handshake auth payload.
io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) {
        return next(new Error("Authentication required"));
    }
    try {
        const decoded = jwt.verify(token, ENV.JWT_SECRET, {
            issuer: ENV.JWT_ISSUER,
            audience: ENV.JWT_AUDIENCE,
        }) as { userID: number; role: string };
        (socket as AuthenticatedSocket).user = decoded;
        next();
    } catch {
        next(new Error("Invalid token"));
    }
});

// Handles Socket.IO connection lifecycle — joining/leaving chat rooms and broadcasting messages.
io.on('connection', (socket) => {
    const socketUser = (socket as AuthenticatedSocket).user;
    console.log(`[Socket] connected: ${socket.id}, user: ${socketUser?.userID}`);

    socket.on('join', async (roomId: string) => {
        if (!socketUser) return;
        try {
            const chat = await ChatModel.findByID(Number(roomId));
            if (!chat || (socketUser.userID !== chat.Participant_1 && socketUser.userID !== chat.Participant_2)) {
                return;
            }
            socket.join(roomId);
        } catch {
            // ignore DB errors silently
        }
    });

    socket.on('leave', (roomId: string) => {
        socket.leave(roomId);
    });

    socket.on('sendMessage', (data: { roomId: string; message: unknown }) => {
        if (!socketUser) return;
        const msg = data.message as Record<string, unknown> | undefined;
        if (!msg || msg.Sender_ID !== socketUser.userID || !msg.Messages_ID) return;
        socket.to(data.roomId).emit('newMessage', data.message);
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] disconnected: ${socket.id}`);
    });
});

app.set('io', io);

// Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS
app.use(cors({
    origin: CLIENT_URLS,
    credentials: true,
}));

// Compression
app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api', apiRoutes);

app.use('/{*path}', (req, _res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorHandler);

const PORT = Number(ENV.PORT) || 5000;

// Verifies the database connection, connects to Redis, then starts the HTTP server.
async function bootstrap() {
    try {
        const conn = await pool.getConnection();
        console.log('[MySQL] connected');
        conn.release();
    } catch (err) {
        console.error('[MySQL] connection failed:', err);
        process.exit(1);
    }

    await connectRedis();
    if (isRedisAvailable()) {
        console.log('[Redis] connected');
    } else {
        console.warn('[Redis] not available — using in-memory fallback');
    }

    server.listen(PORT, () => {
        console.log(`[Server] running on http://localhost:${PORT}`);
        console.log(`[Server] static files at http://localhost:${PORT}/uploads`);
        console.log(`[Server] environment: ${ENV.NODE_ENV}`);
    });
}

// Gracefully closes the HTTP server, Socket.IO, Redis, and MySQL pool before exiting.
async function shutdown(signal: string) {
    console.log(`\n[${signal}] shutting down...`);
    server.close(() => console.log('[HTTP] closed'));
    io.close(() => console.log('[Socket] closed'));
    try { await disconnectRedis(); } catch {}
    try { await pool.end(); console.log('[MySQL] pool closed'); } catch {}
    process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

bootstrap();
