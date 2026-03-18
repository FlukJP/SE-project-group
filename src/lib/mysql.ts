import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST_AIVEN,
    user: process.env.DB_USER_AIVEN,
    password: process.env.DB_PASSWORD_AIVEN,
    database: process.env.DB_NAME_AIVEN,
    port: Number(process.env.DB_PORT_AIVEN),
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: false,
    }
});

export default pool;