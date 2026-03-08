import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';

import apiRoutes from './routes';
import { AppError } from './errors/AppError';
import { errorHandler } from './middleware/error.middleware';
import { globalLimiter } from './middleware/rateLimit.middleware';
import { connectRedis, disconnectRedis, isRedisAvailable } from './config/redis';
import { ENV } from './config/env';
import pool from './lib/mysql';
import { ChatModel } from './models/chatModel';

const app = express();
const server = http.createServer(app);

const CLIENT_URLS = (process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')
    .map(u => u.trim());
// Also allow common dev ports
if (!CLIENT_URLS.includes('http://localhost:3001')) CLIENT_URLS.push('http://localhost:3001');

const io = new SocketIOServer(server, {
    cors: {
        origin: CLIENT_URLS,
        credentials: true,
    },
});

// Fix #14: Socket.IO authentication middleware - use validated ENV config instead of process.env fallback
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
        (socket as unknown as Record<string, unknown>).user = decoded;
        next();
    } catch {
        next(new Error("Invalid token"));
    }
});

io.on('connection', (socket) => {
    const socketUser = (socket as unknown as Record<string, unknown>).user as { userID: number } | undefined;
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
        if (!msg || msg.Sender_ID !== socketUser.userID) return;

        socket.to(data.roomId).emit('newMessage', data.message);
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] disconnected: ${socket.id}`);
    });
});

app.set('io', io);

app.use(cors({
    origin: CLIENT_URLS,
    credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(globalLimiter);

app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api', apiRoutes);

app.use('/{*path}', (req, _res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

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
        console.log(`[Server]  running on http://localhost:${PORT}`);
        console.log(`[Server]  static files at http://localhost:${PORT}/uploads`);
        console.log(`[Server]  environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

// Graceful Shutdown
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
