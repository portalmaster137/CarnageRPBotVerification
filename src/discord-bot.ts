// src/discord-bot.ts
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
        
        // Determine embed color based on capacity
        let embedColor = 0x00ff00; // Green by default
        if (maxPlayers) {
            if (userCount >= maxPlayers) {
                embedColor = 0xff0000; // Red when full
            } else if (userCount >= maxPlayers * 0.75) {
                embedColor = 0xff9900; // Orange when 75% full
            }
        }
        
        const embed = EmbedBuilder.from(message.embeds[0])
            .setColor(embedColor)
            .setFields([
                {
                    name: '📅 When',
                    value: message.embeds[0].fields[0].value,
                    inline: true
                },
                {
                    name: '👥 Attendees',
                    value: attendeesValue,
                    inline: true
                },
                {
                    name: '🎮 Players',
                    value: playersList,
                    inline: false
                },
                {
                    name: '📝 How to Join',
                    value: maxPlayers && userCount >= maxPlayers 
                        ? '❌ This session is full!' 
                        : 'React with 🎮 to sign up for this session!',
                    inline: false
                }
            ]);
        
        await message.edit({ embeds: [embed] });
        logger.info(`Updated game signup embed for "${gameData.gameName}" - ${userCount}${maxPlayers ? `/${maxPlayers}` : ''} attendees`);
    } catch (error) {
        logger.error('Error updating game signup embed:', error);
    }
}

export function addGameSignupMessage(messageId: string, gameName: string, timestamp: string, maxPlayers?: number): void {
    gameSignupMessages.set(messageId, { 
        gameName, 
        timestamp, 
        maxPlayers,
        players: new Set<string>()
    });
    logger.info(`Added game signup message tracking: ${messageId} - ${gameName}${maxPlayers ? ` (max: ${maxPlayers})` : ''}`);
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