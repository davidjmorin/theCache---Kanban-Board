<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Cache - Kanban Board</title>
    <link rel="icon" type="image/png" href="assets/thecache_logo.png">
    <link rel="shortcut icon" type="image/png" href="assets/thecache_logo.png">
    <link rel="apple-touch-icon" href="assets/thecache_logo.png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <link rel="stylesheet" href="assets/css/styles.css?v5.3">
</head>
<body>
    <div class="login-container" id="loginContainer" style="display: none;">
        <div class="login-logo">
            <img src="assets/thecache_logo.png" alt="The Cache Logo" class="logo-image">
        </div>
        <form class="login-form" id="loginForm">
            <h2>Login to The Cache</h2>
            <div class="form-group">
                <label for="loginEmail">Email</label>
                <input type="email" id="loginEmail" name="email" required>
            </div>
            <div class="form-group">
                <label for="loginPassword">Password</label>
                <input type="password" id="loginPassword" name="password" required>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" style="width: 100%;">Login</button>
            </div>
            <div style="margin-top: 1rem; text-align: center; font-size: 0.875rem; color: var(--text-secondary);">
                <p>Don't have an account? <a href="#" id="showRegisterForm">Sign up here</a></p>
            </div>
        </form>
        
        <form class="login-form" id="registerForm" style="display: none;">
            <h2>Register for The Cache</h2>
            <div class="form-group">
                <label for="registerName">Full Name</label>
                <input type="text" id="registerName" name="name" required>
            </div>
            <div class="form-group">
                <label for="registerEmail">Email</label>
                <input type="email" id="registerEmail" name="email" required>
            </div>
            <div class="form-group">
                <label for="registerPassword">Password</label>
                <input type="password" id="registerPassword" name="password" required minlength="6">
                <small style="color: var(--text-secondary); font-size: 0.75rem; margin-top: 0.25rem; display: block;">
                    Password must be at least 6 characters with at least one letter and one number.
                </small>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" style="width: 100%;">Register</button>
            </div>
            <div style="margin-top: 1rem; text-align: center; font-size: 0.875rem; color: var(--text-secondary);">
                <p>Already have an account? <a href="#" id="showLoginForm">Login here</a></p>
            </div>
        </form>
    </div>

    <div class="app-container" id="appContainer" style="display: none;">
        <?php include 'assets/header.php'; ?>
        
        <div class="mobile-menu-overlay" id="mobileMenuOverlay">
            <div class="mobile-menu-sidebar" id="mobileMenuSidebar">
                <div class="mobile-menu-header">
                    <h3>Menu</h3>
                    <button class="mobile-menu-close" id="mobileMenuClose">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mobile-menu-content">
                    <div class="mobile-menu-section">
                        <h4>Board</h4>
                        <div class="mobile-board-selector">
                            <select id="mobileBoardSelector" class="board-select">
                                <option value="">Select Board</option>
                            </select>
                        </div>
                        <button class="mobile-menu-item" id="mobileManageBoardsBtn">
                            <i class="fas fa-cog"></i>
                            <span>Manage Boards</span>
                        </button>
                    </div>
                    
                    <div class="mobile-menu-section">
                        <h4>Actions</h4>
                        <button class="mobile-menu-item" id="mobileAddTaskBtn">
                            <i class="fas fa-plus"></i>
                            <span>Add Task</span>
                        </button>
                        <button class="mobile-menu-item" onclick="window.location.href='/crm'">
                            <i class="fas fa-users"></i>
                            <span>CRM</span>
                        </button>
                        <button class="mobile-menu-item" onclick="window.location.href='/calendar'">
                            <i class="fas fa-calendar"></i>
                            <span>Calendar View</span>
                        </button>
                    </div>
                    
                    <div class="mobile-menu-section">
                        <h4>Search</h4>
                        <div class="mobile-search-container">
                            <div class="search-box">
                                <i class="fas fa-search"></i>
                                <input type="text" id="mobileSearchInput" placeholder="Search tasks, clients, projects...">
                                <button class="search-clear" id="mobileSearchClear" style="display: none;">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="mobile-menu-section">
                        <h4>Management</h4>
                        <button class="mobile-menu-item" id="mobileAddStageBtn">
                            <i class="fas fa-plus"></i>
                            <span>Add Stage</span>
                        </button>
                        <button class="mobile-menu-item" id="mobileManageUsersBtn">
                            <i class="fas fa-users"></i>
                            <span>Users</span>
                        </button>
                        <button class="mobile-menu-item" id="mobileManageClientsBtn">
                            <i class="fas fa-building"></i>
                            <span>Clients</span>
                        </button>
                        <button class="mobile-menu-item" id="mobileSendDueNotificationsBtn">
                            <i class="fas fa-envelope"></i>
                            <span>Send Due Notifications</span>
                        </button>
                    </div>
                    
                    <div class="mobile-menu-section">
                        <h4>User</h4>
                        <div class="mobile-user-info">
                            <i class="fas fa-user"></i>
                            <span id="mobileUserName">User</span>
                        </div>
                        <button class="mobile-menu-item" id="mobileNotificationsBtn">
                            <i class="fas fa-bell"></i>
                            <span>Notifications</span>
                            <span class="notification-badge" id="mobileNotificationCount">0</span>
                        </button>
                        <button class="mobile-menu-item" id="mobileLogoutBtn">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <main class="kanban-board" id="kanbanBoard">
        </main>
    </div>

    <div class="modal" id="companyModal"> 
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Company</h2>
                <span class="close" data-modal="companyModal">&times;</span>
            </div>
            <form id="companyForm">
                <div class="form-group">
                    <label for="companyName">Company Name</label>
                    <input type="text" id="companyName" name="companyName" required>
                </div>
                <div class="form-group">
                    <label for="companyContactName">Contact Name</label>
                    <input type="text" id="companyContactName" name="companyContactName">
                </div>
                <div class="form-group">
                    <label for="companyContactNumber">Contact Number</label>
                    <input type="tel" id="companyContactNumber" name="companyContactNumber">
                </div>
                <div class="form-group">
                    <label for="companyEmail">Email (Optional)</label>
                    <input type="email" id="companyEmail" name="companyEmail">
                </div>
                <div class="form-group">
                    <label for="companyUrl">Website URL</label>
                    <input type="url" id="companyUrl" name="companyUrl" placeholder="https://example.com">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" class="btn btn-secondary" data-modal="companyModal">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <div class="modal" id="stageModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="stageModalTitle">Add Stage</h2>
                <span class="close" data-modal="stageModal">&times;</span>
            </div>
            <form id="stageForm">
                <input type="hidden" id="stageId">
                <div class="form-group">
                    <label for="stageName">Stage Name</label>
                    <input type="text" id="stageName" name="stageName" required>
                </div>
                <div class="form-group">
                    <label for="stageColor">Stage Color</label>
                    <input type="color" id="stageColor" name="stageColor" value="#3498db">
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Save</button>
                    <button type="button" class="btn btn-secondary" data-modal="stageModal">Cancel</button>
                </div>
            </form>
        </div>
    </div>

    <div class="modal" id="notificationsModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Notifications</h2>
                <span class="close" data-modal="notificationsModal">&times;</span>
            </div>
            <div class="modal-body">
                <div id="notificationsList">
                </div>
            </div>
        </div>
    </div>

    <div class="modal" id="quickAddModal">
        <div class="modal-content small">
            <div class="modal-header">
                <h2>Quick Add Task</h2>
                <span class="close" data-modal="quickAddModal">&times;</span>
            </div>
            <div class="modal-body">
                <form id="quickAddForm">
                    <div class="form-group">
                        <label for="quickTaskTitle">Task Title</label>
                        <input type="text" id="quickTaskTitle" name="quickTaskTitle" required placeholder="Enter task title">
                    </div>
                    <div class="form-group">
                        <label for="quickTaskDescription">Description (Optional)</label>
                        <textarea id="quickTaskDescription" name="quickTaskDescription" rows="3" placeholder="Enter task description"></textarea>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="quickTaskDueDate">Due Date</label>
                            <input type="date" id="quickTaskDueDate" name="quickTaskDueDate">
                        </div>
                        <div class="form-group">
                            <label for="quickTaskDueTime">Due Time</label>
                            <input type="time" id="quickTaskDueTime" name="quickTaskDueTime">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Add Task</button>
                        <button type="button" class="btn btn-secondary" data-modal="quickAddModal">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal" id="taskModal">
        <div class="modal-content large">
            <div class="modal-header">
                <h2 id="taskModalTitle">Add Task</h2>
                <span class="close" data-modal="taskModal">&times;</span>
            </div>
            <div class="modal-body">
                <form id="taskForm">
                <input type="hidden" id="taskId" name="taskId">
                <div class="form-row">
                    <div class="form-group">
                        <label for="taskTitle">Task Title <font color="red"> *</font></label>
                        <input type="text" id="taskTitle" name="taskTitle" required>
                    </div>
                    <div class="form-group">
                        <label for="taskAssignee">Assign to User <font color="red"> *</font></label>
                        <select id="taskAssignee" name="taskAssignee">
                            <option value="">Unassigned</option>
                        </select>
                    </div>
    
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="taskBoard">Board</label>
                        <select id="taskBoard" name="taskBoard" required>
                            <option value="">Select Board</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="taskStage">Stage</label>
                        <select id="taskStage" name="taskStage" required>
                            <option value="">Select Stage</option>
                        </select>
                    </div>
                
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="taskClient">Client</label>
                        <select id="taskClient" name="taskClient">
                            <option value="">No Client</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="taskPriority">Priority</label>
                        <select id="taskPriority" name="taskPriority">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                        </select>
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label for="taskStartDate">Start Date</label>
                        <input type="date" id="taskStartDate" name="taskStartDate">
                    </div>
                    <div class="form-group">
                        <label for="taskDueDate">Due Date <font color="red"> *</font></label>
                        <input type="date" id="taskDueDate" name="taskDueDate">
                    </div>
                    <div class="form-group">
                        <label for="taskDueTime">Due Time <font color="red"> *</font></label>
                        <input type="time" id="taskDueTime" name="taskDueTime">
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group color-picker-container" data-color="#1a202c">
                        <label for="taskCardColor">Card Color</label>
                        <input type="color" id="taskCardColor" name="taskCardColor" value="#1a202c">
                    </div>
                </div>
                <div class="form-group">
                    <label for="taskDescription">Description</label>
                    <div id="taskDescriptionDisplay" class="task-description-display">
                        <div class="description-content markdown-content"></div>
                        <button type="button" id="editDescriptionBtn" class="btn btn-small">
                            <i class="fas fa-edit"></i> Edit Description
                        </button>
                    </div>
                    <textarea id="taskDescription" name="taskDescription" rows="3" style="display: none;"></textarea>
                </div>
                <div class="form-group">
                    <label>Quick Notes</label>
                    <div id="notesContainer" class="notes-container">
                        <div class="notes-list" id="notesList"></div>
                        <div class="add-note-section">
                            <button type="button" id="addNoteBtn" class="btn btn-primary">
                                <i class="fas fa-plus"></i> Add Quick Note
                            </button>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Linked Detailed Notes</label>
                    <div id="linkedNotesContainer" class="notes-container">
                        <div class="notes-list" id="linkedNotesList"></div>
                        <div class="add-note-section">
                            <button type="button" id="addDetailedNoteBtn" class="btn btn-secondary">
                                <i class="fas fa-sticky-note"></i> Create Detailed Note
                            </button>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="taskAttachments">Attachments</label>
                    <input type="file" id="taskAttachments" name="taskAttachments[]" multiple>
                    <div id="attachmentsList" class="attachments-list"></div>
                </div>
                <div class="form-group">
                    <label>Checklist</label>
                    <div id="checklistContainer">
                        <div class="checklist-item">
                            <input type="text" placeholder="Checklist item" class="checklist-input">
                            <button type="button" class="btn-icon remove-checklist"><i class="fas fa-times"></i></button>
                        </div>
                    </div>
                    <button type="button" id="addChecklistItem" class="btn btn-small">
                        <i class="fas fa-plus"></i> Add Item
                    </button>
                </div>
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary">Save Task</button>
                    <button type="button" class="btn btn-secondary" data-modal="taskModal">Cancel</button>
                </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal" id="usersModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>User Management</h2>
                <span class="close" data-modal="usersModal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="user-tabs">
                    <button class="user-tab active" data-tab="users">Users</button>
                    <button class="user-tab" data-tab="add-user">Add User</button>
                </div>
                
                <div id="usersTab" class="user-tab-content active">
                    <div id="usersList" class="users-list">
                    </div>
                </div>
                
                <div id="addUserTab" class="user-tab-content">
                    <form id="userForm" class="add-user-form">
                        <input type="hidden" id="userId" name="userId">
                        <div class="form-group">
                            <label for="newUserName">Username</label>
                            <input type="text" id="newUserName" name="userName" required>
                        </div>
                        <div class="form-group">
                            <label for="newUserEmail">Email</label>
                            <input type="email" id="newUserEmail" name="userEmail" required>
                        </div>
                        <div class="form-group">
                            <label for="newUserFullName">Full Name</label>
                            <input type="text" id="newUserFullName" name="userFullName" required>
                        </div>
                        <div class="form-group">
                            <label for="newUserPassword">Password</label>
                            <input type="password" id="newUserPassword" name="userPassword" required>
                        </div>
                        <div class="form-group">
                            <label class="checkbox-label">
                                <input type="checkbox" id="newUserIsAdmin" name="userIsAdmin">
                                <span class="checkmark"></span>
                                Admin User
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="submit" class="btn btn-primary">Add User</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    
    <div class="modal" id="passwordModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Change Password</h2>
                <span class="close" data-modal="passwordModal">&times;</span>
            </div>
            <div class="modal-body">
                <form id="passwordForm">
                    <input type="hidden" id="passwordUserId" name="passwordUserId">
                    <div class="form-group">
                        <label for="newPassword">New Password</label>
                        <input type="password" id="newPassword" name="newPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">Confirm Password</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" required>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Change Password</button>
                        <button type="button" class="btn btn-secondary" data-modal="passwordModal">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal" id="clientsModal">
        <div class="modal-content large">
            <div class="modal-header">
                <h2>Manage Clients</h2>
                <span class="close" data-modal="clientsModal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="clients-section">
                    <div class="clients-header">
                        <h3>Client Directory</h3>
                        <div class="clients-header-actions">
                            <button type="button" id="addClientBtn" class="btn btn-primary">
                                <i class="fas fa-plus"></i> Add Client
                            </button>
                            <div class="client-search-container">
                                <div class="search-box">
                                    <i class="fas fa-search"></i>
                                    <input type="text" id="clientSearchInput" placeholder="Search clients...">
                                    <button type="button" id="clientSearchClear" class="search-clear">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div id="clientsList" class="clients-list"></div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal" id="addClientModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="addClientModalTitle">Add New Client</h2>
                <span class="close" data-modal="addClientModal">&times;</span>
            </div>
            <div class="modal-body">
                <form id="clientForm" class="add-client-form">
                    <input type="hidden" id="clientId" name="clientId">
                    <div class="form-group">
                        <label for="newClientName">Client Name</label>
                        <input type="text" id="newClientName" name="clientName" required>
                    </div>
                    <div class="form-group">
                        <label for="newClientContactName">Contact Name</label>
                        <input type="text" id="newClientContactName" name="clientContactName" required>
                    </div>
                    <div class="form-group">
                        <label for="newClientContactNumber">Contact Number</label>
                        <input type="tel" id="newClientContactNumber" name="clientContactNumber" required>
                    </div>
                    <div class="form-group">
                        <label for="newClientEmail">Email (Optional)</label>
                        <input type="email" id="newClientEmail" name="clientEmail">
                    </div>
                    <div class="form-group">
                        <label for="newClientUrl">Website URL</label>
                        <input type="url" id="newClientUrl" name="clientUrl" placeholder="https://example.com">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Add Client</button>
                        <button type="button" class="btn btn-secondary" data-modal="addClientModal">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <div class="modal client-tasks-modal" id="clientTasksModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="clientTasksTitle">Client Tasks</h2>
                <span class="close" data-modal="clientTasksModal">&times;</span>
            </div>
            <div class="modal-body">
                <div id="clientTasksGrid" class="client-tasks-grid">
                </div>
            </div>
        </div>
    </div>

    <div class="modal" id="searchModal">
        <div class="modal-content large">
            <div class="modal-header">
                <h2>Search Results</h2>
                <span class="close" data-modal="searchModal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="search-results-container">
                    <div class="search-tabs">
                        <button class="search-tab active" data-tab="tasks">Tasks</button>
                        <button class="search-tab" data-tab="clients">Clients</button>
                        <button class="search-tab" data-tab="projects">Projects</button>
                    </div>
                    <div class="search-results" id="searchResults">
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal" id="shareModal">
        <div class="modal-content">
            <div class="modal-header">
                <h2 id="shareModalTitle">Share</h2>
                <span class="close" data-modal="shareModal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="share-container">
                    <div class="share-tabs">
                        <button class="share-tab active" data-tab="share">Share</button>
                        <button class="share-tab" data-tab="shared-with">Shared With</button>
                    </div>
                    
                    <div id="shareTab" class="share-tab-content active">
                        <div class="form-group">
                            <label>Select Users to Share With</label>
                            <div id="shareUserList" class="user-checkbox-list">
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" id="shareBtn" class="btn btn-primary">Share</button>
                            <button type="button" class="btn btn-secondary" data-modal="shareModal">Cancel</button>
                        </div>
                    </div>
                    
                    <div id="sharedWithTab" class="share-tab-content">
                        <div id="sharedWithList" class="shared-with-list">
                        </div>
                        <div class="form-actions">
                            <button type="button" id="unshareBtn" class="btn btn-danger">Remove Access</button>
                            <button type="button" class="btn btn-secondary" data-modal="shareModal">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="modal" id="boardsModal">
        <div class="modal-content large">
            <div class="modal-header">
                <h2>Manage Boards</h2>
                <span class="close" data-modal="boardsModal">&times;</span>
            </div>
            <div class="modal-body">
                <div class="boards-container">
                    <div class="boards-tabs">
                        <button class="boards-tab active" data-tab="boards">Boards</button>
                        <button class="boards-tab" data-tab="add-board">Add Board</button>
                    </div>
                    
                    <div id="boardsTab" class="boards-tab-content active">
                        <div class="boards-list" id="boardsList">
                        </div>
                    </div>
                    
                    <div id="addBoardTab" class="boards-tab-content">
                        <form id="boardForm" class="add-board-form">
                            <input type="hidden" id="boardId" name="boardId">
                            <div class="form-group">
                                <label for="boardName">Board Name</label>
                                <input type="text" id="boardName" name="boardName" placeholder="e.g., Inside Sales, TBR, Outside Sales" required>
                            </div>
                            <div class="form-group">
                                <label for="boardDescription">Description (Optional)</label>
                                <textarea id="boardDescription" name="boardDescription" rows="3" placeholder="Describe what this board is for..."></textarea>
                            </div>
                            <div class="form-group">
                                <label for="boardColor">Board Color</label>
                                <input type="color" id="boardColor" name="boardColor" value="#3498db">
                            </div>
                            <div class="form-group">
                                <label for="boardIcon">Board Icon</label>
                                <select id="boardIcon" name="boardIcon">
                                    <option value="fas fa-chart-line">📈 Sales</option>
                                    <option value="fas fa-users">👥 Team</option>
                                    <option value="fas fa-briefcase">💼 Business</option>
                                    <option value="fas fa-tasks">📋 Tasks</option>
                                    <option value="fas fa-project-diagram">📊 Projects</option>
                                    <option value="fas fa-cog">⚙️ Operations</option>
                                    <option value="fas fa-lightbulb">💡 Ideas</option>
                                    <option value="fas fa-rocket">🚀 Growth</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="boardIsActive" name="boardIsActive" checked>
                                    <span class="checkmark"></span>
                                    Active Board
                                </label>
                            </div>
                            <div class="form-actions">
                                <button type="submit" class="btn btn-primary">Save Board</button>
                                <button type="button" class="btn btn-secondary" data-modal="boardsModal">Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>



    <div class="loading-screen" id="loadingScreen">
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading...</p>
        </div>
    </div>

    <div class="real-time-indicator" id="realTimeIndicator">
        <i class="fas fa-wifi"></i> Connected
    </div>

    <!-- Note Editor Modal -->
    <div class="modal" id="noteEditorModal">
        <div class="modal-content small">
            <div class="modal-header">
                <h2>Add Note</h2>
                <span class="close" data-modal="noteEditorModal">&times;</span>
            </div>
            <div class="modal-body">
                <form id="noteEditorForm">
                    <input type="hidden" id="noteTaskId" name="noteTaskId">
                    <div class="form-group">
                        <label>Note Type</label>
                        <div class="note-type-selector">
                            <label class="note-type-label">
                                <input type="radio" name="noteType" value="call" checked>
                                <span class="note-type-btn note-type-call">
                                    <i class="fas fa-phone"></i> Call
                                </span>
                            </label>
                            <label class="note-type-label">
                                <input type="radio" name="noteType" value="email">
                                <span class="note-type-btn note-type-email">
                                    <i class="fas fa-envelope"></i> Email
                                </span>
                            </label>
                            <label class="note-type-label">
                                <input type="radio" name="noteType" value="inperson">
                                <span class="note-type-btn note-type-inperson">
                                    <i class="fas fa-user"></i> In-Person
                                </span>
                            </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="noteEditorText">Note Content</label>
                        <textarea id="noteEditorText" name="noteText" rows="8" placeholder="Write your note here... Use markdown for formatting!"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Add Note</button>
                        <button type="button" class="btn btn-secondary" data-modal="noteEditorModal">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Description Editor Modal -->
    <div class="modal" id="descriptionEditorModal">
        <div class="modal-content large">
            <div class="modal-header">
                <h2>Edit Description</h2>
                <span class="close" data-modal="descriptionEditorModal">&times;</span>
            </div>
            <div class="modal-body">
                <form id="descriptionEditorForm">
                    <input type="hidden" id="descriptionTaskId" name="descriptionTaskId">
                    <div class="form-group">
                        <label for="descriptionEditorText">Description</label>
                        <textarea id="descriptionEditorText" name="descriptionText" rows="15" placeholder="Describe your task... Use markdown for formatting!"></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Save Description</button>
                        <button type="button" class="btn btn-secondary" data-modal="descriptionEditorModal">Cancel</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

            <script src="https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/markdown-it@13.0.1/dist/markdown-it.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/markdown-it-emoji@2.0.0/dist/browser.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/markdown-it-task-lists@2.1.1/dist/markdown-it-task-lists.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-core.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-markup.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-css.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-clike.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-javascript.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-php.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-python.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-java.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-sql.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-bash.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-json.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-yaml.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-markdown.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-diff.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/components/prism-git.min.js"></script>

            <script src="assets/js/logo-helper.js?v=1.1"></script>
            <script src="assets/js/app.js?v3.38"></script>
            <style>
 #companyName{
        display: none;
    }
                </style>
</body>
</html>