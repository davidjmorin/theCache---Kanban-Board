<?php
// Get the current page name to determine what to show/hide
$current_page = basename($_SERVER['PHP_SELF'], '.php');
$is_kanban_page = ($current_page === 'kanban');

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Check if user is logged in
$is_logged_in = isset($_SESSION['user_id']);

// If not logged in and not on index page, redirect to index.php
if (!$is_logged_in && $current_page !== 'index') {
    header('Location: /index.php');
    exit();
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Cache - <?php echo ucfirst($current_page); ?></title>
    <link rel="icon" type="image/png" href="assets/thecache_logo.png">
    <link rel="shortcut icon" type="image/png" href="assets/thecache_logo.png">
    <link rel="apple-touch-icon" href="assets/thecache_logo.png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/styles.css?v5.1">
    <?php if ($is_kanban_page): ?>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/simplemde/latest/simplemde.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/prismjs@1.29.0/themes/prism-tomorrow.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.8/dist/katex.min.css">
    <link rel="stylesheet" href="assets/css/dashboard.css?V2.1">
    <?php endif; ?>
</head>
<body>
    <?php if (!$is_logged_in): ?>
    <!-- Login Container -->
    <div class="login-container" id="loginContainer">
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
    <?php endif; ?>

    <!-- App Container -->
    <div class="app-container" id="appContainer" <?php echo $is_logged_in ? '' : 'style="display: none;"'; ?>>
        <header class="header">
            <div class="header-main">
                <div class="header-brand">
                    <a href="/"><img src="assets/thecache_logo.png" alt="The Cache Logo" class="header-logo"></a>
                    <h1 class="company-name" id="companyName"><?php echo ucfirst($current_page); ?></h1>
                </div>
                
                <?php if ($is_kanban_page): ?>
                <!-- Board Selector - Only show on kanban page -->
                <div class="header-board desktop-only">
                    <select id="boardSelector" class="board-select">
                        <option value="">Select Board</option>
                    </select>
                </div>
                <div class="header-board-settings desktop-only">
                    <button class="btn btn-icon" id="manageBoardsBtn" title="Manage Boards">
                        <i class="fas fa-cog"></i>
                    </button>
                </div>
                
                <!-- Search Box - Only show on kanban page -->
                <div class="header-search desktop-only">
                    <div class="search-box">
                        <i class="fas fa-search"></i>
                        <input type="text" id="searchInput" placeholder="Search tasks, clients, projects...">
                        <button class="search-clear" id="searchClear" style="display: none;">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Quick Add and Add Task Buttons - Only show on kanban page -->
                <div class="header-actions desktop-only">
                    <button class="btn btn-primary" id="addTaskBtn">
                        <i class="fas fa-plus"></i> Add Task
                    </button>
                    <button class="btn btn-secondary" id="quickAddBtn">
                        <i class="fas fa-bolt"></i> Quick Add
                    </button>
                </div>
                <?php endif; ?>
                
                <!-- Navigation Menu - Always show -->
                <div class="header-nav desktop-only" id="headerNav">
                    <button class="btn btn-secondary" data-module="kanban" onclick="window.location.href='/kanban.php'">
                        <i class="fas fa-columns"></i> Tasks
                    </button>
                    <button class="btn btn-secondary" data-module="crm" onclick="window.location.href='/crm.php'">
                        <i class="fas fa-users"></i> CRM
                    </button>
                    <button class="btn btn-secondary" data-module="notes" onclick="window.location.href='/notes.php'">
                        <i class="fas fa-sticky-note"></i> Notes
                    </button>
                    <button class="btn btn-secondary" data-module="calendar" onclick="window.location.href='/calendar.php'">
                        <i class="fas fa-calendar"></i> Calendar
                    </button>
                    
                    <?php if ($is_kanban_page): ?>
                    <!-- Management Dropdown - Only show on kanban page -->
                    <div class="dropdown">
                        <button class="btn btn-secondary dropdown-toggle" id="managementDropdown">
                            Manage <i class="fas fa-cog"></i>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="dropdown-menu" id="managementMenu">
                            <button class="dropdown-item" id="addStageBtn">
                                <i class="fas fa-plus"></i> Add Stage
                            </button>
                            <div class="dropdown-divider"></div>
                            <button class="dropdown-item" id="manageUsersBtn">
                                <i class="fas fa-users"></i> Users
                            </button>
                            <button class="dropdown-item" id="manageClientsBtn">
                                <i class="fas fa-building"></i> Clients
                            </button>
                            <div class="dropdown-divider"></div>
                        </div>
                    </div>
                    <?php endif; ?>
                </div>
                
                <!-- Notifications - Always show when logged in -->
                <div class="header-notifications desktop-only">
                    <button class="btn btn-icon" id="notificationsBtn" title="Notifications">
                        <i class="fas fa-bell"></i>
                        <span class="notification-badge" id="notificationCount">0</span>
                    </button>
                </div>
                
                <!-- User Menu - Always show when logged in -->
                <div class="header-user desktop-only">
                    <div class="dropdown">
                        <button class="btn btn-secondary dropdown-toggle" id="userDropdown">
                            <span id="currentUserName"><?php echo htmlspecialchars($_SESSION['user_name'] ?? 'User'); ?></span> <i class="fas fa-user"></i>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="dropdown-menu" id="userMenu">
                            <div class="dropdown-header">
                                <div class="user-info">
                                    <div class="user-avatar">
                                        <i class="fas fa-user-circle"></i>
                                    </div>
                                    <div class="user-details">
                                        <div class="user-name" id="userMenuName"><?php echo htmlspecialchars($_SESSION['user_name'] ?? 'User'); ?></div>
                                        <div class="user-email" id="userMenuEmail"><?php echo htmlspecialchars($_SESSION['user_email'] ?? 'user@example.com'); ?></div>
                                    </div>
                                </div>
                            </div>
                            <div class="dropdown-divider"></div>
                            <a href="/preferences.php" class="dropdown-item">
                                <i class="fas fa-cog"></i> Preferences
                            </a>
                            <a href="#" class="dropdown-item" id="logoutBtn">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            
            <?php if ($is_kanban_page): ?>
            <!-- Mobile Menu Button - Only show on kanban page -->
            <div class="mobile-menu-btn">
                <button class="btn btn-secondary" id="mobileMenuBtn">
                    <i class="fas fa-bars"></i>
                </button>
            </div>
            <?php endif; ?>
        </header>

        <?php if ($is_kanban_page): ?>
        <!-- Mobile Menu Overlay - Only show on kanban page -->
        <div class="mobile-menu-overlay" id="mobileMenuOverlay">
            <div class="mobile-menu-sidebar">
                <div class="mobile-menu-header">
                    <h3>Menu</h3>
                    <button class="mobile-menu-close" id="mobileMenuClose">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="mobile-menu-content">
                    <div class="mobile-menu-section">
                        <h4>Quick Actions</h4>
                        <button class="mobile-menu-item" id="mobileAddTaskBtn">
                            <i class="fas fa-plus"></i> Add Task
                        </button>
                        <button class="mobile-menu-item" id="mobileQuickAddBtn">
                            <i class="fas fa-bolt"></i> Quick Add
                        </button>
                    </div>
                    <div class="mobile-menu-section">
                        <h4>Navigation</h4>
                        <a href="/kanban.php" class="mobile-menu-item">
                            <i class="fas fa-columns"></i> Tasks
                        </a>
                        <a href="/crm.php" class="mobile-menu-item">
                            <i class="fas fa-users"></i> CRM
                        </a>
                        <a href="/notes.php" class="mobile-menu-item">
                            <i class="fas fa-sticky-note"></i> Notes
                        </a>
                        <a href="/calendar.php" class="mobile-menu-item">
                            <i class="fas fa-calendar"></i> Calendar
                        </a>
                    </div>
                    <div class="mobile-menu-section">
                        <h4>Search</h4>
                        <div class="mobile-search-container">
                            <div class="search-box">
                                <i class="fas fa-search"></i>
                                <input type="text" id="mobileSearchInput" placeholder="Search tasks, clients, projects...">
                            </div>
                        </div>
                    </div>
                    <div class="mobile-menu-section">
                        <h4>User</h4>
                        <div class="mobile-user-info">
                            <span id="mobileUserName"><?php echo htmlspecialchars($_SESSION['user_name'] ?? 'User'); ?></span>
                        </div>
                        <a href="/preferences.php" class="mobile-menu-item">
                            <i class="fas fa-cog"></i> Preferences
                        </a>
                        <a href="#" class="mobile-menu-item" id="mobileLogoutBtn">
                            <i class="fas fa-sign-out-alt"></i> Logout
                        </a>
                    </div>
                </div>
            </div>
        </div>
        <?php endif; ?>
