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
} from 'discord.js';
import { config, logger } from './config';
import { signStateJWT } from './utils';

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.MessageContent,
    ]
});

export async function sendPersistentButton(): Promise<void> {
    try {
        const channel = await client.channels.fetch(config.bot.channelId) as TextChannel;
        if (!channel || !channel.isTextBased()) {
            logger.error('Channel not found or is not a text channel');
            return;
        }
        const messages = await channel.messages.fetch({ limit: 10 });
        const botMessages = messages.filter(msg => msg.author.id === client.user?.id);
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
                ephemeral: true
            });
            logger.info(`Verification link sent to ${interaction.user.tag}`);
        }
    });
}