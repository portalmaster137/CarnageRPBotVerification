import dotenv from 'dotenv';
import pino from 'pino';

dotenv.config();

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
        }
    }
});

export interface Config {
    bot: {
        token: string;
        guildId: string;
        channelId: string;
        firstRoleId: string;
        secondRoleId: string;
    };
    roblox: {
        oauthUrl: string;
        clientId: string;
        clientSecret: string;
    };
    server: {
        port: number;
        domain: string;
        cert_path: string;
        key_path: string;
    };
}

export const config: Config = {
    bot: {
        token: process.env.DISCORD_BOT_TOKEN || '',
        guildId: process.env.DISCORD_GUILD_ID || '',
        channelId: process.env.DISCORD_CHANNEL_ID || '',
        firstRoleId: process.env.FIRST_ROLE_ID || '',
        secondRoleId: process.env.SECOND_ROLE_ID || ''
    },
    roblox: {
        oauthUrl: process.env.ROBLOX_OAUTH_URL || '',
        clientId: process.env.ROBLOX_OAUTH_CLIENT_ID || '',
        clientSecret: process.env.ROBLOX_OAUTH_CLIENT_SECRET || ''
    },
    server: {
        port: parseInt(process.env.PORT || '3000'),
        domain: process.env.DOMAIN || 'http://localhost:3000',
        cert_path: process.env.CERT_PATH || '',
        key_path: process.env.KEY_PATH || '',
    }
};

export function validateConfig(): void {
    const requiredFields = [
        'DISCORD_BOT_TOKEN',
        'DISCORD_GUILD_ID',
        'DISCORD_CHANNEL_ID',
        'FIRST_ROLE_ID',
        'SECOND_ROLE_ID',
        'ROBLOX_OAUTH_URL',
        'ROBLOX_OAUTH_CLIENT_ID',
        'ROBLOX_OAUTH_CLIENT_SECRET',
        'PORT',
        'DOMAIN',
        'CERT_PATH',
        'KEY_PATH'
    ];

    const missingFields = requiredFields.filter(field => !process.env[field]);

    if (missingFields.length > 0) {
        console.log('Missing required environment variables:', missingFields.join(', '));
        process.exit(1);
    }
}

export { logger };