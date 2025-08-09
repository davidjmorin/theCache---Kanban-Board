# Kanban Board Application

A modern, feature-rich kanban board built with vanilla JavaScript and PHP. This application provides comprehensive project management and task tracking capabilities with advanced features like email notifications, file attachments, and real-time collaboration.

## 🚀 **Core Features**

### **📋 Task Management**
- **Create & Edit Tasks** - Full CRUD operations with rich text descriptions
- **Task Assignment** - Assign tasks to specific users and clients
- **Priority Levels** - Set low, medium, or high priority for tasks
- **Due Dates & Times** - Set deadlines with date and time precision
- **Task Completion** - Mark tasks as complete with visual indicators
- **Task Color Coding** - Customize task card colors for visual organization
- **Quick Add** - Rapid task creation with minimal required fields

### **📊 Board Management**
- **Multiple Boards** - Create and manage multiple kanban boards
- **Custom Board Colors** - Personalize board appearance with custom colors
- **Board Icons** - Choose from Font Awesome icons for board identification
- **Board Descriptions** - Add detailed descriptions for board context
- **Default Board Selection** - Automatically loads last used board on login
- **Board Sharing** - Share boards with team members for collaboration

### **🔄 Stage Management**
- **Dynamic Stages** - Create, edit, and delete workflow stages
- **Custom Stage Colors** - Color-code stages for visual organization
- **Stage Reordering** - Drag and drop stages to reorder them
- **Stage Position Control** - Precise control over stage positioning

### **👥 User Management**
- **User Registration & Login** - Secure authentication system
- **User Roles** - Admin and regular user permissions
- **User Profiles** - Manage user information and settings
- **Password Management** - Secure password change functionality
- **User Activation/Deactivation** - Control user access to the system
- **Admin Controls** - Grant and revoke admin privileges

### **🏢 Client Management & CRM**
- **Client Database** - Comprehensive client information management
- **Client Assignment** - Associate tasks with specific clients
- **Client Task Views** - View all tasks for a specific client
- **Client Search** - Search and filter clients efficiently
- **CRM System** - Full-featured Customer Relationship Management
- **Client Profiles** - Detailed client information with contact details
- **Client Activities** - Track all interactions and activities
- **Client Contacts** - Manage multiple contacts per client
- **Client Attachments** - Store and manage client documents
- **Client To-Dos** - Create and track client-specific tasks
- **Client Groups** - Organize clients into groups
- **Activity History** - Complete audit trail of client interactions
- **Client Status Tracking** - Lead, prospect, customer, vendor management
- **Account Management** - Assign account managers to clients

### **📝 Notes & Communication**
- **Task Notes** - Add detailed notes to any task
- **Note Types** - Categorize notes (general, update, issue, etc.)
- **Rich Text Notes** - Support for markdown formatting in notes
- **Note History** - Track all notes with timestamps
- **Note Notifications** - Email notifications when notes are added

### **📎 File Attachments**
- **File Upload** - Upload documents, images, and other files
- **File Management** - View, download, and delete attachments
- **File Size Validation** - Secure file size limits and validation
- **Multiple File Types** - Support for various file formats
- **Attachment Organization** - Organize files by task

### **✅ Checklists**
- **Task Checklists** - Create detailed checklists within tasks
- **Checklist Items** - Add, edit, and delete checklist items
- **Progress Tracking** - Visual progress indicators for checklists
- **Checklist Completion** - Mark individual items as complete

### **📧 Email Notifications**
- **Brevo Integration** - Professional email delivery via Brevo API
- **Task Sharing Notifications** - Email alerts when tasks are shared
- **Board Sharing Notifications** - Notifications for board sharing
- **Note Update Notifications** - Alerts when notes are added to shared tasks
- **Due Date Notifications** - Automated reminders for upcoming tasks
- **Custom Email Templates** - Beautiful, responsive email designs

### **🔍 Search & Filtering**
- **Global Search** - Search across tasks, clients, and projects
- **Advanced Filtering** - Filter by user, client, priority, status
- **Search Results** - Organized search results with categories
- **Real-time Search** - Instant search results as you type

### **🎨 User Interface**
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Themes** - Toggle between theme modes
- **Custom Color Schemes** - Personalized board and task colors
- **Modern UI/UX** - Clean, intuitive interface design
- **Mobile Optimization** - Touch-friendly mobile interface
- **Accessibility Features** - Keyboard navigation and screen reader support

### **🔄 Real-time Features**
- **Auto-refresh** - Automatic updates every 30 seconds
- **Live Updates** - Real-time task and board updates
- **Change Notifications** - Visual indicators for new changes
- **Collaborative Editing** - Multiple users can work simultaneously

### **📱 Mobile Features**
- **Mobile Menu** - Touch-optimized mobile navigation
- **Responsive Layout** - Adaptive design for all screen sizes
- **Touch Gestures** - Swipe and tap interactions
- **Mobile Board Selector** - Easy board switching on mobile

### **🔐 Security Features**
- **Advanced Authentication** - Secure password hashing with bcrypt and session management
- **CSRF Protection** - Cross-Site Request Forgery prevention with token validation
- **Rate Limiting** - Brute force protection for login attempts
- **SQL Injection Protection** - Parameterized queries and prepared statements
- **XSS Protection** - Comprehensive input sanitization and output escaping
- **Content Security Policy** - Strict CSP headers to prevent code injection
- **File Upload Security** - MIME type validation, size limits, and malicious content scanning
- **CORS Configuration** - Restricted cross-origin access with environment-based origins
- **Security Headers** - HSTS, X-Frame-Options, X-Content-Type-Options, and more
- **Input Validation** - Multi-layer validation with custom sanitization functions
- **Security Logging** - Comprehensive audit trail of security events
- **Environment-Based Config** - All sensitive configuration via .env files

### **⚡ Performance Features**
- **Optimized Loading** - Efficient data loading and caching
- **Lazy Loading** - Progressive loading of board content
- **Minimal API Calls** - Optimized API request patterns
- **Fast Rendering** - Efficient DOM updates and re-renders

### **🛠️ Administrative Features**
- **Company Management** - Edit company name and branding
- **System Monitoring** - Track user activity and system usage
- **Data Management** - Comprehensive data backup and export
- **User Activity Logs** - Track user actions and system events

## 🛠️ **Technical Stack**

### **Frontend**
- **Vanilla JavaScript** - No framework dependencies
- **HTML5** - Semantic markup and modern features
- **CSS3** - Advanced styling with CSS variables
- **Font Awesome 6** - Professional icon library
- **Markdown Support** - Rich text formatting capabilities

### **Backend**
- **PHP 7.4+** - Modern PHP with comprehensive security features
- **MySQL 5.7+** - Reliable database with prepared statements
- **RESTful API** - Secure, stateless API with CSRF protection
- **Environment Configuration** - Complete .env-based configuration management
- **Security Framework** - Multi-layer security with rate limiting and audit logging
- **Apache/Nginx** - Web server with security headers and HTTPS enforcement

### **External Services**
- **Brevo Email Service** - Professional email delivery
- **Font Awesome CDN** - Icon library delivery
- **Google Fonts** - Typography optimization

## 📦 **Installation**

### **Prerequisites**
- **PHP 7.4 or higher** with required extensions (PDO, MySQLi, fileinfo)
- **MySQL 5.7 or higher** or MariaDB equivalent
- **Web server** (Apache with mod_rewrite and mod_headers, or Nginx)
- **HTTPS/SSL Certificate** (required for secure session cookies)
- **Brevo account** for email notifications
- **Domain name** for production deployment

### **Setup Steps**

1. **Clone or download the project files**

2. **Environment Configuration**
   - Create `.env` file in the root directory
   - Configure all required settings:
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_NAME=kanban_board2
   DB_USER=your_username
   DB_PASS=your_password
   
   # Email Service Configuration
   BREVO_API_KEY=your-brevo-api-key
   SENDER_EMAIL=noreply@yourdomain.com
   SENDER_NAME=Your Task Management System
   ADMIN_EMAIL=admin@yourdomain.com
   
   # Security Configuration
   CORS_ORIGIN=https://yourdomain.com
   
   # Optional: Google Services
   GOOGLE_API_KEY=your-google-api-key
   ```

3. **Database Setup**
   - The application will automatically create the database and tables on first run
   - Tables include: companies, boards, stages, tasks, users, clients, notes, attachments, checklists, shares

4. **Security Setup**
   ```bash
   # Set secure file permissions
   chmod 755 uploads/
   chmod 600 .env
   chown www-data:www-data uploads/
   chown www-data:www-data .env
   
   # Ensure Apache modules are enabled (if using Apache)
   a2enmod headers
   a2enmod rewrite
   systemctl reload apache2
   ```

5. **Email Configuration**
   - Sign up for a free Brevo account
   - Create an API key with SMTP permissions
   - Configure email settings in your `.env` file
   - Set appropriate sender domains and email addresses

6. **Security Configuration**
   - Update `CORS_ORIGIN` to match your domain
   - Configure security headers via the included `.htaccess`
   - Set up HTTPS (required for secure session cookies)
   - Review and adjust security settings as needed

## 🚀 **Quick Start**

1. **Access the Application** - Navigate to your web server
2. **Register/Login** - Create an account or log in
3. **Create Your First Board** - Set up your initial kanban board
4. **Add Stages** - Create workflow stages (To Do, In Progress, Done)
5. **Create Tasks** - Start adding tasks to your board
6. **Invite Team Members** - Add users to collaborate
7. **Customize** - Personalize colors, icons, and settings

## 📚 **API Documentation**

The application provides a comprehensive RESTful API:

### **Authentication**
- `POST /api/login` - User login
- `POST /api/register` - User registration
- `POST /api/logout` - User logout
- `GET /api/check-auth` - Check authentication status

### **Companies**
- `GET /api/company` - Get company information
- `PUT /api/company` - Update company name

### **Boards**
- `GET /api/boards` - List all boards
- `POST /api/boards` - Create new board
- `PUT /api/boards/{id}` - Update board
- `DELETE /api/boards/{id}` - Delete board
- `GET /api/board` - Get specific board with all data

### **Stages**
- `GET /api/stages` - List all stages
- `POST /api/stages` - Create new stage
- `PUT /api/stages/{id}` - Update stage
- `DELETE /api/stages/{id}` - Delete stage

### **Tasks**
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/{id}` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task
- `POST /api/tasks/{id}/toggle` - Toggle task completion

### **Users**
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user
- `POST /api/users/{id}/password` - Change password

### **Clients**
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create new client
- `PUT /api/clients/{id}` - Update client
- `DELETE /api/clients/{id}` - Delete client
- `GET /api/clients/{id}/tasks` - Get client tasks

### **CRM System**
- `GET /api/crm-clients` - List all clients with CRM data
- `POST /api/crm-clients` - Create new client with full CRM fields
- `GET /api/crm-client?id={id}` - Get detailed client profile with all related data
- `PUT /api/crm-client?id={id}` - Update client with CRM fields
- `DELETE /api/crm-client?id={id}` - Delete client
- `GET /api/crm-contacts?client_id={id}` - Get client contacts
- `POST /api/crm-contacts?client_id={id}` - Add client contact
- `GET /api/crm-activities?client_id={id}` - Get client activities
- `POST /api/crm-activities?client_id={id}` - Add client activity
- `GET /api/crm-todos?client_id={id}` - Get client to-dos
- `POST /api/crm-todos?client_id={id}` - Add client to-do
- `GET /api/crm-groups` - Get client groups
- `POST /api/crm-groups` - Create client group

### **Notes**
- `GET /api/notes` - List all notes
- `POST /api/notes` - Create new note
- `DELETE /api/notes/{id}` - Delete note

### **Attachments**
- `POST /api/attachments` - Upload file
- `DELETE /api/attachments/{id}` - Delete attachment

### **Sharing**
- `POST /api/share-board` - Share board with users
- `POST /api/share-task` - Share task with users
- `POST /api/unshare-board` - Remove board sharing
- `POST /api/unshare-task` - Remove task sharing

### **Notifications**
- `GET /api/notifications` - List notifications
- `POST /api/notifications/{id}/read` - Mark notification as read
- `DELETE /api/notifications/{id}` - Delete notification

## 🔒 **Comprehensive Security Framework**

### **🛡️ Authentication & Session Security**
- **Secure Password Hashing** - bcrypt with proper salt rounds
- **Session Management** - Secure session configuration with HTTPOnly, Secure, and SameSite settings
- **Session Regeneration** - Automatic session ID regeneration on authentication
- **Rate Limiting** - Brute force protection for login attempts
- **Account Lockout** - Protection against repeated failed login attempts

### **🔐 Cross-Site Attack Prevention**
- **CSRF Protection** - Token-based validation for all state-changing operations
- **XSS Protection** - Multi-layer input sanitization and output escaping
- **Content Security Policy** - Strict CSP headers preventing code injection
- **X-Frame-Options** - Clickjacking protection
- **Input Validation** - Custom validation functions with comprehensive sanitization

### **💉 SQL Injection Prevention**
- **Parameterized Queries** - All database interactions use prepared statements
- **Type Validation** - Strict type checking for all inputs
- **Error Handling** - Secure error messages without database structure leakage

### **📁 File Upload Security**
- **MIME Type Validation** - Server-side file type verification
- **File Size Limits** - Configurable upload size restrictions
- **Content Scanning** - Detection and prevention of malicious file content
- **Secure File Storage** - Isolated upload directory with execution prevention
- **File Extension Filtering** - Whitelist-based file type restrictions

### **🌐 Network Security**
- **HTTPS Enforcement** - Automatic redirect to secure connections
- **HSTS Headers** - HTTP Strict Transport Security implementation
- **CORS Configuration** - Environment-based origin restrictions
- **Security Headers** - Comprehensive security header implementation

### **📊 Security Monitoring**
- **Security Event Logging** - Comprehensive audit trail of security events
- **Failed Login Tracking** - Monitoring and logging of authentication failures
- **Suspicious Activity Detection** - Automated detection of potential threats
- **IP-based Rate Limiting** - Protection against distributed attacks

### **⚙️ Configuration Security**
- **Environment Variables** - All sensitive configuration externalized
- **Secure File Permissions** - Restricted access to configuration files
- **No Debug Information** - Production-safe error handling
- **Security Headers** - X-Content-Type-Options, X-XSS-Protection, and more

## ⚙️ **Environment Configuration**

### **🔧 Required Environment Variables**

The application uses a `.env` file for all configuration. Here's a complete reference:

```env
# Database Configuration (Required)
DB_HOST=localhost                    # Database server hostname
DB_NAME=kanban_board2               # Database name
DB_USER=your_username               # Database username
DB_PASS=your_password               # Database password

# Email Configuration (Required for notifications)
BREVO_API_KEY=your-brevo-api-key    # Brevo email service API key
SENDER_EMAIL=noreply@yourdomain.com # Default sender email address
SENDER_NAME=Your Task Management    # Default sender name
ADMIN_EMAIL=admin@yourdomain.com    # Admin email for notifications

# Security Configuration (Required)
CORS_ORIGIN=https://yourdomain.com  # Allowed origin for CORS requests

# Optional Configuration
GOOGLE_API_KEY=your-google-key      # For Google services integration
```

### **🚀 Deployment Environments**

#### **Development**
```env
CORS_ORIGIN=http://localhost:3000
SENDER_EMAIL=dev@localhost
ADMIN_EMAIL=admin@localhost
```

#### **Staging**
```env
CORS_ORIGIN=https://staging.yourdomain.com
SENDER_EMAIL=noreply@staging.yourdomain.com
ADMIN_EMAIL=admin@staging.yourdomain.com
```

#### **Production**
```env
CORS_ORIGIN=https://yourdomain.com
SENDER_EMAIL=noreply@yourdomain.com
ADMIN_EMAIL=admin@yourdomain.com
```

### **🔒 Security Considerations**

- **File Permissions**: `.env` file should have 600 permissions (readable only by owner)
- **Version Control**: Never commit `.env` files to version control
- **Environment Isolation**: Use different `.env` files for each environment
- **Secret Management**: Store sensitive keys securely and rotate regularly

## 📈 **Performance Optimizations**

- **Efficient Database Queries** - Optimized SQL with proper indexing
- **Minimal API Calls** - Reduced network requests
- **Caching Strategies** - Local storage for user preferences
- **Lazy Loading** - Progressive content loading
- **Compressed Assets** - Optimized CSS and JavaScript delivery

---
###  Images

<img width="2037" height="962" alt="image" src="https://github.com/user-attachments/assets/a45e073c-66bb-4c01-9259-748190c2f75c" />

<img width="1386" height="1063" alt="image" src="https://github.com/user-attachments/assets/228d8fc3-7981-424e-a7c0-571ad7fa7a5d" />

<img width="1291" height="1032" alt="image" src="https://github.com/user-attachments/assets/08003b44-0a40-4fc0-85bb-08055ba75cda" />

<img width="2034" height="1071" alt="image" src="https://github.com/user-attachments/assets/6c62e013-f76d-4b7c-946c-f381fcf28e17" />

<img width="1305" height="972" alt="image" src="https://github.com/user-attachments/assets/cf1cf641-0c8c-4041-a5bd-27e59721d8eb" />

<img width="1172" height="1032" alt="image" src="https://github.com/user-attachments/assets/825fe4ae-500c-4c2d-a340-2fe574f1c931" />

<img width="1001" height="1144" alt="image" src="https://github.com/user-attachments/assets/a93cc43a-60a8-49a9-a3a4-d4d46466cc8d" />

<img width="724" height="866" alt="image" src="https://github.com/user-attachments/assets/d81dfb28-503e-46f8-b265-2a9b177239f7" />

<img width="1775" height="1128" alt="image" src="https://github.com/user-attachments/assets/0e87c1a5-ffe8-4ab1-9c94-0788782d29bf" />

<img width="1786" height="945" alt="image" src="https://github.com/user-attachments/assets/5dedd076-389b-477e-92d5-71708f351577" />

<img width="2016" height="1128" alt="image" src="https://github.com/user-attachments/assets/f5748208-664c-47ef-839c-be5ecd5e6e7b" />










