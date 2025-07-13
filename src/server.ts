import fs from 'fs';
import https from 'https';
import { config, logger } from './config';
import { app } from './express-server';

export function createHttpsServer(): https.Server {
    const privKey = fs.existsSync(config.server.key_path) ? fs.readFileSync(config.server.key_path, 'utf8') : undefined;
    const certificate = fs.existsSync(config.server.cert_path) ? fs.readFileSync(config.server.cert_path, 'utf8') : undefined;

    const httpsOptions = {
        key: privKey,
        cert: certificate
    };

    return https.createServer(httpsOptions, app);
}

export function startServer(): void {
    const httpsServer = createHttpsServer();
    
    httpsServer.listen(config.server.port, () => {
        logger.info(`HTTPS Server running on port ${config.server.port}`);
    });
}

export function setupErrorHandlers(): void {
    process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>): void => {
        console.log('Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error: Error): void => {
        console.log('Uncaught Exception:', error);
        process.exit(1);
    });
}