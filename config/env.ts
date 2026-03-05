import "dotenv/config";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_ISSUER = process.env.JWT_ISSUER;
const JWT_AUDIENCE = process.env.JWT_AUDIENCE;
const JWT_EXPIRES_IN = Number(process.env.JWT_EXPIRES_IN);
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN;


if (!JWT_SECRET) throw new Error("JWT_SECRET is not defined in environment variables");
if (!JWT_ISSUER) throw new Error("JWT_ISSUER is not defined in environment variables");
if (!JWT_AUDIENCE) throw new Error("JWT_AUDIENCE is not defined in environment variables");
if (!JWT_EXPIRES_IN || isNaN(JWT_EXPIRES_IN)) throw new Error("JWT_EXPIRES_IN is not defined or is not a valid number");

export const ENV = {
    JWT_SECRET,
    JWT_ISSUER,
    JWT_AUDIENCE,
    JWT_EXPIRES_IN,
    JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN,
};