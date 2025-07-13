// src/public/js/controller.js - Updated with notification role functionality

class ControllerDashboard {
    constructor() {
        this.session = localStorage.getItem('controller_session');
        this.init();
    }

    init() {
        // Check authentication
        if (!this.session) {
            window.location.href = '/controller/login';
            return;
        }

        // Bind event listeners
        this.bindEvents();
        
        // Load initial data
        this.loadDashboardData();
        
        // Setup auto-refresh
        setInterval(() => this.loadDashboardData(), 30000);
    }

    bindEvents() {
        // Logout button
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Action buttons
        this.bindActionButtons();
        
        // Modal events
        this.bindModalEvents();
    }

    bindActionButtons() {
        const buttons = {
            'refresh-button-btn': () => this.refreshButton(),
            'game-signup-btn': () => this.showGameSignupForm(),
            'send-dm-btn': () => this.showSendDMForm(),
            'mark-started-btn': () => this.showMarkAsStartedForm(),
            'system-info-btn': () => this.showSystemInfo(),
            'view-logs-btn': () => this.viewLogs()
        };

        Object.entries(buttons).forEach(([id, handler]) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', handler);
            }
        });
    }

    bindModalEvents() {
        const modal = document.getElementById('modal');
        const closeBtn = document.getElementById('modal-close');
        
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }
        
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeModal());
        }
    }

    async apiCall(endpoint, options = {}) {
        const defaultOptions = {
            headers: {
                'Authorization': `Bearer ${this.session}`,
                'Content-Type': 'application/json'
            }
        };

        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: { ...defaultOptions.headers, ...options.headers }
        };

        try {
            const response = await fetch(endpoint, mergedOptions);
            
            if (response.status === 401) {
                this.logout();
                return null;
            }
            
            return response;
        } catch (error) {
            console.error('API call failed:', error);
            this.showError('Network error. Please check your connection.');
            return null;
        }
    }

    async logout() {
        localStorage.removeItem('controller_session');
        
        await this.apiCall('/controller/logout', { method: 'POST' });
        
        window.location.href = '/controller/login';
    }

    async refreshButton() {
        const response = await this.apiCall('/controller/api/refresh-button', {
            method: 'POST'
        });
        
        if (response && response.ok) {
            this.showSuccess('Verification button refreshed successfully!');
        } else {
            this.showError('Failed to refresh button');
        }
    }

    async loadDashboardData() {
        const response = await this.apiCall('/controller/api/dashboard-data');
        
        if (response && response.ok) {
            const data = await response.json();
            this.updateDashboard(data);
        }
    }

    updateDashboard(data) {
        // Update verification count
        const countEl = document.getElementById('verifications-count');
        if (countEl) {
            countEl.textContent = data.verificationsToday || 0;
        }

        // Update recent activity
        const activityEl = document.getElementById('recent-activity');
        if (activityEl) {
            activityEl.innerHTML = data.recentActivity || 
                '<p style="color: #666;">No recent activity</p>';
        }
    }

    async showMarkAsStartedForm() {
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');
        
        if (!modalTitle || !modalContent) return;

        modalTitle.textContent = 'Mark Game as Started';
        modalContent.innerHTML = '<p>Loading active game signups...</p>';
        
        this.showModal();

        // Fetch active game signups
        const response = await this.apiCall('/controller/api/game-signups');
        
        if (response && response.ok) {
            const gameSignups = await response.json();
            modalContent.innerHTML = this.getMarkAsStartedFormHTML(gameSignups);
            this.bindMarkAsStartedForm();
        } else {
            modalContent.innerHTML = `
                <div style="color: #dc3545; text-align: center; padding: 2rem;">
                    <h3>❌ Failed to load game signups</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }

    getMarkAsStartedFormHTML(gameSignups) {
        if (gameSignups.length === 0) {
            return `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <h3>📭 No Active Game Signups</h3>
                    <p>There are no scheduled games to mark as started.</p>
                    <button type="button" class="btn btn-primary" onclick="controllerDashboard.closeModal(); controllerDashboard.showGameSignupForm();">
                        Create Game Signup
                    </button>
                </div>
            `;
        }

        const gameOptions = gameSignups.map(game => 
            `<option value="${game.messageId}">
                ${game.gameName} (${game.playerCount} player${game.playerCount !== 1 ? 's' : ''})
            </option>`
        ).join('');

        return `
            <form id="markStartedForm" class="modal-form">
                <div class="form-group">
                    <label for="gameSelect" class="form-label">Select Game Session to Mark as Started:</label>
                    <select id="gameSelect" name="gameSelect" required class="form-input">
                        <option value="">Choose a game session...</option>
                        ${gameOptions}
                    </select>
                    <div id="gameInfo" class="form-help" style="margin-top: 0.5rem; display: none;"></div>
                </div>
                
                <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 0.5rem; padding: 1rem; margin: 1rem 0;">
                    <h4 style="color: #856404; margin: 0 0 0.5rem 0;">⚠️ Important</h4>
                    <p style="color: #856404; margin: 0; font-size: 0.9rem;">
                        Marking a game as started will:
                    </p>
                    <ul style="color: #856404; margin: 0.5rem 0 0 1rem; font-size: 0.9rem;">
                        <li>Update the Discord embed to show "Game Started" status</li>
                        <li>Prevent new players from signing up</li>
                        <li>Remove the game from tracking after 5 minutes</li>
                        <li>Change the embed color to orange</li>
                    </ul>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="controllerDashboard.closeModal()">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-warning">
                        🔴 Mark as Started
                    </button>
                </div>
            </form>
        `;
    }

    bindMarkAsStartedForm() {
        const form = document.getElementById('markStartedForm');
        const gameSelect = document.getElementById('gameSelect');
        const gameInfo = document.getElementById('gameInfo');
        
        if (!form || !gameSelect || !gameInfo) return;

        // Show game info when selection changes
        gameSelect.addEventListener('change', async (e) => {
            if (e.target.value) {
                const response = await this.apiCall('/controller/api/game-signups');
                if (response && response.ok) {
                    const gameSignups = await response.json();
                    const selectedGame = gameSignups.find(game => game.messageId === e.target.value);
                    
                    if (selectedGame) {
                        gameInfo.style.display = 'block';
                        gameInfo.innerHTML = `
                            <strong>📅 When:</strong> ${selectedGame.timestamp}<br>
                            <strong>👥 Players:</strong> ${selectedGame.playerCount}${selectedGame.maxPlayers ? `/${selectedGame.maxPlayers}` : ''}<br>
                            <strong>🎯 Status:</strong> ${selectedGame.status || 'Scheduled'}<br>
                            <strong>⚠️ This will mark the game as started and notify all ${selectedGame.playerCount} player${selectedGame.playerCount !== 1 ? 's' : ''}</strong>
                        `;
                    }
                }
            } else {
                gameInfo.style.display = 'none';
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const markData = {
                messageId: formData.get('gameSelect')
            };
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Marking as Started...';
            submitBtn.disabled = true;
            
            const response = await this.apiCall('/controller/api/mark-game-started', {
                method: 'POST',
                body: JSON.stringify(markData)
            });
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            if (response && response.ok) {
                const result = await response.json();
                this.closeModal();
                this.showSuccess(result.message);
                this.loadDashboardData(); // Refresh dashboard
            } else {
                const error = await response.json();
                this.showError(error.message || 'Failed to mark game as started');
            }
        });
    }

    async showSendDMForm() {
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');
        
        if (!modalTitle || !modalContent) return;

        modalTitle.textContent = 'Send DM to Game Players';
        modalContent.innerHTML = '<p>Loading active game signups...</p>';
        
        this.showModal();

        // Fetch active game signups
        const response = await this.apiCall('/controller/api/game-signups');
        
        if (response && response.ok) {
            const gameSignups = await response.json();
            modalContent.innerHTML = this.getSendDMFormHTML(gameSignups);
            this.bindSendDMForm();
        } else {
            modalContent.innerHTML = `
                <div style="color: #dc3545; text-align: center; padding: 2rem;">
                    <h3>❌ Failed to load game signups</h3>
                    <p>Please try again later.</p>
                </div>
            `;
        }
    }

    getSendDMFormHTML(gameSignups) {
        if (gameSignups.length === 0) {
            return `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <h3>📭 No Active Game Signups</h3>
                    <p>Create a game signup first to send DMs to players.</p>
                    <button type="button" class="btn btn-primary" onclick="controllerDashboard.closeModal(); controllerDashboard.showGameSignupForm();">
                        Create Game Signup
                    </button>
                </div>
            `;
        }

        const gameOptions = gameSignups.map(game => 
            `<option value="${game.messageId}">
                ${game.gameName} (${game.playerCount} player${game.playerCount !== 1 ? 's' : ''})
            </option>`
        ).join('');

        return `
            <form id="sendDMForm" class="modal-form">
                <div class="form-group">
                    <label for="gameSelect" class="form-label">Select Game Session:</label>
                    <select id="gameSelect" name="gameSelect" required class="form-input">
                        <option value="">Choose a game session...</option>
                        ${gameOptions}
                    </select>
                    <div id="gameInfo" class="form-help" style="margin-top: 0.5rem; display: none;"></div>
                </div>
                
                <div class="form-group">
                    <label for="dmSubject" class="form-label">Subject:</label>
                    <input 
                        type="text" 
                        id="dmSubject" 
                        name="dmSubject" 
                        required 
                        maxlength="100"
                        class="form-input"
                        placeholder="e.g., Important Update About Tonight's Session"
                    />
                    <div class="form-help">Maximum 100 characters</div>
                </div>
                
                <div class="form-group">
                    <label for="dmMessage" class="form-label">Message:</label>
                    <textarea 
                        id="dmMessage" 
                        name="dmMessage" 
                        required
                        maxlength="2000"
                        rows="6"
                        class="form-textarea"
                        placeholder="Enter your message to all signed up players..."
                    ></textarea>
                    <div class="form-help">
                        Maximum 2000 characters. This message will be sent as a DM to all players who signed up for the selected game.
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="controllerDashboard.closeModal()">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-warning">
                        📨 Send DMs
                    </button>
                </div>
            </form>
        `;
    }

    bindSendDMForm() {
        const form = document.getElementById('sendDMForm');
        const gameSelect = document.getElementById('gameSelect');
        const gameInfo = document.getElementById('gameInfo');
        
        if (!form || !gameSelect || !gameInfo) return;

        // Show game info when selection changes
        gameSelect.addEventListener('change', async (e) => {
            if (e.target.value) {
                const response = await this.apiCall('/controller/api/game-signups');
                if (response && response.ok) {
                    const gameSignups = await response.json();
                    const selectedGame = gameSignups.find(game => game.messageId === e.target.value);
                    
                    if (selectedGame) {
                        gameInfo.style.display = 'block';
                        gameInfo.innerHTML = `
                            <strong>📅 When:</strong> ${selectedGame.timestamp}<br>
                            <strong>👥 Players:</strong> ${selectedGame.playerCount}${selectedGame.maxPlayers ? `/${selectedGame.maxPlayers}` : ''}<br>
                            <strong>🎯 This DM will be sent to ${selectedGame.playerCount} player${selectedGame.playerCount !== 1 ? 's' : ''}</strong>
                        `;
                    }
                }
            } else {
                gameInfo.style.display = 'none';
            }
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const dmData = {
                messageId: formData.get('gameSelect'),
                subject: formData.get('dmSubject'),
                message: formData.get('dmMessage')
            };
            
            // Show loading state
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;
            
            const response = await this.apiCall('/controller/api/send-game-dm', {
                method: 'POST',
                body: JSON.stringify(dmData)
            });
            
            // Reset button
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            
            if (response && response.ok) {
                const result = await response.json();
                this.closeModal();
                this.showSuccess(`${result.message}${result.failedCount > 0 ? ` (${result.failedCount} failed)` : ''}`);
                this.loadDashboardData(); // Refresh dashboard
            } else {
                const error = await response.json();
                this.showError(error.message || 'Failed to send DMs');
            }
        });
    }

    showGameSignupForm() {
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');
        
        if (!modalTitle || !modalContent) return;

        modalTitle.textContent = 'Create Game Signup';
        modalContent.innerHTML = this.getGameSignupFormHTML();
        
        this.showModal();
        this.bindGameSignupForm();
    }

    getGameSignupFormHTML() {
        return `
            <form id="gameSignupForm" class="modal-form">
                <div class="form-group">
                    <label for="gameName" class="form-label">Game Name:</label>
                    <input 
                        type="text" 
                        id="gameName" 
                        name="gameName" 
                        required 
                        class="form-input"
                        placeholder="e.g., CarnageRP Session #42"
                    />
                </div>
                
                <div class="form-group">
                    <label for="discordTimestamp" class="form-label">Discord Timestamp:</label>
                    <input 
                        type="text" 
                        id="discordTimestamp" 
                        name="discordTimestamp" 
                        required 
                        class="form-input"
                        placeholder="e.g., <t:1752257760:R>"
                    />
                    <div class="form-help">
                        Use Discord timestamp format. Generate at 
                        <a href="https://r.3v.fi/discord-timestamps/" target="_blank">3vfi</a>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="maxPlayers" class="form-label">Max Players:</label>
                    <input 
                        type="number" 
                        id="maxPlayers" 
                        name="maxPlayers" 
                        min="1" 
                        max="100" 
                        required 
                        class="form-input"
                        placeholder="e.g., 32"
                    />
                    <div class="form-help">
                        Maximum number of players allowed in this session
                    </div>
                </div>
                
                <div class="form-checkbox-group">
                    <input 
                        type="checkbox" 
                        id="notifyRole" 
                        name="notifyRole"
                        class="form-checkbox"
                    />
                    <label for="notifyRole">🔔 Notify Game Notification Role</label>
                </div>
                <div class="form-help" style="margin-left: 23px; margin-top: -0.5rem;">
                    This will ping users who have opted into game notifications using the verification button
                </div>
                
                <div class="form-group">
                    <label for="gameDescription" class="form-label">Description (Optional):</label>
                    <textarea 
                        id="gameDescription" 
                        name="gameDescription" 
                        rows="3"
                        class="form-textarea"
                        placeholder="Additional details about the game session..."
                    ></textarea>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="controllerDashboard.closeModal()">
                        Cancel
                    </button>
                    <button type="submit" class="btn btn-info">
                        Create Signup
                    </button>
                </div>
            </form>
        `;
    }

    bindGameSignupForm() {
        const form = document.getElementById('gameSignupForm');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const gameData = {
                gameName: formData.get('gameName'),
                discordTimestamp: formData.get('discordTimestamp'),
                maxPlayers: parseInt(formData.get('maxPlayers')),
                notifyRole: formData.get('notifyRole') === 'on',
                gameDescription: formData.get('gameDescription') || ''
            };
            
            const response = await this.apiCall('/controller/api/create-game-signup', {
                method: 'POST',
                body: JSON.stringify(gameData)
            });
            
            if (response && response.ok) {
                this.closeModal();
                const result = await response.json();
                this.showSuccess(
                    'Game signup created successfully!' + 
                    (gameData.notifyRole ? ' Users with notification role have been notified.' : '')
                );
                this.loadDashboardData(); // Refresh dashboard
            } else {
                const error = await response.json();
                this.showError(error.message || 'Failed to create game signup');
            }
        });
    }

    async showSystemInfo() {
        const response = await this.apiCall('/controller/api/system-info');
        
        if (response && response.ok) {
            const data = await response.json();
            this.showModal();
            
            const modalTitle = document.getElementById('modal-title');
            const modalContent = document.getElementById('modal-content');
            
            if (modalTitle && modalContent) {
                modalTitle.textContent = 'System Information';
                modalContent.innerHTML = `
                    <div class="system-info">
                        <pre>${JSON.stringify(data, null, 2)}</pre>
                    </div>
                `;
            }
        }
    }

    async viewLogs() {
        this.showModal();
        
        const modalTitle = document.getElementById('modal-title');
        const modalContent = document.getElementById('modal-content');
        
        if (modalTitle && modalContent) {
            modalTitle.textContent = 'System Logs';
            modalContent.innerHTML = `
                <div class="log-display">
                    <p>Loading logs...</p>
                </div>
            `;
        }
        
        const response = await this.apiCall('/controller/api/logs');
        
        if (response && response.ok) {
            const logs = await response.text();
            const logDisplay = modalContent.querySelector('.log-display');
            if (logDisplay) {
                logDisplay.innerHTML = `<pre>${logs}</pre>`;
            }
        } else {
            const logDisplay = modalContent.querySelector('.log-display');
            if (logDisplay) {
                logDisplay.innerHTML = `
                    <pre class="log-error">Error loading logs</pre>
                `;
            }
        }
    }

    showModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modal = document.getElementById('modal');
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 0.5rem;
            color: white;
            font-weight: bold;
            z-index: 9999;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
            ${type === 'success' ? 'background: #28a745;' : 'background: #dc3545;'}
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 5000);
    }
}

// Controller Login functionality
class ControllerLogin {
    constructor() {
        this.init();
    }

    init() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    async handleLogin(e) {
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
                localStorage.setItem('controller_session', result.token);
                window.location.href = '/controller/dashboard';
            } else {
                const error = await response.json();
                this.showError(error.message || 'Invalid password');
            }
        } catch (error) {
            this.showError('Network error. Please try again.');
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error-message');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }
}

// Initialize appropriate class based on current page
document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('/controller/dashboard')) {
        window.controllerDashboard = new ControllerDashboard();
    } else if (window.location.pathname.includes('/controller/login')) {
        window.controllerLogin = new ControllerLogin();
    }
});