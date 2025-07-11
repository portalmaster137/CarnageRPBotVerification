// src/discord-bot.ts - Updated with game start functionality
import {
    Client,
    GatewayIntentBits,
    ButtonBuilder,
    ActionRowBuilder,
    ButtonStyle,
    EmbedBuilder,
    Interaction,
    ButtonInteraction,
    TextChannel,
    MessageReaction,
    User,
    PartialMessageReaction,
    PartialUser,
    Message
} from 'discord.js';
import { config, logger } from './config';
import { signStateJWT } from './utils';

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessageReactions,
    ]
});

// Enhanced interface for game signup tracking
interface GameSignupData {
    gameName: string;
    timestamp: string;
    maxPlayers?: number;
    players: Set<string>; // Store user IDs
    pingEveryone?: boolean;
    status: 'scheduled' | 'started' | 'completed'; // Added status tracking
}

// Store game signup messages for reaction tracking
const gameSignupMessages = new Map<string, GameSignupData>();

export async function sendPersistentButton(): Promise<void> {
    try {
        const channel = await client.channels.fetch(config.bot.channelId) as TextChannel;
        if (!channel || !channel.isTextBased()) {
            logger.error('Channel not found or is not a text channel');
            return;
        }
        const messages = await channel.messages.fetch({ limit: 10 });
        const botMessages = messages.filter(msg => msg.author.id === client.user?.id && msg.embeds.length > 0 && msg.embeds[0].title === 'Account Verification');
        if (botMessages.size > 0) {
            await channel.bulkDelete(botMessages);
        }
        const button = new ButtonBuilder()
            .setCustomId('verify_account')
            .setLabel('Verify Account')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('✅');
        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
        const embed = new EmbedBuilder()
            .setTitle('Account Verification')
            .setDescription('Click the button below to verify your account and receive your role!')
            .setColor(0x5865F2)
            .addFields([
                {
                    name: 'How it works:',
                    value: '1. Click the "Verify Account" button\n2. Check your DMs for a verification link\n3. Complete the OAuth2 process\n4. Receive your role automatically!',
                    inline: false
                }
            ]);
        await channel.send({ embeds: [embed], components: [row] });
        logger.info('Persistent button sent successfully');
    } catch (error) {
        logger.error('Error sending persistent button:', error);
    }
}

async function updateGameSignupEmbed(message: Message, gameData: GameSignupData): Promise<void> {
    try {
        const userCount = gameData.players.size;
        const maxPlayers = gameData.maxPlayers;
        
        // Get user display names
        let playersList = 'No players signed up yet';
        if (userCount > 0) {
            const playerNames: string[] = [];
            for (const userId of gameData.players) {
                try {
                    const user = await client.users.fetch(userId);
                    playerNames.push(user.displayName || user.username);
                } catch (error) {
                    logger.error(`Error fetching user ${userId}:`, error);
                    playerNames.push('Unknown User');
                }
            }
            playersList = playerNames.join('\n');
        }
        
        // Build attendees field value
        let attendeesValue = `${userCount} player${userCount !== 1 ? 's' : ''} signed up`;
        if (maxPlayers) {
            attendeesValue += ` (${userCount}/${maxPlayers})`;
        }
        
        // Determine embed color and status based on game status
        let embedColor = 0x00ff00; // Green by default
        let statusEmoji = '🎮';
        let statusText = 'Scheduled';
        let howToJoinText = 'React with 🎮 to sign up for this session!';
        
        if (gameData.status === 'started') {
            embedColor = 0xff9900; // Orange for started
            statusEmoji = '🔴';
            statusText = 'Game Started';
            howToJoinText = '🔴 This game session has started!';
        } else if (gameData.status === 'completed') {
            embedColor = 0x808080; // Gray for completed
            statusEmoji = '✅';
            statusText = 'Completed';
            howToJoinText = '✅ This game session has ended.';
        } else if (maxPlayers && userCount >= maxPlayers) {
            embedColor = 0xff0000; // Red when full
        } else if (maxPlayers && userCount >= maxPlayers * 0.75) {
            embedColor = 0xff9900; // Orange when 75% full
        }
        
        // Create embed title with status
        const embedTitle = gameData.status === 'started' 
            ? `🔴 Game Session Started!`
            : gameData.status === 'completed'
            ? `✅ Game Session Completed`
            : `🎮 Game Session Scheduled`;
        
        const embed = new EmbedBuilder()
            .setTitle(embedTitle)
            .setDescription(`**${gameData.gameName}**`)
            .setColor(embedColor)
            .setFields([
                {
                    name: '📅 When',
                    value: gameData.timestamp,
                    inline: true
                },
                {
                    name: '👥 Attendees',
                    value: attendeesValue,
                    inline: true
                },
                {
                    name: `${statusEmoji} Status`,
                    value: statusText,
                    inline: true
                },
                {
                    name: '🎮 Players',
                    value: playersList,
                    inline: false
                },
                {
                    name: '📝 Status',
                    value: gameData.status === 'started' && userCount >= (maxPlayers || 999)
                        ? '❌ This session is full and has started!'
                        : gameData.status !== 'scheduled'
                        ? howToJoinText
                        : maxPlayers && userCount >= maxPlayers 
                        ? '❌ This session is full!' 
                        : howToJoinText,
                    inline: false
                }
            ])
            .setTimestamp()
            .setFooter({ text: 'CarnageRP Game Scheduler' });
        
        await message.edit({ embeds: [embed] });
        logger.info(`Updated game signup embed for "${gameData.gameName}" - Status: ${gameData.status}, ${userCount}${maxPlayers ? `/${maxPlayers}` : ''} attendees`);
    } catch (error) {
        logger.error('Error updating game signup embed:', error);
    }
}

export function addGameSignupMessage(messageId: string, gameName: string, timestamp: string, maxPlayers?: number, pingEveryone?: boolean): void {
    gameSignupMessages.set(messageId, { 
        gameName, 
        timestamp, 
        maxPlayers,
        players: new Set<string>(),
        pingEveryone,
        status: 'scheduled'
    });
    logger.info(`Added game signup message tracking: ${messageId} - ${gameName}${maxPlayers ? ` (max: ${maxPlayers})` : ''}${pingEveryone ? ' with @everyone ping' : ''}`);
}

export function getActiveGameSignups(): Array<{
    messageId: string;
    gameName: string;
    timestamp: string;
    maxPlayers?: number;
    playerCount: number;
    players: string[];
    status: string;
}> {
    const signups = [];
    
    for (const [messageId, gameData] of gameSignupMessages) {
        // Only return scheduled games for the UI (active signups)
        if (gameData.status === 'scheduled') {
            signups.push({
                messageId,
                gameName: gameData.gameName,
                timestamp: gameData.timestamp,
                maxPlayers: gameData.maxPlayers,
                playerCount: gameData.players.size,
                players: Array.from(gameData.players),
                status: gameData.status
            });
        }
    }
    
    return signups;
}

export async function markGameAsStarted(messageId: string): Promise<{
    success: boolean;
    message: string;
    error?: string;
}> {
    const gameData = gameSignupMessages.get(messageId);
    
    if (!gameData) {
        return {
            success: false,
            message: '',
            error: 'Game signup not found'
        };
    }
    
    if (gameData.status !== 'scheduled') {
        return {
            success: false,
            message: '',
            error: `Game is already ${gameData.status}`
        };
    }
    
    try {
        // Update status
        gameData.status = 'started';
        
        // Fetch the message and update the embed
        const channel = await client.channels.fetch("1393296204405801030");
        if (!channel || !channel.isTextBased()) {
            return {
                success: false,
                message: '',
                error: 'Game signup channel not found'
            };
        }
        
        const message = await (channel as TextChannel).messages.fetch(messageId);
        await updateGameSignupEmbed(message, gameData);
        
        // Remove from tracking after a delay (optional - you can remove this if you want to keep started games tracked)
        setTimeout(() => {
            gameSignupMessages.delete(messageId);
            logger.info(`Removed started game from tracking: ${gameData.gameName}`);
        }, 5 * 60 * 1000); // Remove after 5 minutes
        
        logger.info(`Game "${gameData.gameName}" marked as started with ${gameData.players.size} players`);
        
        return {
            success: true,
            message: `Game "${gameData.gameName}" has been marked as started`
        };
        
    } catch (error) {
        logger.error('Error marking game as started:', error);
        return {
            success: false,
            message: '',
            error: 'Failed to update game status'
        };
    }
}

export async function sendDMToGamePlayers(messageId: string, subject: string, message: string): Promise<{
    success: boolean;
    sentCount: number;
    failedCount: number;
    details: string[];
    error?: string;
}> {
    const gameData = gameSignupMessages.get(messageId);
    
    if (!gameData) {
        return {
            success: false,
            sentCount: 0,
            failedCount: 0,
            details: [],
            error: 'Game signup not found'
        };
    }
    
    if (gameData.players.size === 0) {
        return {
            success: false,
            sentCount: 0,
            failedCount: 0,
            details: [],
            error: 'No players signed up for this game'
        };
    }
    
    let sentCount = 0;
    let failedCount = 0;
    const details: string[] = [];
    
    const embed = new EmbedBuilder()
        .setTitle(`📢 ${subject}`)
        .setDescription(message)
        .setColor(0x667eea)
        .addFields([
            { 
                name: '🎮 Game Session', 
                value: gameData.gameName, 
                inline: true 
            },
            { 
                name: '📅 Scheduled Time', 
                value: gameData.timestamp, 
                inline: true 
            },
            {
                name: '🎯 Status',
                value: gameData.status.charAt(0).toUpperCase() + gameData.status.slice(1),
                inline: true
            }
        ])
        .setTimestamp()
        .setFooter({ text: 'CarnageRP Game Notification' });
    
    // Send DM to each player
    for (const userId of gameData.players) {
        try {
            const user = await client.users.fetch(userId);
            await user.send({ embeds: [embed] });
            
            sentCount++;
            details.push(`✅ Sent to ${user.displayName || user.username} (${userId})`);
            logger.info(`DM sent to ${user.tag} for game: ${gameData.gameName}`);
            
            // Add a small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
            
        } catch (error) {
            failedCount++;
            details.push(`❌ Failed to send to ${userId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            logger.error(`Failed to send DM to ${userId}:`, error);
        }
    }
    
    logger.info(`DM batch completed for game "${gameData.gameName}": ${sentCount} sent, ${failedCount} failed`);
    
    return {
        success: sentCount > 0,
        sentCount,
        failedCount,
        details
    };
}

export function setupDiscordEventHandlers(): void {
    client.once('ready', async () => {
        logger.info(`Logged in as ${client.user?.tag}`);
        await sendPersistentButton();
    });

    client.on('interactionCreate', async (interaction: Interaction) => {
        if (!interaction.isButton()) return;
        const buttonInteraction = interaction as ButtonInteraction;
        logger.info(`Button interaction received from ${interaction.user.tag} with ID: ${buttonInteraction.customId}`);
        
        if (buttonInteraction.customId === 'verify_account') {
            const state = await signStateJWT(interaction.user.id);
            const robloxOAuthUrl = `${config.roblox.oauthUrl}&state=${state}`;
            await buttonInteraction.reply({
                content: `Click the link to verify your account: [Verify Account](${robloxOAuthUrl})`,
                flags: "Ephemeral"
            });
            logger.info(`Verification link sent to ${interaction.user.tag}`);
        }
    });

    // Handle reaction additions
    client.on('messageReactionAdd', async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
        try {
            // Fetch partial reactions/users
            if (reaction.partial) {
                await reaction.fetch();
            }
            if (user.partial) {
                await user.fetch();
            }

            // Ignore bot reactions
            if (user.bot) return;

            // Check if this is a game signup message
            const gameData = gameSignupMessages.get(reaction.message.id);
            if (gameData && reaction.emoji.name === '🎮') {
                // Don't allow signups for started or completed games
                if (gameData.status !== 'scheduled') {
                    await reaction.users.remove(user.id);
                    logger.info(`${user.tag} tried to sign up for ${gameData.status} game: ${gameData.gameName}`);
                    return;
                }
                
                // Check if session is full
                if (gameData.maxPlayers && gameData.players.size >= gameData.maxPlayers) {
                    // Remove the reaction if the session is full
                    await reaction.users.remove(user.id);
                    logger.info(`${user.tag} tried to sign up for full game: ${gameData.gameName}`);
                    return;
                }
                
                // Add user to players set
                gameData.players.add(user.id);
                logger.info(`${user.tag} signed up for game: ${gameData.gameName} (${gameData.players.size}${gameData.maxPlayers ? `/${gameData.maxPlayers}` : ''})`);
                
                await updateGameSignupEmbed(reaction.message as Message, gameData);
            }
        } catch (error) {
            logger.error('Error handling reaction add:', error);
        }
    });

    // Handle reaction removals
    client.on('messageReactionRemove', async (reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) => {
        try {
            // Fetch partial reactions/users
            if (reaction.partial) {
                await reaction.fetch();
            }
            if (user.partial) {
                await user.fetch();
            }

            // Ignore bot reactions
            if (user.bot) return;

            // Check if this is a game signup message
            const gameData = gameSignupMessages.get(reaction.message.id);
            if (gameData && reaction.emoji.name === '🎮') {
                // Don't allow removing reactions from started or completed games
                if (gameData.status !== 'scheduled') {
                    logger.info(`${user.tag} tried to remove signup from ${gameData.status} game: ${gameData.gameName}`);
                    return;
                }
                
                // Remove user from players set
                gameData.players.delete(user.id);
                logger.info(`${user.tag} cancelled signup for game: ${gameData.gameName} (${gameData.players.size}${gameData.maxPlayers ? `/${gameData.maxPlayers}` : ''})`);
                
                await updateGameSignupEmbed(reaction.message as Message, gameData);
            }
        } catch (error) {
            logger.error('Error handling reaction remove:', error);
        }
    });
}