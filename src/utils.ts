import crypto from 'crypto';
import jose from 'jose';
import { logger } from './config';
import axios from 'axios';

const JWT_ENCRYPTION_KEY = crypto.randomBytes(64).toString('base64');
logger.debug(`JWT Encryption Key: ${JWT_ENCRYPTION_KEY}`);

export function truncateToken(token: string): string {
    if (token.length <= 4) return token;
    return `${token.slice(0, 4)}...${token.slice(-4)}`;
}

export async function signStateJWT(userid: string): Promise<string> {
    const payload = { userid: userid, timestamp: Date.now() };
    const secret = new TextEncoder().encode(JWT_ENCRYPTION_KEY);
    const jwt = await new jose.SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setIssuer('CarnageRPBotVerification')
        .setExpirationTime('5m')
        .sign(secret);
    logger.info(`JWT signed for user ${userid}: ${truncateToken(jwt)}`);
    return jwt;
}

export async function getRobloxUserIDFromUsername(username: string): Promise<number> {
    try {
        const resp = await axios.post('https://users.roblox.com/v1/usernames/users', {
            usernames: [username],
            excludeBannedUsers: true
        });
        if (resp.data.data.length === 0) {
            return -1; // User not found
        }
        return resp.data.data[0].id;
    } catch (error) {
        logger.error(`Failed to fetch Roblox user ID for username ${username}:`, error);
        throw new Error('Failed to fetch Roblox user ID');
    }
}

export async function verifyStateJWT(token: string): Promise<string> {
    try {
        const secret = new TextEncoder().encode(JWT_ENCRYPTION_KEY);
        const { payload } = await jose.jwtVerify(token, secret, {
            algorithms: ['HS256'],
            issuer: 'CarnageRPBotVerification'
        });
        logger.info(`JWT verified successfully for user ${payload.userid}`);
        return payload.userid as string;
    } catch (error) {
        logger.error('JWT verification failed:', error);
        throw new Error('Invalid or expired token');
    }
}