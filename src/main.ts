
import { validateConfig, logger } from './config';
import { client, setupDiscordEventHandlers } from './discord-bot';
import { setupRoutes } from './express-server';
import { startServer, setupErrorHandlers } from './server';

async function main(): Promise<void> {
    logger.info('Starting CarnageRP Bot Verification...');
    
    // Validate configuration
    validateConfig();
    
    // Setup Discord bot
    setupDiscordEventHandlers();
    
    // Setup Express routes
    setupRoutes();
    
    // Setup error handlers
    setupErrorHandlers();
    
    // Start HTTPS server
    startServer();
    
    // Graceful shutdown handler
    process.on('SIGINT', (): void => {
        logger.info('Shutting down gracefully...');
        client.destroy();
        process.exit(0);
    });
    
    // Login to Discord
    await client.login(process.env.DISCORD_BOT_TOKEN);
}

// Start the application
main().catch((error) => {
    console.log('Failed to start application:', error);
    process.exit(1);
});