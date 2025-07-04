// Admin.js - Administrative panel functionality
class AdminPanel {
    constructor() {
        this.isAuthenticated = false;
        this.currentFilters = {
            status: 'all',
            reason: 'all'
        };
        this.init();
    }

    init() {
        this.checkAuthState();
        this.bindEvents();
        
        if (this.isAuthenticated) {
            this.showDashboard();
        } else {
            this.showLogin();
        }
    }

    bindEvents() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                this.handleLogin(e);
            });
        }

        // Dashboard actions
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        const refreshBtn = document.getElementById('refreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.loadTickets();
            });
        }

        // Filters
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.currentFilters.status = e.target.value;
                this.applyFilters();
            });
        }

        const reasonFilter = document.getElementById('reasonFilter');
        if (reasonFilter) {
            reasonFilter.addEventListener('change', (e) => {
                this.currentFilters.reason = e.target.value;
                this.applyFilters();
            });
        }

        // Modal events
        const modalClose = document.getElementById('modalClose');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.closeModal();
            });
        }

        const modal = document.getElementById('ticketModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal();
                }
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeModal();
            }
        });
    }

    checkAuthState() {
        const authState = localStorage.getItem('admin_auth');
        if (authState) {
            try {
                const auth = JSON.parse(authState);
                const now = new Date().getTime();
                // Session expires after 24 hours
                if (auth.expires > now) {
                    this.isAuthenticated = true;
                } else {
                    localStorage.removeItem('admin_auth');
                }
            } catch (error) {
                localStorage.removeItem('admin_auth');
            }
        }
    }

    handleLogin(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const username = formData.get('username').trim();
        const password = formData.get('password').trim();
        
        // Clear previous errors
        const errorElement = document.getElementById('loginError');
        errorElement.textContent = '';
        
        // Validate credentials
        if (username === 'admin' && password === '1234') {
            this.authenticateUser();
            this.showDashboard();
            this.showNotification('Login realizado com sucesso!', 'success');
        } else {
            errorElement.textContent = 'Usuário ou senha incorretos';
            this.showNotification('Credenciais inválidas', 'error');
        }
    }

    authenticateUser() {
        this.isAuthenticated = true;
        const expirationTime = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 hours
        const authData = {
            authenticated: true,
            expires: expirationTime,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('admin_auth', JSON.stringify(authData));
    }

    handleLogout() {
        this.isAuthenticated = false;
        localStorage.removeItem('admin_auth');
        this.showLogin();
        this.showNotification('Logout realizado com sucesso', 'info');
    }

    showLogin() {
        document.getElementById('loginSection').classList.remove('hidden');
        document.getElementById('adminDashboard').classList.add('hidden');
    }

    showDashboard() {
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('adminDashboard').classList.remove('hidden');
        this.loadTickets();
        this.updateStatistics();
    }

    loadTickets() {
        try {
            const tickets = this.getTickets();
            this.renderTickets(tickets);
            this.updateStatistics();
        } catch (error) {
            console.error('Error loading tickets:', error);
            this.showNotification('Erro ao carregar tickets', 'error');
        }
    }

    getTickets() {
        try {
            const tickets = localStorage.getItem('discord_tickets');
            return tickets ? JSON.parse(tickets) : [];
        } catch (error) {
            console.error('Error reading tickets from localStorage:', error);
            return [];
        }
    }

    saveTickets(tickets) {
        try {
            localStorage.setItem('discord_tickets', JSON.stringify(tickets));
            this.updateStatistics();
            return true;
        } catch (error) {
            console.error('Error saving tickets:', error);
            throw new Error('Failed to save tickets');
        }
    }

    updateStatistics() {
        const tickets = this.getTickets();
        const totalTickets = tickets.length;
        const pendingTickets = tickets.filter(t => t.status === 'pending').length;
        const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;

        document.getElementById('totalTickets').textContent = totalTickets;
        document.getElementById('pendingTickets').textContent = pendingTickets;
        document.getElementById('resolvedTickets').textContent = resolvedTickets;
    }

    renderTickets(tickets) {
        const tableBody = document.getElementById('ticketsTableBody');
        const emptyState = document.getElementById('emptyState');
        const tableContainer = document.getElementById('ticketsTableContainer');

        if (!tableBody) return;

        if (tickets.length === 0) {
            emptyState.classList.remove('hidden');
            tableContainer.classList.add('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        tableContainer.classList.remove('hidden');

        tableBody.innerHTML = '';

        tickets.forEach(ticket => {
            const row = this.createTicketRow(ticket);
            tableBody.appendChild(row);
        });
    }

    createTicketRow(ticket) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="ticket-id">${ticket.id}</td>
            <td class="ticket-user">${this.escapeHtml(ticket.userName)}</td>
            <td class="ticket-discord-id">${this.escapeHtml(ticket.discordId)}</td>
            <td class="ticket-reason">
                <span class="reason-badge">${this.getReasonDisplayName(ticket.reason)}</span>
            </td>
            <td class="ticket-date">${this.formatDate(ticket.createdAt)}</td>
            <td class="ticket-status">
                <span class="status-badge status-${ticket.status}">
                    ${ticket.status === 'pending' ? '⏳ Pendente' : '✅ Resolvido'}
                </span>
            </td>
            <td class="ticket-actions">
                <div class="action-buttons">
                    <button class="btn btn-small btn-view" onclick="adminPanel.viewTicket('${ticket.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        Ver
                    </button>
                    ${ticket.status === 'pending' ? `
                        <button class="btn btn-small btn-resolve" onclick="adminPanel.resolveTicket('${ticket.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <path d="M22 4L12 14.01l-3-3"></path>
                            </svg>
                            Resolver
                        </button>
                    ` : ''}
                    <button class="btn btn-small btn-delete" onclick="adminPanel.deleteTicket('${ticket.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3,6 5,6 21,6"></polyline>
                            <path d="M19,6V20a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6M8,6V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"></path>
                        </svg>
                        Excluir
                    </button>
                </div>
            </td>
        `;
        return row;
    }

    applyFilters() {
        const tickets = this.getTickets();
        let filteredTickets = [...tickets];

        // Apply status filter
        if (this.currentFilters.status !== 'all') {
            filteredTickets = filteredTickets.filter(ticket => 
                ticket.status === this.currentFilters.status
            );
        }

        // Apply reason filter
        if (this.currentFilters.reason !== 'all') {
            filteredTickets = filteredTickets.filter(ticket => 
                ticket.reason === this.currentFilters.reason
            );
        }

        this.renderTickets(filteredTickets);
    }

    viewTicket(ticketId) {
        const tickets = this.getTickets();
        const ticket = tickets.find(t => t.id === ticketId);
        
        if (!ticket) {
            this.showNotification('Ticket não encontrado', 'error');
            return;
        }

        this.showTicketModal(ticket);
    }

    showTicketModal(ticket) {
        const modal = document.getElementById('ticketModal');
        const modalBody = document.getElementById('modalBody');

        modalBody.innerHTML = `
            <div class="ticket-detail">
                <label>ID do Ticket:</label>
                <div class="ticket-detail-content">${ticket.id}</div>
            </div>
            <div class="ticket-detail">
                <label>Nome do Usuário:</label>
                <div class="ticket-detail-content">${this.escapeHtml(ticket.userName)}</div>
            </div>
            <div class="ticket-detail">
                <label>ID do Discord:</label>
                <div class="ticket-detail-content">${this.escapeHtml(ticket.discordId)}</div>
            </div>
            <div class="ticket-detail">
                <label>Motivo:</label>
                <div class="ticket-detail-content">${this.getReasonDisplayName(ticket.reason)}</div>
            </div>
            <div class="ticket-detail">
                <label>Status:</label>
                <div class="ticket-detail-content">
                    <span class="status-badge status-${ticket.status}">
                        ${ticket.status === 'pending' ? '⏳ Pendente' : '✅ Resolvido'}
                    </span>
                </div>
            </div>
            <div class="ticket-detail">
                <label>Data de Criação:</label>
                <div class="ticket-detail-content">${this.formatDate(ticket.createdAt)}</div>
            </div>
            ${ticket.updatedAt !== ticket.createdAt ? `
                <div class="ticket-detail">
                    <label>Última Atualização:</label>
                    <div class="ticket-detail-content">${this.formatDate(ticket.updatedAt)}</div>
                </div>
            ` : ''}
            <div class="ticket-detail">
                <label>Descrição:</label>
                <div class="ticket-detail-content">${this.escapeHtml(ticket.description)}</div>
            </div>
        `;

        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        const modal = document.getElementById('ticketModal');
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }

    resolveTicket(ticketId) {
        if (!confirm('Tem certeza que deseja marcar este ticket como resolvido?')) {
            return;
        }

        try {
            const tickets = this.getTickets();
            const ticketIndex = tickets.findIndex(t => t.id === ticketId);
            
            if (ticketIndex === -1) {
                this.showNotification('Ticket não encontrado', 'error');
                return;
            }

            tickets[ticketIndex].status = 'resolved';
            tickets[ticketIndex].updatedAt = new Date().toISOString();
            
            this.saveTickets(tickets);
            this.loadTickets();
            this.showNotification('Ticket marcado como resolvido', 'success');
        } catch (error) {
            console.error('Error resolving ticket:', error);
            this.showNotification('Erro ao resolver ticket', 'error');
        }
    }

    deleteTicket(ticketId) {
        if (!confirm('Tem certeza que deseja excluir este ticket? Esta ação não pode ser desfeita.')) {
            return;
        }

        try {
            const tickets = this.getTickets();
            const filteredTickets = tickets.filter(t => t.id !== ticketId);
            
            if (filteredTickets.length === tickets.length) {
                this.showNotification('Ticket não encontrado', 'error');
                return;
            }

            this.saveTickets(filteredTickets);
            this.loadTickets();
            this.showNotification('Ticket excluído com sucesso', 'success');
        } catch (error) {
            console.error('Error deleting ticket:', error);
            this.showNotification('Erro ao excluir ticket', 'error');
        }
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

        // Add styles for notification if not already present
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

    // Export data functionality
    exportTickets() {
        try {
            const tickets = this.getTickets();
            const dataStr = JSON.stringify(tickets, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `tickets_export_${new Date().toISOString().split('T')[0]}.json`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
            this.showNotification('Dados exportados com sucesso', 'success');
        } catch (error) {
            console.error('Error exporting tickets:', error);
            this.showNotification('Erro ao exportar dados', 'error');
        }
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

// Make AdminPanel available globally for onclick handlers
window.AdminPanel = AdminPanel;
