import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';

import apiRoutes from './routes';
import { AppError } from './errors/AppError';
import { errorHandler } from './middleware/error.middleware';
import { globalLimiter } from './middleware/rateLimit.middleware';
import { connectRedis, disconnectRedis } from './config/redis';
import pool from './lib/mysql';

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:3000',
        credentials: true,
    },
});

io.on('connection', (socket) => {
    console.log(`[Socket] connected: ${socket.id}`);

    socket.on('join', (roomId: string) => {
        socket.join(roomId);
    });

    socket.on('leave', (roomId: string) => {
        socket.leave(roomId);
    });

    socket.on('sendMessage', (data: { roomId: string; message: unknown }) => {
        socket.to(data.roomId).emit('newMessage', data.message);
    });

    socket.on('disconnect', () => {
        console.log(`[Socket] disconnected: ${socket.id}`);
    });
});

app.set('io', io);

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
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

app.use('*', (req, _res, next) => {
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

    try {
        await connectRedis();
        console.log('[Redis] connected');
    } catch (err) {
        console.warn('[Redis] connection failed — server will run without cache:', err);
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
