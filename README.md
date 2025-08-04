<img width="479" height="427" alt="thecahce_kanban_logo" src="https://github.com/user-attachments/assets/669ccc95-ceb4-43c7-b322-ebc6563f7ed2" />



# Kanban Board Application

A modern, feature-rich kanban board built with vanilla JavaScript and PHP. This application provides all the essential features for project management and task tracking.

## Features

- **Company Management** - Edit company name
- **Notes** - Add detailed notes to tasks
- **Attachments** - Upload and manage file attachments
- **Users** - Add, edit, and delete team members
- **Clients** - Manage client information
- **Color Themes** - Change board appearance with custom themes
- **Dynamic Stages** - Add, edit, delete, and customize stage colors
- **Task Checklists** - Create detailed checklists within tasks
- **Edit Functionality** - Full CRUD operations for all entities
- **User Assignment** - Assign tasks to specific users
- **Drag & Drop** - Intuitive task movement between stages
- **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Backend:** PHP 7.4+
- **Database:** MySQL 5.7+
- **Icons:** Font Awesome 6
- **Styling:** Modern CSS with CSS Variables

## Installation

### Prerequisites

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Web server (Apache/Nginx) or PHP built-in server

### Setup Steps

1. **Clone or download the project files**

2. **Database Configuration**
   - Open `api/config.php`
   - Update database credentials:
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'kanban_board');
   define('DB_USER', 'your_username');
   define('DB_PASS', 'your_password');
   ```

3. **Create Database**
   - The application will automatically create the database and tables on first run
   - Alternatively, run this SQL command:
   ```sql
   CREATE DATABASE kanban_board;
   ```

4. **Set Permissions**
   ```bash
   chmod 755 uploads/
   ```

5. **Email setup**
Sign up for free account at brevo and obtain your API Key
### **Brevo API Key**
- **Status**: ✅ Configured (Environment Variable)
- **Key**: Stored securely in `.env` file
- **Sender**: `YOUR_EMAIL`
-**File**: create file .env and paste inside it BREVO_API_KEY=YOUR_API_KEY

## Usage

### Getting Started

1. **Edit Company Name**: Click "Edit Company" to customize your board's title
2. **Add Stages**: Use "Add Stage" to create workflow columns (To Do, In Progress, etc.)
3. **Create Tasks**: Click "Add Task" to create new work items
4. **Manage Team**: Use "Users" to add team members
5. **Add Clients**: Use "Clients" to manage customer information

### Task Management

- **Create Tasks**: Fill in title, description, notes, and assign to users/clients
- **Add Checklists**: Break down tasks into smaller actionable items
- **Attach Files**: Upload documents, images, or other files to tasks
- **Drag & Drop**: Move tasks between stages by dragging
- **Edit Tasks**: Click on any task to modify its details

## API Endpoints

The application provides a RESTful API:

### Companies
- `GET /api/company` - Get company information
- `PUT /api/company` - Update company name

### Stages
- `GET /api/stages` - List all stages
- `POST /api/stages` - Create new stage
- `PUT /api/stages/{id}` - Update stage
- `DELETE /api/stages/{id}` - Delete stage

### Tasks
- `GET /api/tasks` - List all tasks
- `GET /api/tasks/{id}` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/{id}` - Update task
- `DELETE /api/tasks/{id}` - Delete task

### Users
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `DELETE /api/users/{id}` - Delete user

### Clients
- `GET /api/clients` - List all clients
- `POST /api/clients` - Create new client
- `DELETE /api/clients/{id}` - Delete client

### Attachments
- `POST /api/attachments` - Upload file
- `DELETE /api/attachments/{id}` - Delete attachment

### Board Data
- `GET /api/board` - Get all board data in one request

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Security Features

- SQL injection protection with prepared statements
- File upload validation
- XSS protection with proper escaping
- CORS headers for API access

<img width="2037" height="962" alt="image" src="https://github.com/user-attachments/assets/a45e073c-66bb-4c01-9259-748190c2f75c" />

<img width="1386" height="1063" alt="image" src="https://github.com/user-attachments/assets/228d8fc3-7981-424e-a7c0-571ad7fa7a5d" />

<img width="1291" height="1032" alt="image" src="https://github.com/user-attachments/assets/08003b44-0a40-4fc0-85bb-08055ba75cda" />

<img width="2034" height="1071" alt="image" src="https://github.com/user-attachments/assets/6c62e013-f76d-4b7c-946c-f381fcf28e17" />

<img width="1305" height="972" alt="image" src="https://github.com/user-attachments/assets/cf1cf641-0c8c-4041-a5bd-27e59721d8eb" />

<img width="1172" height="1032" alt="image" src="https://github.com/user-attachments/assets/825fe4ae-500c-4c2d-a340-2fe574f1c931" />





