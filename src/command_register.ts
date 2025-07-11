import { REST, Routes, SlashCommandBuilder } from "discord.js";
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
        .setName("ban")
        .setDefaultMemberPermissions(4) // 4 is the permission bit for Ban Members
        .setDescription("Ban a user from the Discord server")
        .addUserOption(option => 
            option.setName("user")
                .setDescription("The user to ban")
                .setRequired(true))
        .addStringOption(option => 
            option.setName("reason")
                .setDescription("The reason for the ban")
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName("roblox")
                .setDescription("Whether to also ban the user from Roblox from CARNAGE")
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName("duration")
                .setDescription("Duration of the ban in seconds. (Don't ask me why this is an integer, Discord API is weird)")
                .setRequired(false)),
        
].map(command => command.toJSON());

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN || "");

(async () => {
    try {
        logger.info("Started refreshing application (/) commands.");
        await rest.put(
            Routes.applicationGuildCommands("1393184196155150346", "1366158737433432084"),
            { body: commands}
        );
        logger.info("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.log("Error reloading application (/) commands:", error);
    }
})();