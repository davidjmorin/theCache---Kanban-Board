<?php
// Detect current page
$current_page = basename($_SERVER['PHP_SELF']);
$is_kanban_page = ($current_page === 'kanban.php');
?>

<header class="header">
            <div class="header-main">
                <div class="header-brand">
                  <a href="/"> <img src="assets/thecache_logo.png" alt="The Cache Logo" class="header-logo"></a>
                    <h1 class="company-name" id="companyName">Kanban Board</h1>
                </div>
                
                <div class="header-right">
                    <?php if ($is_kanban_page): ?>
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
                    
                    <div class="header-search desktop-only">
                        <div class="search-box">
                            <i class="fas fa-search"></i>
                            <input type="text" id="searchInput" placeholder="Search tasks, clients, projects...">
                            <button class="search-clear" id="searchClear" style="display: none;">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="header-actions desktop-only">
                        <button class="btn btn-primary" id="addTaskBtn">
                            <i class="fas fa-plus"></i> Task
                        </button>
                        <button class="btn btn-secondary" id="quickAddBtn">
                            <i class="fas fa-bolt"></i> Quick Add
                        </button>
                    </div>
                    
                    <div class="header-nav desktop-only" id="headerNav">
                        <button class="btn btn-secondary" data-module="crm" onclick="window.location.href='/crm'">
                            <i class="fas fa-users"></i> CRM
                        </button>
                        <button class="btn btn-secondary" data-module="notes" onclick="window.location.href='/notes'">
                            <i class="fas fa-sticky-note"></i> Notes
                        </button>
                        <button class="btn btn-secondary" data-module="calendar" onclick="window.location.href='/calendar'">
                            <i class="fas fa-calendar"></i> Calendar
                        </button>
                        
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
                    </div>
                    <?php else: ?>
                    <!-- Navigation for non-kanban pages (dashboard, etc.) -->
                    <div class="header-nav desktop-only" id="headerNav">
                    <button class="btn btn-secondary" data-module="tasks" onclick="window.location.href='/kanban.php'">
                            <i class="fas fa-tasks"></i> Tasks
                        </button>
                        <button class="btn btn-secondary" data-module="crm" onclick="window.location.href='/crm'">
                            <i class="fas fa-users"></i> CRM
                        </button>
                        <button class="btn btn-secondary" data-module="notes" onclick="window.location.href='/notes'">
                            <i class="fas fa-sticky-note"></i> Notes
                        </button>
                        <button class="btn btn-secondary" data-module="calendar" onclick="window.location.href='/calendar'">
                            <i class="fas fa-calendar"></i> Calendar
                        </button>
                    </div>
                    <?php endif; ?>
                    
                    <div class="header-user desktop-only">
                        <div class="dropdown">
                            <button class="btn btn-secondary dropdown-toggle" id="userDropdown">
                                <span id="currentUserName">User</span> <i class="fas fa-user"></i>
                                <i class="fas fa-chevron-down"></i>
                            </button>
                            <div class="dropdown-menu" id="userMenu">
                                <div class="dropdown-header">
                                    <i class="fas fa-user"></i>
                                    <span id="userDropdownName">User</span>
                                </div>
                                <div class="dropdown-divider"></div>
                                <button class="dropdown-item" onclick="window.location.href='/preferences'">
                                    <i class="fas fa-cog"></i> Preferences
                                </button>
                                <button class="dropdown-item" id="logoutBtn">
                                    <i class="fas fa-sign-out-alt"></i> Logout
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="header-notifications desktop-only">
                        <button class="btn btn-icon" id="notificationsBtn" title="Notifications">
                            <i class="fas fa-bell"></i>
                            <span class="notification-badge" id="notificationCount">0</span>
                        </button>
                    </div>
                    
                    <div class="mobile-menu-btn mobile-only">
                        <button class="btn btn-secondary" id="mobileMenuBtn">
                            <i class="fas fa-bars"></i>
                        </button>
                    </div>
                </div>
            </div>
        </header>
        
        <!-- Mobile Menu Overlay -->
        <div class="mobile-menu-overlay" id="mobileMenuOverlay">
            <div class="mobile-menu-sidebar">
                <div class="mobile-menu-header">
                    <h3>Menu</h3>
                    <button class="mobile-menu-close" id="mobileMenuClose">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mobile-menu-content">
                    <?php if ($is_kanban_page): ?>
                    <!-- Mobile menu for kanban page -->
                    <div class="mobile-menu-section">
                        <h4>Board Selection</h4>
                        <div class="mobile-board-selector">
                            <select id="mobileBoardSelector" class="board-select">
                                <option value="">Select Board</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="mobile-menu-section">
                        <h4>Navigation</h4>
                        <button class="mobile-menu-item" onclick="window.location.href='/kanban.php'">
                            <i class="fas fa-tasks"></i>
                            <span>Tasks</span>
                        </button>
                        <button class="mobile-menu-item" onclick="window.location.href='/crm'">
                            <i class="fas fa-users"></i>
                            <span>CRM</span>
                        </button>
                        <button class="mobile-menu-item" onclick="window.location.href='/notes'">
                            <i class="fas fa-sticky-note"></i>
                            <span>Notes</span>
                        </button>
                        <button class="mobile-menu-item" onclick="window.location.href='/calendar'">
                            <i class="fas fa-calendar"></i>
                            <span>Calendar</span>
                        </button>
                    </div>
                    
                    <div class="mobile-menu-section">
                        <h4>Quick Actions</h4>
                        <button class="mobile-menu-item" id="mobileAddTaskBtn">
                            <i class="fas fa-plus"></i>
                            <span>Add Task</span>
                        </button>
                        <button class="mobile-menu-item" id="mobileQuickAddBtn">
                            <i class="fas fa-bolt"></i>
                            <span>Quick Add</span>
                        </button>
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
                    </div>
                    <?php else: ?>
                    <!-- Mobile menu for non-kanban pages (dashboard, etc.) -->
                    <div class="mobile-menu-section">
                        <h4>Navigation</h4>
                        <button class="mobile-menu-item" onclick="window.location.href='/kanban.php'">
                            <i class="fas fa-tasks"></i>
                            <span>Tasks</span>
                        </button>
                        <button class="mobile-menu-item" onclick="window.location.href='/crm'">
                            <i class="fas fa-users"></i>
                            <span>CRM</span>
                        </button>
                        <button class="mobile-menu-item" onclick="window.location.href='/notes'">
                            <i class="fas fa-sticky-note"></i>
                            <span>Notes</span>
                        </button>
                        <button class="mobile-menu-item" onclick="window.location.href='/calendar'">
                            <i class="fas fa-calendar"></i>
                            <span>Calendar</span>
                        </button>
                    </div>
                    <?php endif; ?>
                    
                    <div class="mobile-menu-section">
                        <h4>Account</h4>
                        <button class="mobile-menu-item" onclick="window.location.href='/preferences'">
                            <i class="fas fa-cog"></i>
                            <span>Preferences</span>
                        </button>
                        <button class="mobile-menu-item" id="mobileLogoutBtn">
                            <i class="fas fa-sign-out-alt"></i>
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>