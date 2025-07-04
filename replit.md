# Sistema de Tickets Discord

## Overview

This repository contains a complete Discord-style ticket support system with user authentication, real-time chat functionality, and comprehensive administrative controls. The application is built using vanilla HTML, CSS, and JavaScript, featuring a modern Discord-themed UI design with responsive layout capabilities and structured file organization.

## System Architecture

### Frontend Architecture
- **Pure Web Technologies**: Built with vanilla HTML5, CSS3, and JavaScript (ES6+)
- **Multi-Page Application**: Organized with separate pages for authentication, main dashboard, admin panel, and ticket chats
- **Component-Based Structure**: Organized into logical classes (`AuthSystem`, `TicketSystem`, `AdminPanel`, `TicketChat`) for modularity
- **Responsive Design**: Mobile-first approach with Discord-inspired color scheme and styling

### Backend Simulation
- **Client-Side Data Management**: Uses browser localStorage to simulate database operations
- **Session Management**: Implements secure session handling with timeout functionality
- **File Structure Simulation**: Organized `/database/` folder with JSON files for data structure planning

### Authentication System
- **User Registration**: Complete user registration with validation (name, email, Discord ID, password)
- **Session Management**: Secure login/logout with 24-hour session timeout
- **Access Control**: Protected routes requiring authentication for ticket access
- **Admin Authentication**: Separate admin panel with independent authentication

## Key Components

### User Interface Pages
1. **Login Page** (`login.html`): User authentication interface
2. **Registration Page** (`register.html`): New user account creation
3. **Main Dashboard** (`index.html`): User's personal ticket management hub
4. **Admin Panel** (`admin.html`): Administrative interface for all ticket management
5. **Ticket Chat Pages** (`ticket-template.html`): Real-time chat interface for individual tickets

### Core JavaScript Classes
- **AuthSystem** (`js/auth.js`): Complete authentication management, user registration, session handling
- **TicketSystem** (`js/main.js`): User ticket creation, viewing, and management
- **AdminPanel** (`js/admin.js`): Administrative functions, ticket oversight, system logs
- **TicketChat** (`js/chat.js`): Real-time messaging system for ticket conversations

### Data Structure
- **Users Database** (`database/users.json`): User accounts and profiles
- **Tickets Database** (`database/tickets.json`): Tickets with embedded chat messages
- **System Logs** (`database/logs.json`): Action logging and audit trail
- **Configuration** (`database/config.json`): System settings and admin credentials

## Data Flow

### User Journey
1. **Registration/Login** → Authentication → Session Creation
2. **Dashboard Access** → View Personal Tickets → Create New Tickets
3. **Ticket Chat** → Real-time messaging with admins → Resolution tracking

### Admin Journey
1. **Admin Login** → Dashboard Access → System Overview
2. **Ticket Management** → View All Tickets → Filter/Search → Open Chats
3. **Resolution Process** → Chat with users → Mark as resolved → Export data

### Chat System Flow
1. **Ticket Creation** → Initial message logged → Chat page generated
2. **Message Exchange** → Real-time updates → Message persistence
3. **Resolution** → Admin marks resolved → System message logged

## New Features (July 04, 2025)

### User Authentication System
- Complete user registration with email and Discord ID validation
- Secure session management with automatic timeout
- Protected access to ticket system (users can only view their own tickets)
- Password validation and confirmation matching

### Real-Time Chat System
- Individual chat pages for each ticket with unique URLs
- Real-time messaging between users and administrators
- Message timestamps and sender identification
- Automatic message refresh and scroll-to-bottom functionality
- System messages for ticket status changes

### Enhanced Admin Panel
- Comprehensive ticket overview with message counts
- Quick access to ticket chats through dedicated chat buttons
- Advanced filtering by status and reason
- System activity logs with recent actions
- Data export functionality for backup and analysis
- Enhanced statistics including recent activity tracking

### Improved User Experience
- Personal ticket dashboard showing user's ticket history
- Ticket cards with quick access to chat functionality
- User statistics (total, pending, resolved tickets)
- Pre-filled forms with user information
- Logout functionality with session cleanup

## External Dependencies

### Current Dependencies
- **None**: Pure vanilla implementation without external libraries or frameworks

### Ready for Integration
- **Database**: Structured for easy PostgreSQL integration via Drizzle ORM
- **Authentication**: Prepared for JWT or OAuth implementation
- **Real-time Updates**: Architecture ready for WebSocket integration
- **Discord API**: Structure supports Discord bot integration for notifications

## File Structure

```
/
├── index.html              # Main user dashboard (requires login)
├── login.html              # User login page
├── register.html           # User registration page
├── admin.html              # Admin panel (separate auth)
├── ticket-template.html    # Template for ticket chat pages
├── style.css               # Complete styling system
├── js/
│   ├── auth.js            # Authentication system
│   ├── main.js            # Main user functionality
│   ├── admin.js           # Admin panel functionality
│   └── chat.js            # Ticket chat system
├── database/
│   ├── users.json         # User accounts (simulated)
│   ├── tickets.json       # Tickets with messages (simulated)
│   ├── logs.json          # System logs (simulated)
│   └── config.json        # System configuration
└── create-ticket-chat.js  # Utility for dynamic chat page creation
```

## Changelog

```
Changelog:
- July 04, 2025: Major architectural update
  - Added complete user authentication system
  - Implemented real-time chat functionality for tickets
  - Created structured file organization
  - Added admin panel enhancements with chat access
  - Implemented system logging and audit trail
  - Added data export functionality
  - Enhanced user experience with personal dashboards
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```

## Security Considerations

### Current Implementation
- Session-based authentication with timeout
- Input validation and sanitization
- Access control preventing cross-user ticket access
- Admin authentication separate from user authentication

### Production Readiness Notes
- Passwords are currently stored in plain text (localStorage)
- No server-side validation or encryption
- Ready for implementation of proper authentication systems
- Structure supports easy migration to secure backend systems

## Development Patterns

### Code Organization
- Clear separation between authentication, user functionality, and admin features
- Modular class structure with single responsibility principle
- Event-driven architecture with proper error handling
- Consistent naming conventions and documentation

### Data Management
- Structured data flow with validation layers
- Local storage used as database simulation
- Proper error handling and user feedback
- Audit logging for administrative actions