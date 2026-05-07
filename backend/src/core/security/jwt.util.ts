import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { APP_CONSTANTS } from "../../config/constants";

const JWT_SECRET: jwt.Secret = env.jwtSecret || "fallback-secret";

export interface TokenPayload {
    userId: string;
    email: string;
    name?: string;
}

export const generateToken = (payload: TokenPayload): string => {
    const options: SignOptions = { expiresIn: 60 * 60 * 24 }; // 24 hours in seconds
    return jwt.sign(payload as object, JWT_SECRET, options);
};

export const verifyToken = (token: string): TokenPayload => {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
};

export const decodeToken = (token: string): TokenPayload | null => {
    try {
        return jwt.decode(token) as TokenPayload;
    } catch {
        return null;
    }
};
