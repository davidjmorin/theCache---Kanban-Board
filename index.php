<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Cache - Dashboard</title>
    <link rel="icon" type="image/png" href="assets/thecache_logo.png">
    <link rel="shortcut icon" type="image/png" href="assets/thecache_logo.png">
    <link rel="apple-touch-icon" href="assets/thecache_logo.png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/styles.css?v5.25">
    <link rel="stylesheet" href="assets/css/dashboard.css?V2.25">
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

        <div class="dashboard-container">
            <!-- Welcome Section -->
            <div class="dashboard-header">
                <div class="welcome-section">
                    <div class="welcome-icon">
                        <i class="fas fa-tachometer-alt"></i>
                    </div>
                    <div class="welcome-content">
                        <h1 class="welcome-title">Welcome back, <span id="userDisplayName">System Admin</span></h1>
                        <p class="welcome-subtitle">Here's what's happening with your projects today</p>
                    </div>
                </div>
            </div>

            <!-- Key Metrics Section -->
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-icon users-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="metric-content">
                        <h3 class="metric-title">Total Users</h3>
                        <div class="metric-value" id="totalUsers">0</div>
                        <p class="metric-description">Active team members</p>
                        <div class="metric-trend positive">
                            <i class="fas fa-arrow-up"></i>
                            <span id="usersTrend">+0% this month</span>
                        </div>
                    </div>
                </div>

                <div class="metric-card" data-crm-section="clients">
                    <div class="metric-icon clients-icon">
                        <i class="fas fa-building"></i>
                    </div>
                    <div class="metric-content">
                        <h3 class="metric-title">Total Clients</h3>
                        <div class="metric-value" id="totalClients">0</div>
                        <p class="metric-description">Active partnerships</p>
                        <div class="metric-trend positive">
                            <i class="fas fa-arrow-up"></i>
                            <span id="clientsTrend">+0% this month</span>
                        </div>
                    </div>
                </div>

                <div class="metric-card">
                    <div class="metric-icon tasks-icon">
                        <i class="fas fa-check-square"></i>
                    </div>
                    <div class="metric-content">
                        <h3 class="metric-title">Total Tasks</h3>
                        <div class="metric-value" id="totalTasks">0</div>
                        <p class="metric-description">Across all projects</p>
                        <div class="metric-trend completed">
                            <i class="fas fa-check"></i>
                            <span id="tasksCompleted">0% completed</span>
                        </div>
                    </div>
                </div>

                <div class="metric-card">
                    <div class="metric-icon boards-icon">
                        <i class="fas fa-th"></i>
                    </div>
                    <div class="metric-content">
                        <h3 class="metric-title">Total Boards</h3>
                        <div class="metric-value" id="totalBoards">0</div>
                        <p class="metric-description">Kanban workspaces</p>
                        <div class="metric-trend active">
                            <i class="fas fa-circle"></i>
                            <span id="activeBoards">0 active projects</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Opportunity Statistics Section -->
            <div class="section-header" data-crm-section="opportunities">
                <div class="section-icon">
                    <i class="fas fa-handshake"></i>
                </div>
                <div class="section-title">
                    <h2>Opportunity Statistics</h2>
                    <p>Track your sales pipeline performance</p>
                </div>
            </div>

            <div class="metrics-grid opportunities-grid" data-crm-section="opportunities">
                <div class="metric-card opportunity-card">
                    <div class="metric-icon won-icon">
                        <i class="fas fa-trophy"></i>
                    </div>
                    <div class="metric-content">
                        <h3 class="metric-title">Won</h3>
                        <div class="metric-value" id="wonOpportunities">0</div>
                        <p class="metric-description">Closed successfully</p>
                        <div class="metric-trend revenue">
                            <i class="fas fa-dollar-sign"></i>
                            <span id="wonRevenue">$0</span>
                        </div>
                    </div>
                </div>

                <div class="metric-card opportunity-card">
                    <div class="metric-icon qualified-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <div class="metric-content">
                        <h3 class="metric-title">Qualified</h3>
                        <div class="metric-value" id="qualifiedOpportunities">0</div>
                        <p class="metric-description">Qualified prospects</p>
                        <div class="metric-trend revenue">
                            <i class="fas fa-dollar-sign"></i>
                            <span id="qualifiedRevenue">$0</span>
                        </div>
                    </div>
                </div>

                <div class="metric-card opportunity-card">
                    <div class="metric-icon proposal-icon">
                        <i class="fas fa-file-contract"></i>
                    </div>
                    <div class="metric-content">
                        <h3 class="metric-title">Proposal Sent</h3>
                        <div class="metric-value" id="proposalOpportunities">0</div>
                        <p class="metric-description">Awaiting response</p>
                        <div class="metric-trend revenue">
                            <i class="fas fa-dollar-sign"></i>
                            <span id="proposalRevenue">$0</span>
                        </div>
                    </div>
                </div>

                <div class="metric-card opportunity-card">
                    <div class="metric-icon lost-icon">
                        <i class="fas fa-times-circle"></i>
                    </div>
                    <div class="metric-content">
                        <h3 class="metric-title">Lost</h3>
                        <div class="metric-value" id="lostOpportunities">0</div>
                        <p class="metric-description">Closed unsuccessfully</p>
                        <div class="metric-trend revenue">
                            <i class="fas fa-dollar-sign"></i>
                            <span id="lostRevenue">$0</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- MRR Widget Section -->
            <div class="section-header" data-crm-section="mrr">
                <div class="section-icon">
                    <i class="fas fa-chart-line"></i>
                </div>
                <div class="section-title">
                    <h2>Monthly Recurring Revenue</h2>
                    <p>Track your subscription and recurring revenue</p>
                </div>
            </div>

            <div class="metrics-grid mrr-grid" data-crm-section="mrr">
                <div class="metric-card mrr-card">
                    <div class="metric-icon mrr-icon">
                        <i class="fas fa-dollar-sign"></i>
                    </div>
                    <div class="metric-content">
                        <h3 class="metric-title">Total MRR</h3>
                        <div class="metric-value" id="totalMRR">$0</div>
                        <p class="metric-description">From won opportunities</p>
                        <div class="metric-trend mrr-trend">
                            <i class="fas fa-arrow-up"></i>
                            <span>Monthly recurring</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Overview and Actions Section -->
            <div class="overview-grid">
                <div class="overview-card">
                    <div class="overview-header">
                        <div class="overview-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="overview-title-section">
                            <h3 class="overview-title">Task Overview</h3>
                            <p class="overview-subtitle">Current project status</p>
                        </div>
                    </div>
                    <div class="overview-content">
                        <div class="overview-item">
                            <div class="overview-item-info">
                                <div class="overview-item-icon completed">
                                    <i class="fas fa-check-square"></i>
                                </div>
                                <div class="overview-item-details">
                                    <h4 class="overview-item-title">Completed Tasks</h4>
                                    <p class="overview-item-subtitle">Successfully delivered</p>
                                </div>
                            </div>
                            <div class="overview-item-stats">
                                <div class="overview-item-value completed" id="completedTasks">0</div>
                                <div class="overview-item-percentage completed" id="completedPercentage">0% of total</div>
                            </div>
                        </div>
                        <div class="overview-item">
                            <div class="overview-item-info">
                                <div class="overview-item-icon pending">
                                    <i class="fas fa-clock"></i>
                                </div>
                                <div class="overview-item-details">
                                    <h4 class="overview-item-title">Pending Tasks</h4>
                                    <p class="overview-item-subtitle">In progress</p>
                                </div>
                            </div>
                            <div class="overview-item-stats">
                                <div class="overview-item-value pending" id="pendingTasks">0</div>
                                <div class="overview-item-percentage pending" id="pendingPercentage">0% of total</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="overview-card">
                    <div class="overview-header">
                        <div class="overview-icon">
                            <i class="fas fa-bolt"></i>
                        </div>
                        <div class="overview-title-section">
                            <h3 class="overview-title">Quick Actions</h3>
                            <p class="overview-subtitle">Common tasks and shortcuts</p>
                        </div>
                    </div>
                    <div class="overview-content">
                        <div class="quick-action-item" onclick="window.location.href='/kanban.html'">
                            <div class="quick-action-icon">
                                <i class="fas fa-plus-square"></i>
                            </div>
                            <div class="quick-action-details">
                                <h4 class="quick-action-title">Create New Task</h4>
                                <p class="quick-action-subtitle">Add a new task to any board</p>
                            </div>
                            <div class="quick-action-arrow">
                                <i class="fas fa-arrow-right"></i>
                            </div>
                        </div>
                        <div class="quick-action-item" data-crm-section="quick-action" onclick="window.location.href='/crm'">
                            <div class="quick-action-icon">
                                <i class="fas fa-building"></i>
                            </div>
                            <div class="quick-action-details">
                                <h4 class="quick-action-title">Add New Client</h4>
                                <p class="quick-action-subtitle">Create a new client profile</p>
                            </div>
                            <div class="quick-action-arrow">
                                <i class="fas fa-arrow-right"></i>
                            </div>
                        </div>
   
                    </div>
                </div>
            </div>

            <!-- Upcoming TBR Meetings Section -->
            <div class="overview-card tbr-section" data-crm-section="tbr">
                <div class="overview-header">
                    <div class="overview-icon">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="overview-title-section">
                        <h3 class="overview-title">Upcoming TBR Meetings</h3>
                        <p class="overview-subtitle">Your scheduled business reviews</p>
                    </div>
                </div>
                <div class="overview-content" id="upcomingTbrMeetings">
                    <div class="loading-placeholder">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading upcoming meetings...</p>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Loading Screen -->
    <div class="loading-screen" id="loadingScreen">
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading dashboard...</p>
        </div>
    </div>

    <script src="assets/js/logo-helper.js?v=1.0"></script>
    <script src="assets/js/dashboard.js?v=1.10"></script>
</body>
</html>
