// Main application logic for authenticated users
class TicketSystem {
    constructor() {
        this.currentUser = null;
        this.userTickets = [];
        this.init();
    }

    init() {
        // Check authentication first
        if (!window.authSystem.requireAuth()) {
            return;
        }
        
        this.currentUser = window.authSystem.getCurrentUser();
        this.bindEvents();
        this.showSection('home');
        this.loadUserTickets();
        this.updateUserInfo();
    }

    bindEvents() {
        // Navigation buttons
        const openTicketBtn = document.getElementById('openTicketBtn');
        if (openTicketBtn) {
            openTicketBtn.addEventListener('click', () => {
                this.showSection('form');
            });
        }

        const backBtn = document.getElementById('backBtn');
        if (backBtn) {
            backBtn.addEventListener('click', () => {
                this.showSection('home');
            });
        }

        const cancelBtn = document.getElementById('cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.showSection('home');
            });
        }

        const newTicketBtn = document.getElementById('newTicketBtn');
        if (newTicketBtn) {
            newTicketBtn.addEventListener('click', () => {
                this.resetForm();
                this.showSection('form');
            });
        }

        // Form submission
        const ticketForm = document.getElementById('ticketForm');
        if (ticketForm) {
            ticketForm.addEventListener('submit', (e) => {
                this.handleFormSubmit(e);
            });
        }

        // Real-time validation
        this.setupFormValidation();
    }

    updateUserInfo() {
        if (!this.currentUser) return;
        
        // Update any user info displays
        const userNameElements = document.querySelectorAll('.user-name');
        userNameElements.forEach(element => {
            element.textContent = this.currentUser.name;
        });
        
        // Pre-fill form with user data
        const userNameField = document.getElementById('userName');
        const discordIdField = document.getElementById('discordId');
        
        if (userNameField) {
            userNameField.value = this.currentUser.name;
            userNameField.setAttribute('readonly', true);
        }
        
        if (discordIdField) {
            discordIdField.value = this.currentUser.discordId;
            discordIdField.setAttribute('readonly', true);
        }
    }

    async loadUserTickets() {
        try {
            const allTickets = await this.getTickets();
            this.userTickets = allTickets.filter(ticket => ticket.userId === this.currentUser.id);
            this.updateTicketStats();
            this.showUserTickets();
        } catch (error) {
            console.error('Error loading user tickets:', error);
        }
    }

    updateTicketStats() {
        const totalUserTickets = this.userTickets.length;
        const pendingUserTickets = this.userTickets.filter(t => t.status === 'pending').length;
        const resolvedUserTickets = this.userTickets.filter(t => t.status === 'resolved').length;
        
        // Update stats in the home section if elements exist
        const totalElement = document.getElementById('userTotalTickets');
        const pendingElement = document.getElementById('userPendingTickets');
        const resolvedElement = document.getElementById('userResolvedTickets');
        
        if (totalElement) totalElement.textContent = totalUserTickets;
        if (pendingElement) pendingElement.textContent = pendingUserTickets;
        if (resolvedElement) resolvedElement.textContent = resolvedUserTickets;
    }

    showUserTickets() {
        const ticketsContainer = document.getElementById('userTicketsContainer');
        if (!ticketsContainer) return;
        
        if (this.userTickets.length === 0) {
            ticketsContainer.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <h3>Nenhum ticket encontrado</h3>
                    <p>Você ainda não criou nenhum ticket.</p>
                </div>
            `;
            return;
        }
        
        ticketsContainer.innerHTML = `
            <h3>Meus Tickets</h3>
            <div class="user-tickets-list">
                ${this.userTickets.map(ticket => this.createUserTicketCard(ticket)).join('')}
            </div>
        `;
    }

    createUserTicketCard(ticket) {
        const statusClass = ticket.status === 'pending' ? 'status-pending' : 'status-resolved';
        const statusText = ticket.status === 'pending' ? '⏳ Pendente' : '✅ Resolvido';
        
        return `
            <div class="user-ticket-card">
                <div class="ticket-header">
                    <span class="ticket-id">${ticket.id}</span>
                    <span class="status-badge ${statusClass}">${statusText}</span>
                </div>
                <div class="ticket-content">
                    <h4>${this.getReasonDisplayName(ticket.reason)}</h4>
                    <p class="ticket-description">${this.truncateText(ticket.description, 100)}</p>
                    <div class="ticket-meta">
                        <span class="ticket-date">Criado em: ${this.formatDate(ticket.createdAt)}</span>
                        <span class="message-count">${ticket.messages ? ticket.messages.length : 0} mensagens</span>
                    </div>
                </div>
                <div class="ticket-actions">
                    <button class="btn btn-primary btn-small" onclick="ticketSystem.openTicketChat('${ticket.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        Abrir Chat
                    </button>
                </div>
            </div>
        `;
    }

    openTicketChat(ticketId) {
        // Open ticket chat in new page
        window.open(`ticket-${ticketId}.html`, '_blank');
    }

    showSection(section) {
        // Hide all sections
        const sections = ['homeSection', 'ticketFormSection', 'successSection'];
        sections.forEach(sectionId => {
            const element = document.getElementById(sectionId);
            if (element) {
                element.classList.add('hidden');
            }
        });

        // Show selected section
        const targetSection = document.getElementById(section + 'Section');
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }
    }

    setupFormValidation() {
        const inputs = ['ticketReason', 'description'];
        
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            const errorElement = document.getElementById(inputId + 'Error');
            
            if (input && errorElement) {
                input.addEventListener('blur', () => {
                    this.validateField(inputId);
                });
                
                input.addEventListener('input', () => {
                    // Clear error on input
                    errorElement.textContent = '';
                    input.classList.remove('error');
                });
            }
        });
    }

    validateField(fieldId) {
        const field = document.getElementById(fieldId);
        const errorElement = document.getElementById(fieldId + 'Error');
        let isValid = true;
        let errorMessage = '';

        if (!field || !errorElement) return true;

        const value = field.value.trim();

        switch(fieldId) {
            case 'ticketReason':
                if (!value) {
                    errorMessage = 'Selecione um motivo para o ticket';
                    isValid = false;
                }
                break;

            case 'description':
                if (!value) {
                    errorMessage = 'Descrição é obrigatória';
                    isValid = false;
                } else if (value.length < 10) {
                    errorMessage = 'Descrição deve ter pelo menos 10 caracteres';
                    isValid = false;
                } else if (value.length > 1000) {
                    errorMessage = 'Descrição deve ter no máximo 1000 caracteres';
                    isValid = false;
                }
                break;
        }

        if (!isValid) {
            errorElement.textContent = errorMessage;
            field.classList.add('error');
        } else {
            errorElement.textContent = '';
            field.classList.remove('error');
        }

        return isValid;
    }

    validateForm() {
        const fields = ['ticketReason', 'description'];
        let isValid = true;

        fields.forEach(fieldId => {
            if (!this.validateField(fieldId)) {
                isValid = false;
            }
        });

        return isValid;
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            this.showNotification('Por favor, corrija os erros no formulário', 'error');
            return;
        }

        const formData = new FormData(e.target);
        const ticketData = {
            id: this.generateTicketId(),
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            discordId: this.currentUser.discordId,
            userEmail: this.currentUser.email,
            reason: formData.get('ticketReason'),
            description: formData.get('description').trim(),
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            messages: [
                {
                    id: this.generateMessageId(),
                    senderId: this.currentUser.id,
                    senderName: this.currentUser.name,
                    senderType: 'user',
                    message: formData.get('description').trim(),
                    timestamp: new Date().toISOString()
                }
            ]
        };

        try {
            await this.saveTicket(ticketData);
            await this.logAction('ticket_create', `Ticket criado: ${ticketData.id}`, this.currentUser.id);
            
            this.showTicketSuccess(ticketData.id);
            this.resetForm();
            this.loadUserTickets(); // Refresh user tickets
        } catch (error) {
            console.error('Error saving ticket:', error);
            this.showNotification('Erro ao salvar ticket. Tente novamente.', 'error');
        }
    }

    generateTicketId() {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substr(2, 5).toUpperCase();
        return `TK-${timestamp}-${randomPart}`;
    }

    generateMessageId() {
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substr(2, 3).toUpperCase();
        return `MSG-${timestamp}-${randomPart}`;
    }

    async saveTicket(ticketData) {
        try {
            const existingTickets = await this.getTickets();
            existingTickets.push(ticketData);
            localStorage.setItem('discord_tickets', JSON.stringify(existingTickets));
            
            // Update statistics
            this.updateStatistics();
            
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            throw new Error('Failed to save ticket');
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

    updateStatistics() {
        const tickets = JSON.parse(localStorage.getItem('discord_tickets') || '[]');
        const stats = {
            total: tickets.length,
            pending: tickets.filter(t => t.status === 'pending').length,
            resolved: tickets.filter(t => t.status === 'resolved').length,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('ticket_stats', JSON.stringify(stats));
    }

    showTicketSuccess(ticketId) {
        document.getElementById('ticketId').textContent = ticketId;
        this.showSection('success');
    }

    resetForm() {
        const form = document.getElementById('ticketForm');
        if (!form) return;
        
        // Reset form but keep user fields readonly
        const reasonField = document.getElementById('ticketReason');
        const descriptionField = document.getElementById('description');
        
        if (reasonField) reasonField.value = '';
        if (descriptionField) descriptionField.value = '';
        
        // Clear all error messages
        const errorElements = form.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
        });
        
        // Remove error classes
        const inputElements = form.querySelectorAll('.error');
        inputElements.forEach(element => {
            element.classList.remove('error');
        });
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

    // Utility methods
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
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

    showNotification(message, type = 'info') {
        // Use the notification system from auth.js
        if (window.authSystem && window.authSystem.showNotification) {
            window.authSystem.showNotification(message, type);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth system to be ready
    setTimeout(() => {
        window.ticketSystem = new TicketSystem();
    }, 100);
});