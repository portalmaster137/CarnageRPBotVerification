import express, { Request, Response } from 'express';
import { config, logger } from './config';
import { handleRobloxAuth } from './roblox-auth'

export const app = express();
app.use(express.json());

export function setupRoutes(): void {
    app.get('/', (req: Request, res: Response) => {
        res.send("This bot is not meant to be used directly. Please use via the communication server to authorize your account.");
    });

    app.get('/privacy', (req: Request, res: Response) => {
        res.send("This bot collects minimal data necessary for operation. It does not store any personal information beyond what is required for checking if your id is verified on Roblox. The bot does not share any data with third parties except for the necessary OAuth2 process with Roblox and Discord.");
    });

    app.get('/tos', (req: Request, res: Response) => {
        res.send("By using this bot, you agree to the following terms:\n1. You must have a valid Roblox account.\n2. You must not use this bot for any malicious purposes.\n3. The bot will assign roles based on your Roblox account verification status.\n4. The bot reserves the right to revoke access at any time if it detects misuse.\n5. The bot is provided 'as is' without any warranties or guarantees.\n6. You agree to comply with Discord's Terms of Service and Community Guidelines.\n7. You agree to comply with Roblox's Terms of Service and Community Standards.");
    });

    app.get('/auth/roblox', handleRobloxAuth);
}