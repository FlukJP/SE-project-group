import mysql from "mysql2/promise";
import path from "path";
import fs from "fs";
import { ENV } from "../config/env";

// SSL CA
const resolveCA = (): Buffer => {
    const caValue = ENV.DB_SSL_CA ?? "ca.pem";

    if (path.isAbsolute(caValue)) {
        return fs.readFileSync(caValue);
    }

    const fromCwd = path.resolve(process.cwd(), caValue);
    if (fs.existsSync(fromCwd)) return fs.readFileSync(fromCwd);

    const fromFile = path.resolve(__dirname, "../../", caValue);
    if (fs.existsSync(fromFile)) return fs.readFileSync(fromFile);

    throw new Error(
        `[MySQL] SSL CA file not found: "${caValue}"\n` +
        `Tried:\n  - ${fromCwd}\n  - ${fromFile}\n` +
        `Set DB_SSL_CA to an absolute path in your environment variables.`
    );
};

// POOL
// MySQL connection pool for Aiven cloud DB with SSL.
// enableKeepAlive prevents ECONNRESET from cloud server closing idle connections.
const pool = mysql.createPool({
    host: ENV.DB_HOST,
    user: ENV.DB_USER,
    password: ENV.DB_PASS,
    database: ENV.DB_NAME,
    port: ENV.DB_PORT,
    charset: "utf8mb4",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10_000,
    ssl: {
        ca: resolveCA(),
        rejectUnauthorized: true,
    },
});

pool.on("connection", () => {
    console.log("[MySQL] New connection established");
});

export default pool;