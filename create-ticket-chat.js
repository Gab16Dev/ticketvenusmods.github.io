// This script creates dynamic ticket chat pages
// It reads the template and creates individual chat pages for each ticket

const fs = require('fs');
const path = require('path');

// Read the template
const templatePath = 'ticket-template.html';
const template = fs.readFileSync(templatePath, 'utf8');

// Get tickets from localStorage simulation (in a real app, this would come from database)
function createTicketChatPage(ticketId) {
    // Replace template placeholders with actual ticket ID
    const chatPage = template.replace(/ticket-template/g, `ticket-${ticketId}`);
    
    // Write the chat page
    const outputPath = `ticket-${ticketId}.html`;
    fs.writeFileSync(outputPath, chatPage);
    
    console.log(`Created chat page: ${outputPath}`);
}

// Example usage - this would be called when a ticket is created
// createTicketChatPage('TK-12345');

module.exports = { createTicketChatPage };