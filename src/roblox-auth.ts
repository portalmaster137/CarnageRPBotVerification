import { Request, Response } from 'express';
import axios, { AxiosResponse } from 'axios';
import { config, logger } from './config';
import { verifyStateJWT, truncateToken } from './utils';

export async function handleRobloxAuth(req: Request, res: Response): Promise<Response> {
    const { code, state } = req.query;
    
    if (!code || !state) {
        return res.status(400).send('Missing required oauth parameter.');
    }

    let userId: string | undefined;
    try {
        userId = await verifyStateJWT(state as string);
    } catch (error) {
        console.log('Error verifying state JWT:', error);
        return res.status(400).send('Invalid or expired state token. Please try again.');
    }

    try {
        logger.info(`Received code: ${truncateToken(code as string)}, state: ${truncateToken(state as string)}`);
        
        // Exchange code for access token
        const tokenResponse: AxiosResponse = await axios.post('https://apis.roblox.com/oauth/v1/token', {
            grant_type: 'authorization_code',
            code: code,
            client_id: config.roblox.clientId,
            client_secret: config.roblox.clientSecret,
            redirect_uri: `${config.server.domain}/auth/roblox`,
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        });

        const accessToken = tokenResponse.data.access_token;
        logger.info(`Access token received: ${truncateToken(accessToken)}`);

        // Get user info
        const userResponse: AxiosResponse = await axios.get('https://apis.roblox.com/oauth/v1/userinfo', {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        logger.debug(`User response received: ${JSON.stringify(userResponse.data)}`);

        const robloxUserId = userResponse.data.sub;

        // Get user details including verification status
        const userdetails: AxiosResponse = await axios.get(`https://apis.roblox.com/cloud/v2/users/${robloxUserId}`, {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        });
        logger.debug(`User details received: ${JSON.stringify(userdetails.data)}`);

        const idVerified = userdetails.data.idVerified;
        const roleId = idVerified ? config.bot.secondRoleId : config.bot.firstRoleId;

        // Assign role to Discord user
        await axios.put(`https://discord.com/api/v10/guilds/${config.bot.guildId}/members/${userId}/roles/${roleId}`, {}, {
            headers: {
                Authorization: `Bot ${config.bot.token}`,
            }
        });
        logger.info(`Role ${roleId} assigned to user ${userId}`);

        // Update nickname
        try {
            await axios.patch(`https://discord.com/api/v10/guilds/${config.bot.guildId}/members/${userId}`, {
            nick: `${userdetails.data.displayName} (${robloxUserId})`
            }, {
            headers: {
                Authorization: `Bot ${config.bot.token}`,
            }
            });
            logger.info(`Nickname updated for user ${userId} to ${userdetails.data.displayName} (${robloxUserId})`);
        } catch (err) {
            console.log(`Failed to update nickname for user ${userId}:`, err);
        }

        return res.status(200).send('Role assigned successfully! You can now close this window.');
    } catch (error) {
        console.log('Error during Roblox OAuth process:', error);
        return res.status(500).send('Internal Server Error');
    }
}