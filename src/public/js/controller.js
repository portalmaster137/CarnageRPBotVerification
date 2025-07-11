// src/public/js/controller.js

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
                        <a href="https://www.unixtimestamp.com/" target="_blank">unixtimestamp.com</a>
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
                        id="pingEveryone" 
                        name="pingEveryone"
                        class="form-checkbox"
                    />
                    <label for="pingEveryone">📢 Ping Everyone (@everyone)</label>
                </div>
                <div class="form-help" style="margin-left: 23px; margin-top: -0.5rem;">
                    This will notify all server members about the new game session
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
                pingEveryone: formData.get('pingEveryone') === 'on',
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
                    (gameData.pingEveryone ? ' Everyone has been notified.' : '')
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