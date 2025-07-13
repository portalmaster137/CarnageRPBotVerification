// src/controllers/controller.ts - Updated with notification role system
import { Request, Response } from 'express';
import crypto from 'crypto';
import { logger } from '../config';
import { TextChannel } from 'discord.js';

// Generate random password on startup
export const CONTROLLER_PASSWORD = crypto.randomBytes(16).toString('hex');

// Store active sessions (in production, use Redis or database)
const activeSessions = new Set<string>();

// Role ID for game notifications
const GAME_NOTIFICATION_ROLE_ID = '1393971165957193889';

// Generate session token
function generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

// Authentication middleware
export function requireAuth(req: Request, res: Response, next: Function): void {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || !activeSessions.has(token)) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
    }
    
    next();
}

// Controller route handlers - now just render templates
export async function handleControllerLogin(req: Request, res: Response): Promise<void> {
    res.render('controller/login', { 
        title: 'Controller Login',
        layout: 'controller-layout'
    });
}

export async function handleControllerAuth(req: Request, res: Response): Promise<Response> {
    const { password } = req.body;
    
    if (password !== CONTROLLER_PASSWORD) {
        logger.warn('Invalid controller login attempt');
        return res.status(401).json({ message: 'Invalid password' });
    }
    
    const sessionToken = generateSessionToken();
    activeSessions.add(sessionToken);
    
    logger.info('Controller login successful');
    return res.json({ token: sessionToken });
}

export async function handleControllerDashboard(req: Request, res: Response): Promise<void> {
    res.render('controller/dashboard', { 
        title: 'Controller Dashboard',
        layout: 'controller-layout'
    });
}

export async function handleControllerLogout(req: Request, res: Response): Promise<Response> {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (token) {
        activeSessions.delete(token);
    }
    
    return res.json({ message: 'Logged out successfully' });
}

// API endpoints - pure business logic
export async function handleRefreshButton(req: Request, res: Response): Promise<Response> {
    try {
        const { sendPersistentButton } = await import('../discord-bot');
        await sendPersistentButton();
        logger.info('Verification button refreshed via controller');
        return res.json({ message: 'Button refreshed successfully' });
    } catch (error) {
        console.log('Error refreshing button:', error);
        return res.status(500).json({ message: 'Failed to refresh button' });
    }
}

export async function handleSystemInfo(req: Request, res: Response): Promise<Response> {
    const systemInfo = {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        platform: process.platform,
        nodeVersion: process.version,
        activeSessions: activeSessions.size,
        timestamp: new Date().toISOString()
    };
    
    return res.json(systemInfo);
}

export async function handleDashboardData(req: Request, res: Response): Promise<Response> {
    // In a real application, you would fetch this from a database
    const dashboardData = {
        verificationsToday: 0,
        recentActivity: 'No recent activity logged'
    };
    
    return res.json(dashboardData);
}

export async function handleLogs(req: Request, res: Response): Promise<void> {
    // In a real application, you would read from log files
    const logs = `[${new Date().toISOString()}] Controller dashboard accessed
[${new Date().toISOString()}] System information requested
[${new Date().toISOString()}] Logs viewed`;
    
    res.type('text/plain').send(logs);
}

export async function handleGetGameSignups(req: Request, res: Response): Promise<Response> {
    try {
        const { getActiveGameSignups } = await import('../discord-bot');
        const gameSignups = getActiveGameSignups();
        
        return res.json(gameSignups);
    } catch (error) {
        console.log('Error fetching game signups:', error);
        return res.status(500).json({ message: 'Failed to fetch game signups' });
    }
}

export async function handleMarkGameStarted(req: Request, res: Response): Promise<Response> {
    try {
        const { messageId } = req.body;
        
        // Validation
        if (!messageId) {
            return res.status(400).json({ 
                message: 'Message ID is required' 
            });
        }
        
        const { markGameAsStarted } = await import('../discord-bot');
        const result = await markGameAsStarted(messageId);
        
        if (result.success) {
            logger.info(`Game marked as started via controller: ${messageId}`);
            return res.json({
                message: result.message
            });
        } else {
            return res.status(400).json({ 
                message: result.error || 'Failed to mark game as started'
            });
        }
        
    } catch (error) {
        console.log('Error marking game as started:', error);
        return res.status(500).json({ message: 'Failed to mark game as started' });
    }
}

export async function handleSendGameDM(req: Request, res: Response): Promise<Response> {
    try {
        const { messageId, subject, message } = req.body;
        
        // Validation
        if (!messageId || !subject || !message) {
            return res.status(400).json({ 
                message: 'Message ID, subject, and message content are required' 
            });
        }
        
        if (subject.length > 100) {
            return res.status(400).json({ 
                message: 'Subject must be 100 characters or less' 
            });
        }
        
        if (message.length > 2000) {
            return res.status(400).json({ 
                message: 'Message must be 2000 characters or less' 
            });
        }
        
        const { sendDMToGamePlayers } = await import('../discord-bot');
        const result = await sendDMToGamePlayers(messageId, subject, message);
        
        if (result.success) {
            logger.info(`DM sent to ${result.sentCount} players for game signup ${messageId}`);
            return res.json({
                message: `Successfully sent DM to ${result.sentCount} player(s)`,
                sentCount: result.sentCount,
                failedCount: result.failedCount,
                details: result.details
            });
        } else {
            return res.status(404).json({ 
                message: result.error || 'Game signup not found or no players signed up'
            });
        }
        
    } catch (error) {
        console.log('Error sending game DMs:', error);
        return res.status(500).json({ message: 'Failed to send DMs' });
    }
}

export async function handleCreateGameSignup(req: Request, res: Response): Promise<Response> {
    try {
        const { gameName, discordTimestamp, maxPlayers, notifyRole, gameDescription } = req.body;
        
        // Validation
        if (!gameName || !discordTimestamp || !maxPlayers) {
            return res.status(400).json({ message: 'Game name, Discord timestamp, and max players are required' });
        }
        
        if (maxPlayers < 1 || maxPlayers > 100) {
            return res.status(400).json({ message: 'Max players must be between 1 and 100' });
        }
        
        const timestampRegex = /<t:\d+:[RrDdFfTt]>/;
        if (!timestampRegex.test(discordTimestamp)) {
            return res.status(400).json({ message: 'Invalid Discord timestamp format. Use format: <t:1234567890:R>' });
        }
        
        // Discord integration
        const { client, addGameSignupMessage } = await import('../discord-bot');
        const { EmbedBuilder } = await import('discord.js');
        
        if (!client.isReady()) {
            return res.status(503).json({ message: 'Discord bot is not ready' });
        }
        
        const channel = await client.channels.fetch("1393296204405801030");
        if (!channel || !channel.isTextBased()) {
            return res.status(404).json({ message: 'Game signup channel not found' });
        }
        
        const embed = new EmbedBuilder()
            .setTitle('🎮 New Game Session Scheduled!')
            .setDescription(`**${gameName}**\n\n${gameDescription || 'Get ready for an exciting gaming session!'}`)
            .addFields([
                { name: '📅 When', value: `${discordTimestamp}`, inline: true },
                { name: '👥 Players', value: `0/${maxPlayers}`, inline: true },
                { name: '🎯 Status', value: 'Scheduled', inline: true },
                { name: '📝 How to Join', value: 'React with 🎮 to sign up for this session!', inline: false },
                { name: '🎮 Signed Up Players', value: '*No players signed up yet*', inline: false }
            ])
            .setColor(0x00ff00)
            .setTimestamp()
            .setFooter({ text: 'CarnageRP Game Scheduler' });
        
        // Create message content with optional role ping
        let messageContent = undefined;
        if (notifyRole) {
            messageContent = `<@&${GAME_NOTIFICATION_ROLE_ID}>`;
        }
        
        const message = await (channel as TextChannel).send({ 
            content: messageContent,
            embeds: [embed] 
        });
        
        await message.react('🎮');
        addGameSignupMessage(message.id, gameName, discordTimestamp, maxPlayers);
        
        logger.info(`Game signup created: ${gameName} at ${discordTimestamp} (max ${maxPlayers} players)${notifyRole ? ' with role notification' : ''}`);
        
        return res.json({ 
            message: 'Game signup created successfully',
            messageId: message.id,
            channelId: channel.id,
            notifyRole: notifyRole || false
        });
        
    } catch (error) {
        console.log('Error creating game signup:', error);
        return res.status(500).json({ message: 'Failed to create game signup' });
    }
}