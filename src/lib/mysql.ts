import mysql from 'mysql2/promise';
import fs from 'fs';

// MySQL connection pool configured for the Aiven cloud database with SSL enabled.
// enableKeepAlive prevents ECONNRESET caused by the cloud server closing idle connections.
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ssl: {
        ca: fs.readFileSync(process.env.DB_SSL_CA ?? 'ca.pem'),
        rejectUnauthorized: true,
    },
});

export default pool;
