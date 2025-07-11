// src/controller.ts
import { Request, Response } from 'express';
import crypto from 'crypto';
import { logger } from './config';
import { baseTemplate } from './templates';
import { TextChannel } from 'discord.js';

// Generate random password on startup
export const CONTROLLER_PASSWORD = crypto.randomBytes(16).toString('hex');

// Store active sessions (in production, use Redis or database)
const activeSessions = new Set<string>();

// Generate session token
function generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

// Controller login page template
export const controllerLoginPage = (): string => baseTemplate('Controller Login', `
    <h1>🔐 Controller Access</h1>
    
    <div class="section">
        <form id="loginForm" style="max-width: 400px; margin: 0 auto;">
            <div style="margin-bottom: 1rem;">
                <label for="password" style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Access Password:</label>
                <input 
                    type="password" 
                    id="password" 
                    name="password" 
                    required 
                    style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 0.5rem; font-size: 1rem;"
                    placeholder="Enter controller password"
                />
            </div>
            <button 
                type="submit" 
                style="width: 100%; padding: 0.75rem; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 0.5rem; font-size: 1rem; font-weight: bold; cursor: pointer; transition: all 0.3s ease;"
                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.3)'"
                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none'"
            >
                Login
            </button>
        </form>
        
        <div id="error-message" style="margin-top: 1rem; padding: 1rem; background: #fee; border: 1px solid #fcc; border-radius: 0.5rem; color: #c33; display: none;"></div>
    </div>

    <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('error-message');
            
            try {
                const response = await fetch('/controller/auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ password })
                });
                
                if (response.ok) {
                    const result = await response.json();
                    // Store session token in localStorage
                    localStorage.setItem('controller_session', result.token);
                    window.location.href = '/controller/dashboard';
                } else {
                    const error = await response.json();
                    errorDiv.textContent = error.message || 'Invalid password';
                    errorDiv.style.display = 'block';
                }
            } catch (error) {
                errorDiv.textContent = 'Network error. Please try again.';
                errorDiv.style.display = 'block';
            }
        });
    </script>
`);

// Controller dashboard template
export const controllerDashboardPage = (): string => baseTemplate('Controller Dashboard', `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
        <h1>🎮 Controller Dashboard</h1>
        <button 
            onclick="logout()" 
            style="padding: 0.5rem 1rem; background: #dc3545; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: bold;"
        >
            Logout
        </button>
    </div>

    <div class="section">
        <h2>📊 System Status</h2>
        <div class="feature-grid">
            <div class="feature-card">
                <div class="feature-icon">🤖</div>
                <div class="feature-title">Bot Status</div>
                <div class="feature-description">
                    <span id="bot-status" style="color: #28a745; font-weight: bold;">Online</span>
                </div>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🔐</div>
                <div class="feature-title">Server Status</div>
                <div class="feature-description">
                    <span id="server-status" style="color: #28a745; font-weight: bold;">Running</span>
                </div>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📈</div>
                <div class="feature-title">Verifications Today</div>
                <div class="feature-description">
                    <span id="verifications-count" style="color: #007bff; font-weight: bold;">0</span>
                </div>
            </div>
        </div>
    </div>

    <div class="section">
        <h2>🛠️ Quick Actions</h2>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <button 
                onclick="refreshButton()" 
                style="padding: 1rem; background: #007bff; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: bold; transition: all 0.3s ease;"
                onmouseover="this.style.transform='translateY(-2px)'"
                onmouseout="this.style.transform='translateY(0)'"
            >
                🔄 Refresh Verification Button
            </button>
            
            <button 
                onclick="showGameSignupForm()" 
                style="padding: 1rem; background: #17a2b8; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: bold; transition: all 0.3s ease;"
                onmouseover="this.style.transform='translateY(-2px)'"
                onmouseout="this.style.transform='translateY(0)'"
            >
                🎮 Create Game Signup
            </button>
            
            <button 
                onclick="showSystemInfo()" 
                style="padding: 1rem; background: #28a745; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: bold; transition: all 0.3s ease;"
                onmouseover="this.style.transform='translateY(-2px)'"
                onmouseout="this.style.transform='translateY(0)'"
            >
                ℹ️ System Information
            </button>
            
            <button 
                onclick="viewLogs()" 
                style="padding: 1rem; background: #ffc107; color: black; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: bold; transition: all 0.3s ease;"
                onmouseover="this.style.transform='translateY(-2px)'"
                onmouseout="this.style.transform='translateY(0)'"
            >
                📋 View Logs
            </button>
        </div>
    </div>

    <div class="section">
        <h2>📝 Recent Activity</h2>
        <div id="recent-activity" style="background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; min-height: 200px;">
            <p style="color: #666; font-style: italic;">Loading recent activity...</p>
        </div>
    </div>

    <div id="modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000;" onclick="closeModal()">
        <div style="background: white; margin: 5% auto; padding: 2rem; width: 80%; max-width: 600px; border-radius: 1rem; max-height: 80vh; overflow-y: auto;" onclick="event.stopPropagation()">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h2 id="modal-title">Modal Title</h2>
                <button onclick="closeModal()" style="background: none; border: none; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            <div id="modal-content">Modal content goes here</div>
        </div>
    </div>

    <script>
        // Authentication check
        const session = localStorage.getItem('controller_session');
        if (!session) {
            window.location.href = '/controller/login';
        }

        // Logout function
        function logout() {
            localStorage.removeItem('controller_session');
            fetch('/controller/logout', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + session
                }
            });
            window.location.href = '/controller/login';
        }

        // Quick action functions
        async function refreshButton() {
            try {
                const response = await fetch('/controller/api/refresh-button', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + session
                    }
                });
                
                if (response.ok) {
                    alert('Verification button refreshed successfully!');
                } else {
                    alert('Failed to refresh button');
                }
            } catch (error) {
                alert('Error: ' + error.message);
            }
        }

        function showGameSignupForm() {
            document.getElementById('modal-title').textContent = 'Create Game Signup';
            document.getElementById('modal-content').innerHTML = \`
                <form id="gameSignupForm" style="display: flex; flex-direction: column; gap: 1rem;">
                    <div>
                        <label for="gameName" style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Game Name:</label>
                        <input 
                            type="text" 
                            id="gameName" 
                            name="gameName" 
                            required 
                            style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 0.5rem; font-size: 1rem;"
                            placeholder="e.g., CarnageRP Session #42"
                        />
                    </div>
                    
                    <div>
                        <label for="discordTimestamp" style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Discord Timestamp:</label>
                        <input 
                            type="text" 
                            id="discordTimestamp" 
                            name="discordTimestamp" 
                            required 
                            style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 0.5rem; font-size: 1rem;"
                            placeholder="e.g., <t:1752257760:R>"
                        />
                        <small style="color: #666; font-size: 0.9rem;">
                            Use Discord timestamp format. Generate at <a href="https://www.unixtimestamp.com/" target="_blank">unixtimestamp.com</a>
                        </small>
                    </div>
                    
                    <div>
                        <label for="maxPlayers" style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Max Players:</label>
                        <input 
                            type="number" 
                            id="maxPlayers" 
                            name="maxPlayers" 
                            min="1" 
                            max="100" 
                            required 
                            style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 0.5rem; font-size: 1rem;"
                            placeholder="e.g., 32"
                        />
                        <small style="color: #666; font-size: 0.9rem;">
                            Maximum number of players allowed in this session
                        </small>
                    </div>
                    
                    <div>
                        <label style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; cursor: pointer;">
                            <input 
                                type="checkbox" 
                                id="pingEveryone" 
                                name="pingEveryone"
                                style="width: 18px; height: 18px; accent-color: #17a2b8;"
                            />
                            <span style="font-weight: bold;">📢 Ping Everyone (@everyone)</span>
                        </label>
                        <small style="color: #666; font-size: 0.9rem; margin-left: 23px; display: block; margin-top: -0.5rem;">
                            This will notify all server members about the new game session
                        </small>
                    </div>
                    
                    <div>
                        <label for="gameDescription" style="display: block; margin-bottom: 0.5rem; font-weight: bold;">Description (Optional):</label>
                        <textarea 
                            id="gameDescription" 
                            name="gameDescription" 
                            rows="3"
                            style="width: 100%; padding: 0.75rem; border: 2px solid #ddd; border-radius: 0.5rem; font-size: 1rem; resize: vertical;"
                            placeholder="Additional details about the game session..."
                        ></textarea>
                    </div>
                    
                    <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                        <button 
                            type="button" 
                            onclick="closeModal()"
                            style="flex: 1; padding: 0.75rem; background: #6c757d; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: bold;"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit"
                            style="flex: 1; padding: 0.75rem; background: #17a2b8; color: white; border: none; border-radius: 0.5rem; cursor: pointer; font-weight: bold;"
                        >
                            Create Signup
                        </button>
                    </div>
                </form>
            \`;
            document.getElementById('modal').style.display = 'block';
            
            // Add form submit handler
            document.getElementById('gameSignupForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(e.target);
                const gameData = {
                    gameName: formData.get('gameName'),
                    discordTimestamp: formData.get('discordTimestamp'),
                    maxPlayers: parseInt(formData.get('maxPlayers')),
                    pingEveryone: formData.get('pingEveryone') === 'on',
                    gameDescription: formData.get('gameDescription') || ''
                };
                
                try {
                    const response = await fetch('/controller/api/create-game-signup', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + session,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(gameData)
                    });
                    
                    if (response.ok) {
                        closeModal();
                        alert('Game signup created successfully!' + (gameData.pingEveryone ? ' Everyone has been notified.' : ''));
                        loadDashboardData(); // Refresh dashboard
                    } else {
                        const error = await response.json();
                        alert('Error: ' + (error.message || 'Failed to create game signup'));
                    }
                } catch (error) {
                    alert('Network error: ' + error.message);
                }
            });
        }

        function showSystemInfo() {
            fetch('/controller/api/system-info', {
                headers: {
                    'Authorization': 'Bearer ' + session
                }
            })
            .then(response => response.json())
            .then(data => {
                document.getElementById('modal-title').textContent = 'System Information';
                document.getElementById('modal-content').innerHTML = 
                    '<pre style="background: #f8f9fa; padding: 1rem; border-radius: 0.5rem; overflow-x: auto;">' + 
                    JSON.stringify(data, null, 2) + 
                    '</pre>';
                document.getElementById('modal').style.display = 'block';
            })
            .catch(error => alert('Error: ' + error.message));
        }

        function viewLogs() {
            document.getElementById('modal-title').textContent = 'System Logs';
            document.getElementById('modal-content').innerHTML = 
                '<div style="background: #000; color: #0f0; padding: 1rem; border-radius: 0.5rem; font-family: monospace; max-height: 400px; overflow-y: auto;">' +
                '<p>Loading logs...</p>' +
                '</div>';
            document.getElementById('modal').style.display = 'block';
            
            // Fetch logs
            fetch('/controller/api/logs', {
                headers: {
                    'Authorization': 'Bearer ' + session
                }
            })
            .then(response => response.text())
            .then(logs => {
                document.getElementById('modal-content').innerHTML = 
                    '<div style="background: #000; color: #0f0; padding: 1rem; border-radius: 0.5rem; font-family: monospace; max-height: 400px; overflow-y: auto;">' +
                    '<pre>' + logs + '</pre>' +
                    '</div>';
            })
            .catch(error => {
                document.getElementById('modal-content').innerHTML = 
                    '<div style="background: #000; color: #f00; padding: 1rem; border-radius: 0.5rem; font-family: monospace;">' +
                    'Error loading logs: ' + error.message +
                    '</div>';
            });
        }

        function closeModal() {
            document.getElementById('modal').style.display = 'none';
        }

        // Load initial data
        async function loadDashboardData() {
            try {
                const response = await fetch('/controller/api/dashboard-data', {
                    headers: {
                        'Authorization': 'Bearer ' + session
                    }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    document.getElementById('verifications-count').textContent = data.verificationsToday || 0;
                    document.getElementById('recent-activity').innerHTML = 
                        data.recentActivity || '<p style="color: #666;">No recent activity</p>';
                } else if (response.status === 401) {
                    logout();
                }
            } catch (error) {
                console.error('Error loading dashboard data:', error);
            }
        }

        // Load dashboard data on page load
        loadDashboardData();
        
        // Refresh dashboard data every 30 seconds
        setInterval(loadDashboardData, 30000);
    </script>
`);

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

// Controller route handlers
export async function handleControllerLogin(req: Request, res: Response): Promise<Response> {
    return res.send(controllerLoginPage());
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

export async function handleControllerDashboard(req: Request, res: Response): Promise<Response> {
    return res.send(controllerDashboardPage());
}

export async function handleControllerLogout(req: Request, res: Response): Promise<Response> {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');
    
    if (token) {
        activeSessions.delete(token);
    }
    
    return res.json({ message: 'Logged out successfully' });
}

// API endpoints
export async function handleRefreshButton(req: Request, res: Response): Promise<Response> {
    try {
        const { sendPersistentButton } = await import('./discord-bot');
        await sendPersistentButton();
        logger.info('Verification button refreshed via controller');
        return res.json({ message: 'Button refreshed successfully' });
    } catch (error) {
        logger.error('Error refreshing button:', error);
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
        verificationsToday: 0, // This would be fetched from your database
        recentActivity: '<p style="color: #666;">No recent activity logged</p>'
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

export async function handleCreateGameSignup(req: Request, res: Response): Promise<Response> {
    try {
        const { gameName, discordTimestamp, maxPlayers, pingEveryone, gameDescription } = req.body;
        
        if (!gameName || !discordTimestamp || !maxPlayers) {
            return res.status(400).json({ message: 'Game name, Discord timestamp, and max players are required' });
        }
        
        if (maxPlayers < 1 || maxPlayers > 100) {
            return res.status(400).json({ message: 'Max players must be between 1 and 100' });
        }
        
        // Validate Discord timestamp format
        const timestampRegex = /<t:\d+:[RrDdFfTt]>/;
        if (!timestampRegex.test(discordTimestamp)) {
            return res.status(400).json({ message: 'Invalid Discord timestamp format. Use format: <t:1234567890:R>' });
        }
        
        const { client, addGameSignupMessage } = await import('./discord-bot');
        const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = await import('discord.js');
        
        if (!client.isReady()) {
            return res.status(503).json({ message: 'Discord bot is not ready' });
        }
        
        // Get the game signup channel (using the same channel as verification for now)
        const channel = await client.channels.fetch("1393296204405801030");
        if (!channel || !channel.isTextBased()) {
            return res.status(404).json({ message: 'Game signup channel not found' });
        }
        
        // Create the embed
        const embed = new EmbedBuilder()
            .setTitle('🎮 New Game Session Scheduled!')
            .setDescription(`**${gameName}**\n\n${gameDescription || 'Get ready for an exciting gaming session!'}`)
            .addFields([
                {
                    name: '📅 When',
                    value: `${discordTimestamp}`,
                    inline: true
                },
                {
                    name: '👥 Players',
                    value: `0/${maxPlayers}`,
                    inline: true
                },
                {
                    name: '📝 How to Join',
                    value: 'React with 🎮 to sign up for this session!',
                    inline: false
                },
                {
                    name: '🎯 Signed Up Players',
                    value: '*No players signed up yet*',
                    inline: false
                }
            ])
            .setColor(0x00ff00)
            .setThumbnail('https://cdn.discordapp.com/emojis/1234567890123456789.png') // You can add a custom emoji URL
            .setTimestamp()
            .setFooter({ text: 'CarnageRP Game Scheduler' });
        
        // Prepare message content with optional @everyone ping
        const messageContent = pingEveryone ? '@everyone' : undefined;
        
        // Send the embed with optional ping
        const message = await (channel as TextChannel).send({ 
            content: messageContent,
            embeds: [embed] 
        });
        
        // Add reaction for signup
        await message.react('🎮');
        
        // Track this message for reaction updates
        addGameSignupMessage(message.id, gameName, discordTimestamp, maxPlayers, pingEveryone);
        
        logger.info(`Game signup created: ${gameName} at ${discordTimestamp} (max ${maxPlayers} players)${pingEveryone ? ' with @everyone ping' : ''}`);
        
        return res.json({ 
            message: 'Game signup created successfully',
            messageId: message.id,
            channelId: channel.id,
            pingEveryone: pingEveryone || false
        });
        
    } catch (error) {
        logger.error('Error creating game signup:', error);
        return res.status(500).json({ message: 'Failed to create game signup' });
    }
}