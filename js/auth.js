// Authentication system for Discord Ticket System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.sessionTimeout = 86400000; // 24 hours
        this.init();
    }

    init() {
        this.checkSession();
        this.bindEvents();
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                this.handleLogin(e);
            });
        }

        // Register form
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                this.handleRegister(e);
            });
        }

        // Logout buttons
        const logoutBtns = document.querySelectorAll('.logout-btn');
        logoutBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        });
    }

    checkSession() {
        const session = localStorage.getItem('user_session');
        if (session) {
            try {
                const sessionData = JSON.parse(session);
                const now = new Date().getTime();
                
                if (sessionData.expires > now) {
                    this.currentUser = sessionData.user;
                    return true;
                } else {
                    localStorage.removeItem('user_session');
                }
            } catch (error) {
                localStorage.removeItem('user_session');
            }
        }
        return false;
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const email = formData.get('email').trim().toLowerCase();
        const password = formData.get('password').trim();
        
        // Clear previous errors
        this.clearErrors();
        
        // Validate input
        if (!email || !password) {
            this.showError('loginError', 'Por favor, preencha todos os campos');
            return;
        }

        try {
            const users = await this.getUsers();
            const user = users.find(u => u.email === email && u.password === password);
            
            if (user) {
                this.createSession(user);
                this.showNotification('Login realizado com sucesso!', 'success');
                
                // Redirect to main page after short delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
            } else {
                this.showError('loginError', 'Email ou senha incorretos');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('loginError', 'Erro interno. Tente novamente.');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const userData = {
            name: formData.get('name').trim(),
            email: formData.get('email').trim().toLowerCase(),
            discordId: formData.get('discordId').trim(),
            password: formData.get('password').trim(),
            confirmPassword: formData.get('confirmPassword').trim()
        };
        
        // Clear previous errors
        this.clearErrors();
        
        // Validate input
        const validation = this.validateRegistration(userData);
        if (!validation.isValid) {
            this.showError('registerError', validation.message);
            return;
        }

        try {
            const users = await this.getUsers();
            
            // Check if user already exists
            if (users.find(u => u.email === userData.email)) {
                this.showError('registerError', 'Este email já está cadastrado');
                return;
            }
            
            if (users.find(u => u.discordId === userData.discordId)) {
                this.showError('registerError', 'Este ID do Discord já está cadastrado');
                return;
            }
            
            // Create new user
            const newUser = {
                id: this.generateUserId(),
                name: userData.name,
                email: userData.email,
                discordId: userData.discordId,
                password: userData.password, // In a real app, this would be hashed
                registeredAt: new Date().toISOString(),
                isActive: true
            };
            
            users.push(newUser);
            await this.saveUsers(users);
            
            // Log registration
            await this.logAction('user_register', `Novo usuário registrado: ${newUser.email}`, newUser.id);
            
            this.showNotification('Conta criada com sucesso! Você pode fazer login agora.', 'success');
            
            // Redirect to login page after short delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
            
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('registerError', 'Erro interno. Tente novamente.');
        }
    }

    validateRegistration(userData) {
        if (!userData.name || userData.name.length < 2) {
            return { isValid: false, message: 'Nome deve ter pelo menos 2 caracteres' };
        }
        
        if (!userData.email || !this.isValidEmail(userData.email)) {
            return { isValid: false, message: 'Email inválido' };
        }
        
        if (!userData.discordId || !/^\d{17,19}$/.test(userData.discordId)) {
            return { isValid: false, message: 'ID do Discord deve conter entre 17-19 dígitos' };
        }
        
        if (!userData.password || userData.password.length < 6) {
            return { isValid: false, message: 'Senha deve ter pelo menos 6 caracteres' };
        }
        
        if (userData.password !== userData.confirmPassword) {
            return { isValid: false, message: 'Senhas não conferem' };
        }
        
        return { isValid: true };
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    createSession(user) {
        this.currentUser = user;
        const sessionData = {
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                discordId: user.discordId
            },
            expires: new Date().getTime() + this.sessionTimeout,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem('user_session', JSON.stringify(sessionData));
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('user_session');
        this.showNotification('Logout realizado com sucesso', 'info');
        
        // Redirect to login page
        setTimeout(() => {
            window.location.href = 'login.html';
        }, 1000);
    }

    requireAuth() {
        if (!this.checkSession()) {
            this.showNotification('Você precisa fazer login para acessar esta página', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1500);
            return false;
        }
        return true;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    generateUserId() {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substr(2, 8).toUpperCase();
        return `USR-${timestamp}-${randomPart}`;
    }

    async getUsers() {
        try {
            const response = await fetch('./database/users.json');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error loading users:', error);
        }
        return JSON.parse(localStorage.getItem('discord_users') || '[]');
    }

    async saveUsers(users) {
        // Since we can't write to files directly, we'll use localStorage as fallback
        localStorage.setItem('discord_users', JSON.stringify(users));
        return true;
    }

    async logAction(action, description, userId = null) {
        try {
            const logs = JSON.parse(localStorage.getItem('discord_logs') || '[]');
            const logEntry = {
                id: this.generateLogId(),
                action,
                description,
                userId,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent
            };
            
            logs.push(logEntry);
            localStorage.setItem('discord_logs', JSON.stringify(logs));
        } catch (error) {
            console.error('Error logging action:', error);
        }
    }

    generateLogId() {
        return `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    }

    // Utility methods
    clearErrors() {
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
        });
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-message">${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
        `;

        // Add styles if not already present
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1000;
                    min-width: 300px;
                    padding: 1rem;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                    animation: slideIn 0.3s ease;
                }
                
                .notification-info { background: var(--discord-blurple); color: white; }
                .notification-error { background: var(--discord-red); color: white; }
                .notification-success { background: var(--discord-green); color: white; }
                .notification-warning { background: var(--discord-yellow); color: black; }
                
                .notification-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    gap: 1rem;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    color: currentColor;
                    cursor: pointer;
                    padding: 0.25rem;
                    border-radius: 4px;
                    opacity: 0.8;
                    transition: opacity 0.2s;
                }
                
                .notification-close:hover {
                    opacity: 1;
                    background: rgba(255, 255, 255, 0.1);
                }
                
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(styles);
        }

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize auth system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authSystem = new AuthSystem();
});