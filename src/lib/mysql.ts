import mysql from 'mysql2/promise';
import path from 'path';
import fs from 'fs';
import { ENV } from '../config/env';

// MySQL connection pool configured for the Aiven cloud database with SSL enabled.
// enableKeepAlive prevents ECONNRESET caused by the cloud server closing idle connections.
const pool = mysql.createPool({
    host: ENV.DB_HOST,
    user: ENV.DB_USER,
    password: ENV.DB_PASS,
    database: ENV.DB_NAME,
    port: ENV.DB_PORT,
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ssl: {
        ca: fs.readFileSync(ENV.DB_SSL_CA ?? path.join(process.cwd(), 'ca.pem')),
        rejectUnauthorized: true,
    },
});

export default pool;
