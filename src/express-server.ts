import express, { Request, Response } from 'express';
import { config, logger } from './config';
import { handleRobloxAuth } from './roblox-auth'
import { homePage, privacyPage, tosPage } from './templates';

export const app = express();
app.use(express.json());

export function setupRoutes(): void {
    app.get('/', (req: Request, res: Response) => {
        logger.trace('Root page requested');
        res.redirect('/home');
    });

    app.get('/home', (req: Request, res: Response) => {
        logger.trace('Home page requested');
        res.send(homePage());
    });

    app.get('/privacy', (req: Request, res: Response) => {
        logger.trace('Privacy page requested');
        res.send(privacyPage());
    });

    app.get('/terms', (req: Request, res: Response) => {
        logger.trace('Terms of Service page requested');
        res.send(tosPage());
    });

    app.get('/auth/roblox', handleRobloxAuth);
}