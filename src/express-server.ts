import express, { Request, Response } from 'express';
import { config, logger } from './config';
import { handleRobloxAuth } from './roblox-auth'
import { homePage, privacyPage, tosPage } from './templates';

export const app = express();
app.use(express.json());

export function setupRoutes(): void {
    app.get('/', (req: Request, res: Response) => {
        res.send(homePage());
    });

    app.get('/privacy', (req: Request, res: Response) => {
        res.send(privacyPage());
    });

    app.get('/tos', (req: Request, res: Response) => {
        res.send(tosPage());
    });

    app.get('/auth/roblox', handleRobloxAuth);
}