// Chat system for ticket communication
class TicketChat {
    constructor(ticketId) {
        this.ticketId = ticketId;
        this.currentUser = null;
        this.ticket = null;
        this.messages = [];
        this.isAdmin = false;
        this.init();
    }

    async init() {
        // Check authentication
        if (!window.authSystem.checkSession()) {
            window.location.href = 'login.html';
            return;
        }

        this.currentUser = window.authSystem.getCurrentUser();
        
        // Check if this is admin access
        this.isAdmin = this.checkAdminAuth();
        
        try {
            await this.loadTicket();
            this.setupUI();
            this.bindEvents();
            this.loadMessages();
        } catch (error) {
            console.error('Error initializing chat:', error);
            this.showError('Erro ao carregar o ticket');
        }
    }

    checkAdminAuth() {
        const adminAuth = localStorage.getItem('admin_auth');
        if (adminAuth) {
            try {
                const auth = JSON.parse(adminAuth);
                const now = new Date().getTime();
                return auth.expires > now;
            } catch (error) {
                return false;
            }
        }
        return false;
    }

    async loadTicket() {
        const tickets = await this.getTickets();
        this.ticket = tickets.find(t => t.id === this.ticketId);
        
        if (!this.ticket) {
            throw new Error('Ticket não encontrado');
        }
        
        // Check permissions
        if (!this.isAdmin && this.ticket.userId !== this.currentUser.id) {
            throw new Error('Acesso negado a este ticket');
        }
        
        this.messages = this.ticket.messages || [];
    }

    setupUI() {
        document.title = `Ticket ${this.ticketId} - Sistema de Tickets Discord`;
        
        // Update ticket info
        document.getElementById('ticketId').textContent = this.ticket.id;
        document.getElementById('ticketUser').textContent = this.ticket.userName;
        document.getElementById('ticketReason').textContent = this.getReasonDisplayName(this.ticket.reason);
        document.getElementById('ticketStatus').innerHTML = this.getStatusBadge(this.ticket.status);
        document.getElementById('ticketDate').textContent = this.formatDate(this.ticket.createdAt);
        
        // Show admin controls if needed
        if (this.isAdmin) {
            document.getElementById('adminControls').classList.remove('hidden');
            this.updateAdminControls();
        }
        
        // Update current user info
        document.getElementById('currentUserName').textContent = this.isAdmin ? 'Admin' : this.currentUser.name;
    }

    updateAdminControls() {
        const resolveBtn = document.getElementById('resolveTicketBtn');
        if (this.ticket.status === 'pending') {
            resolveBtn.classList.remove('hidden');
        } else {
            resolveBtn.classList.add('hidden');
        }
    }

    bindEvents() {
        // Message form
        const messageForm = document.getElementById('messageForm');
        if (messageForm) {
            messageForm.addEventListener('submit', (e) => {
                this.handleMessageSubmit(e);
            });
        }

        // Message input auto-resize
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.addEventListener('input', (e) => {
                this.autoResizeTextarea(e.target);
            });
            
            // Send on Enter (Shift+Enter for new line)
            messageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    messageForm.dispatchEvent(new Event('submit'));
                }
            });
        }

        // Admin controls
        const resolveBtn = document.getElementById('resolveTicketBtn');
        if (resolveBtn) {
            resolveBtn.addEventListener('click', () => {
                this.resolveTicket();
            });
        }

        // Back button
        const backBtn = document.getElementById('backToSystem');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                if (this.isAdmin) {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'index.html';
                }
            });
        }

        // Auto-refresh messages every 10 seconds
        this.messageRefreshInterval = setInterval(() => {
            this.refreshMessages();
        }, 10000);
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
    }

    async handleMessageSubmit(e) {
        e.preventDefault();
        
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        
        if (!message) {
            return;
        }
        
        const newMessage = {
            id: this.generateMessageId(),
            senderId: this.isAdmin ? 'admin' : this.currentUser.id,
            senderName: this.isAdmin ? 'Admin' : this.currentUser.name,
            senderType: this.isAdmin ? 'admin' : 'user',
            message: message,
            timestamp: new Date().toISOString()
        };
        
        try {
            await this.sendMessage(newMessage);
            messageInput.value = '';
            messageInput.style.height = 'auto';
            this.loadMessages();
            this.scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
            this.showNotification('Erro ao enviar mensagem', 'error');
        }
    }

    async sendMessage(messageData) {
        // Add message to ticket
        this.messages.push(messageData);
        this.ticket.messages = this.messages;
        this.ticket.updatedAt = new Date().toISOString();
        
        // Update ticket in storage
        const tickets = await this.getTickets();
        const ticketIndex = tickets.findIndex(t => t.id === this.ticketId);
        
        if (ticketIndex !== -1) {
            tickets[ticketIndex] = this.ticket;
            localStorage.setItem('discord_tickets', JSON.stringify(tickets));
            
            // Log the action
            await this.logAction('message_sent', 
                `Mensagem enviada no ticket ${this.ticketId}`, 
                this.isAdmin ? 'admin' : this.currentUser.id
            );
        }
    }

    async refreshMessages() {
        try {
            await this.loadTicket();
            this.loadMessages();
        } catch (error) {
            console.error('Error refreshing messages:', error);
        }
    }

    loadMessages() {
        const messagesContainer = document.getElementById('messagesContainer');
        if (!messagesContainer) return;
        
        if (this.messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="no-messages">
                    <p>Nenhuma mensagem ainda. Inicie a conversa!</p>
                </div>
            `;
            return;
        }
        
        messagesContainer.innerHTML = this.messages.map(message => 
            this.createMessageElement(message)
        ).join('');
        
        this.scrollToBottom();
    }

    createMessageElement(message) {
        const isCurrentUser = !this.isAdmin && message.senderId === this.currentUser.id;
        const isAdminMessage = message.senderType === 'admin';
        const messageClass = isCurrentUser ? 'message-own' : (isAdminMessage ? 'message-admin' : 'message-other');
        
        return `
            <div class="message ${messageClass}">
                <div class="message-header">
                    <span class="message-sender">${this.escapeHtml(message.senderName)}</span>
                    <span class="message-time">${this.formatMessageTime(message.timestamp)}</span>
                </div>
                <div class="message-content">
                    ${this.escapeHtml(message.message).replace(/\n/g, '<br>')}
                </div>
            </div>
        `;
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('messagesContainer');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    async resolveTicket() {
        if (!confirm('Tem certeza que deseja marcar este ticket como resolvido?')) {
            return;
        }
        
        try {
            this.ticket.status = 'resolved';
            this.ticket.updatedAt = new Date().toISOString();
            
            // Add system message
            const systemMessage = {
                id: this.generateMessageId(),
                senderId: 'system',
                senderName: 'Sistema',
                senderType: 'system',
                message: 'Ticket marcado como resolvido pelo administrador',
                timestamp: new Date().toISOString()
            };
            
            this.messages.push(systemMessage);
            this.ticket.messages = this.messages;
            
            // Update in storage
            const tickets = await this.getTickets();
            const ticketIndex = tickets.findIndex(t => t.id === this.ticketId);
            
            if (ticketIndex !== -1) {
                tickets[ticketIndex] = this.ticket;
                localStorage.setItem('discord_tickets', JSON.stringify(tickets));
                
                await this.logAction('ticket_resolve', 
                    `Ticket ${this.ticketId} marcado como resolvido`, 
                    'admin'
                );
                
                this.showNotification('Ticket marcado como resolvido', 'success');
                this.setupUI(); // Refresh UI
                this.loadMessages(); // Refresh messages
            }
        } catch (error) {
            console.error('Error resolving ticket:', error);
            this.showNotification('Erro ao resolver ticket', 'error');
        }
    }

    async getTickets() {
        try {
            const response = await fetch('./database/tickets.json');
            if (response.ok) {
                return await response.json();
            }
        } catch (error) {
            console.error('Error loading tickets from file:', error);
        }
        return JSON.parse(localStorage.getItem('discord_tickets') || '[]');
    }

    async logAction(action, description, userId = null) {
        try {
            const logs = JSON.parse(localStorage.getItem('discord_logs') || '[]');
            const logEntry = {
                id: `LOG-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
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

    generateMessageId() {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substr(2, 3).toUpperCase();
        return `MSG-${timestamp}-${randomPart}`;
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    formatMessageTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return date.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit'
            });
        } else {
            return date.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        }
    }

    getReasonDisplayName(reason) {
        const reasonMap = {
            'suporte-tecnico': 'Suporte Técnico',
            'bug-report': 'Reportar Bug',
            'sugestao': 'Sugestão',
            'ban-appeal': 'Apelação de Ban',
            'denuncia': 'Denúncia',
            'outros': 'Outros'
        };
        return reasonMap[reason] || reason;
    }

    getStatusBadge(status) {
        const statusClass = status === 'pending' ? 'status-pending' : 'status-resolved';
        const statusText = status === 'pending' ? '⏳ Pendente' : '✅ Resolvido';
        return `<span class="status-badge ${statusClass}">${statusText}</span>`;
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

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    showError(message) {
        document.body.innerHTML = `
            <div class="error-page">
                <div class="error-container">
                    <h1>Erro</h1>
                    <p>${message}</p>
                    <button class="btn btn-primary" onclick="history.back()">Voltar</button>
                </div>
            </div>
        `;
    }

    // Cleanup on page unload
    destroy() {
        if (this.messageRefreshInterval) {
            clearInterval(this.messageRefreshInterval);
        }
    }
}

// Initialize chat when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Extract ticket ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const ticketId = urlParams.get('id');
    
    if (!ticketId) {
        document.body.innerHTML = `
            <div class="error-page">
                <div class="error-container">
                    <h1>Erro</h1>
                    <p>ID do ticket não encontrado</p>
                    <button class="btn btn-primary" onclick="window.location.href='index.html'">Voltar ao Início</button>
                </div>
            </div>
        `;
        return;
    }
    
    window.ticketChat = new TicketChat(ticketId);
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.ticketChat) {
        window.ticketChat.destroy();
    }
});