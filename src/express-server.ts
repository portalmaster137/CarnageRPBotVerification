import express, { Request, Response } from 'express';
import { config, logger } from './config';
import { handleRobloxAuth } from './roblox-auth'
import { homePage, privacyPage, tosPage } from './templates';
import { handleControllerLogin, handleControllerAuth, handleControllerDashboard, requireAuth, handleControllerLogout, handleRefreshButton, handleSystemInfo, handleDashboardData, handleLogs, CONTROLLER_PASSWORD } from './controller';

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

    app.get('/controller', (req: Request, res: Response) => {
        res.redirect('/controller/login');
    });

    app.get('/controller/login', handleControllerLogin);
    app.post('/controller/auth', handleControllerAuth);
    app.get('/controller/dashboard', handleControllerDashboard);
    app.post('/controller/logout', requireAuth, handleControllerLogout);

    // Controller API routes
    app.post('/controller/api/refresh-button', requireAuth, handleRefreshButton);
    app.get('/controller/api/system-info', requireAuth, handleSystemInfo);
    app.get('/controller/api/dashboard-data', requireAuth, handleDashboardData);
    app.get('/controller/api/logs', requireAuth, handleLogs);

    // Log the controller password on startup
    logger.info(`Controller password generated: ${CONTROLLER_PASSWORD}`);
}