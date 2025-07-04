// Script.js - Main application logic for ticket system
class TicketSystem {
    constructor() {
        this.init();
    }

    init() {
        this.bindEvents();
        this.showSection('home');
    }

    bindEvents() {
        // Navigation buttons
        document.getElementById('openTicketBtn').addEventListener('click', () => {
            this.showSection('form');
        });

        document.getElementById('backBtn').addEventListener('click', () => {
            this.showSection('home');
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.showSection('home');
        });

        document.getElementById('newTicketBtn').addEventListener('click', () => {
            this.resetForm();
            this.showSection('form');
        });

        // Form submission
        document.getElementById('ticketForm').addEventListener('submit', (e) => {
            this.handleFormSubmit(e);
        });

        // Real-time validation
        this.setupFormValidation();
    }

    showSection(section) {
        // Hide all sections
        document.getElementById('homeSection').classList.add('hidden');
        document.getElementById('ticketFormSection').classList.add('hidden');
        document.getElementById('successSection').classList.add('hidden');

        // Show selected section
        switch(section) {
            case 'home':
                document.getElementById('homeSection').classList.remove('hidden');
                break;
            case 'form':
                document.getElementById('ticketFormSection').classList.remove('hidden');
                break;
            case 'success':
                document.getElementById('successSection').classList.remove('hidden');
                break;
        }
    }

    setupFormValidation() {
        const inputs = ['userName', 'discordId', 'ticketReason', 'description'];
        
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
            case 'userName':
                if (!value) {
                    errorMessage = 'Nome do usuário é obrigatório';
                    isValid = false;
                } else if (value.length < 2) {
                    errorMessage = 'Nome deve ter pelo menos 2 caracteres';
                    isValid = false;
                } else if (value.length > 50) {
                    errorMessage = 'Nome deve ter no máximo 50 caracteres';
                    isValid = false;
                }
                break;

            case 'discordId':
                if (!value) {
                    errorMessage = 'ID do Discord é obrigatório';
                    isValid = false;
                } else if (!/^\d{17,19}$/.test(value)) {
                    errorMessage = 'ID do Discord deve conter entre 17-19 dígitos';
                    isValid = false;
                }
                break;

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
        const fields = ['userName', 'discordId', 'ticketReason', 'description'];
        let isValid = true;

        fields.forEach(fieldId => {
            if (!this.validateField(fieldId)) {
                isValid = false;
            }
        });

        return isValid;
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            this.showNotification('Por favor, corrija os erros no formulário', 'error');
            return;
        }

        const formData = new FormData(e.target);
        const ticketData = {
            id: this.generateTicketId(),
            userName: formData.get('userName').trim(),
            discordId: formData.get('discordId').trim(),
            reason: formData.get('ticketReason'),
            description: formData.get('description').trim(),
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        try {
            this.saveTicket(ticketData);
            this.showTicketSuccess(ticketData.id);
            this.resetForm();
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

    saveTicket(ticketData) {
        try {
            const existingTickets = this.getTickets();
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

    getTickets() {
        try {
            const tickets = localStorage.getItem('discord_tickets');
            return tickets ? JSON.parse(tickets) : [];
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return [];
        }
    }

    updateStatistics() {
        const tickets = this.getTickets();
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
        form.reset();
        
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

        // Add styles for notification
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
                
                .notification-info {
                    background: var(--discord-blurple);
                    color: white;
                }
                
                .notification-error {
                    background: var(--discord-red);
                    color: white;
                }
                
                .notification-success {
                    background: var(--discord-green);
                    color: white;
                }
                
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
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
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

    // Utility method to format dates
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

    // Utility method to get reason display name
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
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TicketSystem();
});

// Export for use in other scripts if needed
window.TicketSystem = TicketSystem;
