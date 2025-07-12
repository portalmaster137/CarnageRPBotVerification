// src/express-server.ts - Updated with mark as started route
import express, { Request, Response } from 'express';
import { engine } from 'express-handlebars';
import path from 'path';
import { config, logger } from './config';
import { handleRobloxAuth } from './roblox-auth';
import {
    CONTROLLER_PASSWORD,
    requireAuth,
    handleControllerLogin,
    handleControllerAuth,
    handleControllerDashboard,
    handleControllerLogout,
    handleRefreshButton,
    handleSystemInfo,
    handleDashboardData,
    handleLogs,
    handleCreateGameSignup,
    handleGetGameSignups,
    handleSendGameDM,
    handleMarkGameStarted
} from './controllers/controller';

export const app = express();
console.log(`dirname: ${__dirname}`);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/css', express.static(path.join(__dirname, '../public/css')));
app.use('/js', express.static(path.join(__dirname, '../public/js')));
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// Template engine setup
app.engine('hbs', engine({
    extname: 'hbs',
    defaultLayout: 'main',
    layoutsDir: path.join(__dirname, '../views/layouts'),
    partialsDir: path.join(__dirname, '../views/partials'),
    helpers: {
        // Custom helpers
        json: (obj: any) => JSON.stringify(obj),
        eq: (a: any, b: any) => a === b,
        formatDate: (date: Date) => date.toLocaleDateString(),
        formatTime: (date: Date) => date.toLocaleTimeString()
    }
}));

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, '../views'));

export function setupRoutes(): void {
    // Main routes - now using templates
    app.get('/', (req: Request, res: Response) => {
        logger.trace('Root page requested');
        res.redirect('/home');
    });

    app.get('/home', (req: Request, res: Response) => {
        logger.trace('Home page requested');
        res.render('home', { 
            title: 'Home',
            layout: 'main'
        });
    });

    app.get('/privacy', (req: Request, res: Response) => {
        logger.trace('Privacy page requested');
        res.render('privacy', { 
            title: 'Privacy Policy',
            layout: 'main'
        });
    });

    app.get('/terms', (req: Request, res: Response) => {
        logger.trace('Terms of Service page requested');
        res.render('terms', { 
            title: 'Terms of Service',
            layout: 'main'
        });
    });

    // OAuth route
    app.get('/auth/roblox', handleRobloxAuth);

    // Controller routes
    app.get('/controller', (req: Request, res: Response) => {
        res.redirect('/controller/login');
    });

    app.get('/controller/login', handleControllerLogin);
    app.post('/controller/auth', handleControllerAuth);
    app.get('/controller/dashboard', handleControllerDashboard);
    app.post('/controller/logout', requireAuth, handleControllerLogout);

    // Controller API routes
    app.post('/controller/api/refresh-button', requireAuth, handleRefreshButton);
    app.post('/controller/api/create-game-signup', requireAuth, handleCreateGameSignup);
    app.get('/controller/api/game-signups', requireAuth, handleGetGameSignups);
    app.post('/controller/api/send-game-dm', requireAuth, handleSendGameDM);
    app.post('/controller/api/mark-game-started', requireAuth, handleMarkGameStarted);
    app.get('/controller/api/system-info', requireAuth, handleSystemInfo);
    app.get('/controller/api/dashboard-data', requireAuth, handleDashboardData);
    app.get('/controller/api/logs', requireAuth, handleLogs);

    // Error handling middleware
    app.use((err: Error, req: Request, res: Response, next: Function) => {
        console.log('Express error:', err);
        res.status(500).render('error', {
            title: 'Server Error',
            message: 'An internal server error occurred',
            layout: 'main'
        });
    });

    // 404 handler
    app.use((req: Request, res: Response) => {
        res.status(404).render('error', {
            title: 'Page Not Found',
            message: 'The page you requested could not be found',
            layout: 'main'
        });
    });

    // Log the controller password on startup
    logger.info(`Controller password generated: ${CONTROLLER_PASSWORD}`);
}