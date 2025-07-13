import { PermissionFlagsBits, REST, Routes, SlashCommandBuilder } from "discord.js";
import pino from "pino";
import dotenv from "dotenv";
dotenv.config();

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
        }
    }
});

const commands = [
    new SlashCommandBuilder()
        .setName('banroblox')
        .setDescription('Ban a user from Roblox')
        .addIntegerOption(option =>
            option.setName('userid')
                .setDescription('The Roblox user ID to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the ban')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('The duration of the ban in seconds. Roblox forces me to do in seconds, so I have to do it this way.')
                .setRequired(false)),

    new SlashCommandBuilder()
            .setName('unbanroblox')
            .setDescription('Unban a user from Roblox')
            .addIntegerOption(option =>
                option.setName('userid')
                    .setDescription('The Roblox user ID to unban')
                    .setRequired(true)),
    new SlashCommandBuilder()
            .setName('getrobloxban')
            .setDescription('Get the ban status of a user on Roblox')
            .addIntegerOption(option =>
                option.setName('userid')
                    .setDescription('The Roblox user ID to check')
                    .setRequired(true)),

        
].map(command => command.toJSON());

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN || "");

(async () => {
    try {
        logger.info("Started refreshing application (/) commands.");
        await rest.put(
            Routes.applicationGuildCommands("1393184196155150346", "1366158737433432084"),
            { body: commands}
        );
        await rest.put(
            Routes.applicationGuildCommands("1393184196155150346", "1384968001727627396"),
            { body: commands}
        );
        logger.info("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.log("Error reloading application (/) commands:", error);
    }
})();