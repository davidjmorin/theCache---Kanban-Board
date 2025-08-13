class DashboardApp {
    constructor() {
        console.log('DashboardApp constructor called');
        this.apiBase = 'api.php?endpoint=';
        this.currentUser = null;
        this.data = {
            company: null,
            boards: [],
            users: [],
            clients: [],
            tasks: [],
            tbrMeetings: [],
            opportunityStats: null
        };
        this.userPreferences = {};
        this.csrfToken = null;

        this.init();
    }

    async init() {
        this.setupEventListeners();
        document.getElementById('loadingScreen').style.display = 'flex';
        await this.checkAuthentication();
        document.getElementById('loadingScreen').style.display = 'none';

        if (this.currentUser) {
            await this.loadDashboardData();
            await this.loadUserPreferences();
            this.updateDashboard();
            this.updateNavigationVisibility();
            this.updateCrmSectionVisibility();
        }
    }

    async apiCall(endpoint, method = 'GET', data = null, queryParams = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include' // Include cookies for session management
            };

            if (this.csrfToken && method !== 'GET') {
                options.headers['X-CSRF-Token'] = this.csrfToken;
            }

            if (data && method !== 'GET') {
                options.body = JSON.stringify(data);
            }

            let url = this.apiBase + endpoint;

            if (queryParams && Object.keys(queryParams).length > 0) {
                const params = new URLSearchParams();
                Object.entries(queryParams).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        params.append(key, value);
                    }
                });
                url += '&' + params.toString();
            }

            const response = await fetch(url, options);
            const responseText = await response.text();

            let jsonResponse;
            try {
                jsonResponse = JSON.parse(responseText);
            } catch (e) {
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${responseText}`);
                }
                console.error('Failed to parse JSON response:', responseText);
                throw new Error('Invalid JSON response');
            }

            if (!response.ok) {
                // Extract the actual error message from the JSON response
                const errorMessage = jsonResponse.error || `HTTP ${response.status}: ${responseText}`;
                throw new Error(errorMessage);
            }

            return jsonResponse;
        } catch (error) {
            console.error('API call failed:', error);
            throw error;
        }
    }

    async checkAuthentication() {
        try {
            const response = await this.apiCall('check-auth');
            if (response.authenticated) {
                this.currentUser = response.user;
                this.csrfToken = response.csrf_token;
                this.showApp();
                this.updateUserInfo();
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('loginContainer').style.display = 'flex';
        document.getElementById('appContainer').style.display = 'none';
    }

    showApp() {
        document.getElementById('loginContainer').style.display = 'none';
        document.getElementById('appContainer').style.display = 'block';
    }

    updateUserInfo() {
        if (this.currentUser) {
            const userName = this.currentUser.name || this.currentUser.email;
            document.getElementById('currentUserName').textContent = userName;
            document.getElementById('userDropdownName').textContent = userName;
            document.getElementById('userDisplayName').textContent = userName;
        }
    }

    async loadDashboardData() {
        try {
            const promises = [
                this.apiCall('company').catch(e => { console.error('Company data failed:', e); return null; }),
                this.apiCall('boards').catch(e => { console.error('Boards data failed:', e); return []; }),
                this.apiCall('users').catch(e => { console.error('Users data failed:', e); return []; }),
                this.apiCall('clients').catch(e => { console.error('Clients data failed:', e); return []; }),
                this.apiCall('tasks').catch(e => { console.error('Tasks data failed:', e); return []; }),
                this.apiCall('upcoming-tbr-meetings').catch(e => { console.error('TBR meetings data failed:', e); return []; }),
                this.apiCall('opportunity-stats').catch(e => { console.error('Opportunity stats data failed:', e); return null; }),
                this.apiCall('total-mrr').catch(e => { console.error('Total MRR data failed:', e); return { total_mrr: 0 }; })
            ];

            const [companyData, boardsData, usersData, clientsData, tasksData, tbrMeetingsData, opportunityStatsData, totalMRRData] = await Promise.all(promises);

            this.data.company = companyData;
            this.data.boards = boardsData || [];
            this.data.users = usersData || [];
            this.data.clients = clientsData || [];
            this.data.tasks = tasksData || [];
            this.data.tbrMeetings = tbrMeetingsData || [];
            this.data.opportunityStats = opportunityStatsData;
            this.data.totalMRR = totalMRRData?.total_mrr || 0;

        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showNotification('Failed to load dashboard data', 'error');
        }
    }

    updateDashboard() {
        this.updateMetrics();
        this.updateTaskOverview();
        this.updateTrends();
        this.updateOpportunityStats();
        this.updateMRR();
        this.updateUpcomingTbrMeetings();
    }

    updateMetrics() {
        const currentUserId = this.currentUser.id;
        
        const userTasks = this.data.tasks.filter(task => 
            task.created_by == currentUserId || task.user_id == currentUserId
        );
        
        const userBoards = this.data.boards.filter(board => 
            board.created_by == currentUserId || board.access_type === 'shared' || board.access_type === 'owner'
        );
        
        const userTaskClientIds = userTasks.map(task => task.client_id).filter(id => id);
        const userClients = this.data.clients.filter(client => 
            userTaskClientIds.includes(client.id)
        );
        
        const userBoardIds = userBoards.map(board => board.id);
        const userBoardUsers = this.data.users.filter(user => {
            const hasTasksInUserBoards = userTasks.some(task => task.user_id == user.id);
            return hasTasksInUserBoards || user.id == currentUserId;
        });
        
        const totalUsers = userBoardUsers.length;
        document.getElementById('totalUsers').textContent = totalUsers;

        const totalClients = userClients.length;
        document.getElementById('totalClients').textContent = totalClients;

        const totalTasks = userTasks.length;
        document.getElementById('totalTasks').textContent = totalTasks;

        const totalBoards = userBoards.length;
        document.getElementById('totalBoards').textContent = totalBoards;

        const activeBoards = userBoards.filter(board => {
            const boardTasks = userTasks.filter(task => task.board_id == board.id);
            return boardTasks.length > 0;
        }).length;
        document.getElementById('activeBoards').textContent = `${activeBoards} active projects`;
    }

    updateTaskOverview() {
        const currentUserId = this.currentUser.id;
        
        const userTasks = this.data.tasks.filter(task => 
            task.created_by == currentUserId || task.user_id == currentUserId
        );
        
        const totalTasks = userTasks.length;
        const completedTasks = userTasks.filter(task => task.is_completed).length;
        const pendingTasks = totalTasks - completedTasks;

        const completedPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
        const pendingPercentage = totalTasks > 0 ? Math.round((pendingTasks / totalTasks) * 100) : 0;

        document.getElementById('completedTasks').textContent = completedTasks;
        document.getElementById('pendingTasks').textContent = pendingTasks;
        document.getElementById('completedPercentage').textContent = `${completedPercentage}% of total`;
        document.getElementById('pendingPercentage').textContent = `${pendingPercentage}% of total`;
        document.getElementById('tasksCompleted').textContent = `${completedPercentage}% completed`;
    }

    updateTrends() {
        const currentUserId = this.currentUser.id;
        
        const userTasks = this.data.tasks.filter(task => 
            task.created_by == currentUserId || task.user_id == currentUserId
        );
        
        const userBoards = this.data.boards.filter(board => 
            board.created_by == currentUserId || board.access_type === 'shared' || board.access_type === 'owner'
        );
        
        const userTaskClientIds = userTasks.map(task => task.client_id).filter(id => id);
        const userClients = this.data.clients.filter(client => 
            userTaskClientIds.includes(client.id)
        );
        
        const userBoardUsers = this.data.users.filter(user => {
            const hasTasksInUserBoards = userTasks.some(task => task.user_id == user.id);
            return hasTasksInUserBoards || user.id == currentUserId;
        });
        
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const usersThisMonth = userBoardUsers.filter(user => {
            const userDate = new Date(user.created_at);
            return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
        }).length;

        const usersTrend = usersThisMonth > 0 ? `+${usersThisMonth} this month` : 'No change this month';
        document.getElementById('usersTrend').textContent = usersTrend;

        const clientsThisMonth = userClients.filter(client => {
            const clientDate = new Date(client.created_at);
            return clientDate.getMonth() === currentMonth && clientDate.getFullYear() === currentYear;
        }).length;

        const clientsTrend = clientsThisMonth > 0 ? `+${clientsThisMonth} this month` : 'No change this month';
        document.getElementById('clientsTrend').textContent = clientsTrend;
    }

    updateOpportunityStats() {
        if (!this.data.opportunityStats) {
            console.log('No opportunity stats data available');
            return;
        }

        const stats = this.data.opportunityStats;
        
        document.getElementById('wonOpportunities').textContent = stats.won?.count || 0;
        document.getElementById('wonRevenue').textContent = this.formatCurrency(stats.won?.total_revenue || 0);

        document.getElementById('qualifiedOpportunities').textContent = stats.qualified?.count || 0;
        document.getElementById('qualifiedRevenue').textContent = this.formatCurrency(stats.qualified?.total_revenue || 0);

        document.getElementById('proposalOpportunities').textContent = stats.proposal?.count || 0;
        document.getElementById('proposalRevenue').textContent = this.formatCurrency(stats.proposal?.total_revenue || 0);

        document.getElementById('lostOpportunities').textContent = stats.lost?.count || 0;
        document.getElementById('lostRevenue').textContent = this.formatCurrency(stats.lost?.total_revenue || 0);
    }

    formatCurrency(amount) {
        if (amount >= 1000000) {
            return `$${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(1)}K`;
        } else {
            return `$${amount.toLocaleString()}`;
        }
    }

    updateMRR() {
        const totalMRR = this.data.totalMRR || 0;
        const mrrElement = document.getElementById('totalMRR');
        if (mrrElement) {
            mrrElement.textContent = this.formatCurrency(totalMRR);
        }
    }

    updateUpcomingTbrMeetings() {
        const container = document.getElementById('upcomingTbrMeetings');
        if (!container) {
            console.error('Container not found: upcomingTbrMeetings');
            return;
        }

        const meetings = this.data.tbrMeetings || [];
        
        if (meetings.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>No upcoming TBR meetings scheduled</p>
                </div>
            `;
            return;
        }

        const meetingsHtml = meetings.map(meeting => {
            const meetingDate = new Date(meeting.meeting_date);
            const today = new Date();
            const daysUntilMeeting = Math.ceil((meetingDate - today) / (1000 * 60 * 60 * 24));
            
            let dateDisplay = '';
            if (daysUntilMeeting === 0) {
                dateDisplay = '<span class="meeting-date today">Today</span>';
            } else if (daysUntilMeeting === 1) {
                dateDisplay = '<span class="meeting-date tomorrow">Tomorrow</span>';
            } else if (daysUntilMeeting <= 7) {
                dateDisplay = `<span class="meeting-date soon">In ${daysUntilMeeting} days</span>`;
            } else {
                dateDisplay = `<span class="meeting-date future">${meetingDate.toLocaleDateString()}</span>`;
            }

            const attendeesList = meeting.attendees && meeting.attendees.length > 0 
                ? meeting.attendees.map(attendee => attendee.user_name || attendee.name).join(', ')
                : 'No attendees';

            return `
                <div class="tbr-meeting-item" onclick="window.location.href='/crm?client=${meeting.client_id}&tab=tbr'">
                    <div class="tbr-meeting-info">
                        <div class="tbr-meeting-header">
                            <h4 class="tbr-meeting-title">${meeting.client_name} - ${meeting.meeting_type}</h4>
                            ${dateDisplay}
                        </div>
                        <div class="tbr-meeting-details">
                            <p class="tbr-meeting-contact">
                                <i class="fas fa-user"></i> 
                                ${meeting.primary_contact || meeting.client_contact_name || 'No contact specified'}
                            </p>
                            <p class="tbr-meeting-attendees">
                                <i class="fas fa-users"></i> 
                                ${attendeesList}
                            </p>
                        </div>
                    </div>
                    <div class="tbr-meeting-arrow">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = meetingsHtml;
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        
        document.getElementById('showRegisterForm').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });
        document.getElementById('showLoginForm').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Mobile menu close button
        const mobileMenuClose = document.getElementById('mobileMenuClose');
        if (mobileMenuClose) {
            mobileMenuClose.addEventListener('click', () => this.toggleMobileMenu());
        }

        // Close mobile menu when clicking outside
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        if (mobileMenuOverlay) {
            mobileMenuOverlay.addEventListener('click', (e) => {
                if (e.target === mobileMenuOverlay) {
                    this.toggleMobileMenu();
                }
            });
        }

        // Mobile menu item event listeners
        const mobileLogoutBtn = document.getElementById('mobileLogoutBtn');
        if (mobileLogoutBtn) {
            mobileLogoutBtn.addEventListener('click', () => {
                this.toggleMobileMenu();
                this.handleLogout();
            });
        }

        // Mobile menu items for kanban page (if they exist)
        const mobileAddTaskBtn = document.getElementById('mobileAddTaskBtn');
        if (mobileAddTaskBtn) {
            mobileAddTaskBtn.addEventListener('click', () => {
                this.toggleMobileMenu();
                // Trigger the same action as the desktop add task button
                const addTaskBtn = document.getElementById('addTaskBtn');
                if (addTaskBtn) {
                    addTaskBtn.click();
                }
            });
        }

        const mobileQuickAddBtn = document.getElementById('mobileQuickAddBtn');
        if (mobileQuickAddBtn) {
            mobileQuickAddBtn.addEventListener('click', () => {
                this.toggleMobileMenu();
                // Trigger the same action as the desktop quick add button
                const quickAddBtn = document.getElementById('quickAddBtn');
                if (quickAddBtn) {
                    quickAddBtn.click();
                }
            });
        }

        // Mobile board selector
        const mobileBoardSelector = document.getElementById('mobileBoardSelector');
        if (mobileBoardSelector) {
            mobileBoardSelector.addEventListener('change', (e) => {
                const selectedBoardId = e.target.value;
                if (selectedBoardId) {
                    // Trigger the same action as the desktop board selector
                    const desktopBoardSelector = document.getElementById('boardSelector');
                    if (desktopBoardSelector) {
                        desktopBoardSelector.value = selectedBoardId;
                        // Trigger change event on desktop selector
                        const changeEvent = new Event('change', { bubbles: true });
                        desktopBoardSelector.dispatchEvent(changeEvent);
                    }
                    this.toggleMobileMenu();
                }
            });
        }

        // Setup dropdown functionality
        this.setupDropdowns();
    }

    setupDropdowns() {
        const userDropdown = document.getElementById('userDropdown');
        const userMenu = document.getElementById('userMenu');

        if (userDropdown) {
            userDropdown.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.parentElement.classList.toggle('active');
            });
        }

        // Close dropdowns when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });

        // Close dropdowns on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const response = await this.apiCall('login', 'POST', { email, password });
            
            // Check if 2FA is required
            if (response.requires_2fa) {
                this.show2FAVerification(response.temp_user_id, email);
                return;
            }
            
            if (response.success) {
                this.currentUser = response.user;
                this.csrfToken = response.csrf_token;
                this.showApp();
                this.updateUserInfo();
                await this.loadDashboardData();
                this.updateDashboard();
                this.showNotification('Login successful!', 'success');
            } else {
                this.showNotification(response.error || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login failed:', error);
            this.showNotification('Login failed. Please try again.', 'error');
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const response = await this.apiCall('register', 'POST', { name, email, password });
            if (response.success) {
                this.showNotification('Registration successful! Please login.', 'success');
                this.showLoginForm();
            } else {
                this.showNotification(response.error || 'Registration failed', 'error');
            }
        } catch (error) {
            console.error('Registration failed:', error);
            this.showNotification('Registration failed. Please try again.', 'error');
        }
    }

    showRegisterForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    }

    showLoginForm() {
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
    }

    async handleLogout() {
        try {
            await this.apiCall('logout', 'POST');
            this.currentUser = null;
            this.csrfToken = null;
            this.data = {
                company: null,
                boards: [],
                users: [],
                clients: [],
                tasks: [],
                tbrMeetings: [],
                opportunityStats: null
            };
            this.showLogin();
            this.showNotification('Logged out successfully!', 'success');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    handleSearch(query) {
        if (query.length > 2) {
            console.log('Searching for:', query);
        }
    }

    toggleMobileMenu() {
        const overlay = document.getElementById('mobileMenuOverlay');
        if (overlay) {
            overlay.classList.toggle('active');
            
            // If opening the menu and we're on the kanban page, populate the board selector
            if (overlay.classList.contains('active') && window.location.pathname.includes('kanban')) {
                this.populateMobileBoardSelector();
            }
        }
    }

    populateMobileBoardSelector() {
        const mobileBoardSelector = document.getElementById('mobileBoardSelector');
        const desktopBoardSelector = document.getElementById('boardSelector');
        
        if (mobileBoardSelector && desktopBoardSelector) {
            // Clear existing options
            mobileBoardSelector.innerHTML = '<option value="">Select Board</option>';
            
            // Copy options from desktop selector
            Array.from(desktopBoardSelector.options).forEach(option => {
                const newOption = document.createElement('option');
                newOption.value = option.value;
                newOption.textContent = option.textContent;
                newOption.selected = option.selected;
                mobileBoardSelector.appendChild(newOption);
            });
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);

        const closeBtn = notification.querySelector('.notification-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                notification.classList.remove('show');
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            });
        }
    }

    showBoardsModal() {
        console.log('Opening boards modal');
        window.location.href = '/kanban.html';
    }

    async loadUserPreferences() {
        try {
            const response = await this.apiCall('user-preferences');
            this.userPreferences = response || {};
        } catch (error) {
            console.error('Failed to load user preferences:', error);
            this.userPreferences = {};
        }
    }

    updateNavigationVisibility() {
        const headerNav = document.getElementById('headerNav');
        if (!headerNav) return;

        const navButtons = headerNav.querySelectorAll('[data-module]');
        navButtons.forEach(button => {
            const module = button.getAttribute('data-module');
            const isEnabled = this.userPreferences[module] !== 0 && this.userPreferences[module] !== false; // Default to enabled unless explicitly disabled (0 or false)
            
            if (isEnabled) {
                button.style.display = '';
            } else {
                button.style.display = 'none';
            }
        });
    }

    updateCrmSectionVisibility() {
        // Check if CRM module is enabled
        const isCrmEnabled = this.userPreferences['crm'] !== 0 && this.userPreferences['crm'] !== false;
        
        // Get all CRM-related sections
        const crmSections = document.querySelectorAll('[data-crm-section]');
        
        crmSections.forEach(section => {
            if (isCrmEnabled) {
                section.style.display = '';
            } else {
                section.style.display = 'none';
            }
        });
        
        // Log for debugging
        console.log(`CRM sections ${isCrmEnabled ? 'shown' : 'hidden'} based on user preference:`, this.userPreferences['crm']);
    }

    // 2FA Verification Methods
    show2FAVerification(tempUserId, email) {
        this.tempUserId = tempUserId;
        this.tempEmail = email;
        
        // Make sure login container is visible
        const loginContainer = document.getElementById('loginContainer');
        loginContainer.style.display = 'block';
        
        // Hide the actual login and register forms
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        if (loginForm) loginForm.style.display = 'none';
        if (registerForm) registerForm.style.display = 'none';
        
        // Check if 2FA form already exists
        let twoFAForm = document.getElementById('twoFAForm');
        if (!twoFAForm) {
            this.create2FAForm();
            twoFAForm = document.getElementById('twoFAForm');
        }
        
        if (twoFAForm) {
            // Show 2FA form
            twoFAForm.style.display = 'block';
            document.getElementById('totpCode').focus();
        }
    }

    hide2FAForm() {
        const twoFAForm = document.getElementById('twoFAForm');
        const backupCodeForm = document.getElementById('backupCodeForm');
        if (twoFAForm) twoFAForm.style.display = 'none';
        if (backupCodeForm) backupCodeForm.style.display = 'none';
        
        // Show the login form again
        const loginForm = document.getElementById('loginForm');
        if (loginForm) loginForm.style.display = 'block';
    }

    create2FAForm() {
        const authContainer = document.querySelector('.login-container');
        if (!authContainer) return;

        const twoFAFormHTML = `
            <form id="twoFAForm" class="login-form" style="display: none;">
                <h2><i class="fas fa-shield-alt"></i> Two-Factor Authentication</h2>
                <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">Enter the 6-digit code from your authenticator app</p>
                
                <div class="form-group">
                    <label for="totpCode">
                        <i class="fas fa-mobile-alt"></i>
                        Verification Code
                    </label>
                    <input type="text" 
                           id="totpCode" 
                           name="totpCode" 
                           placeholder="123456"
                           maxlength="6"
                           pattern="[0-9]{6}"
                           autocomplete="one-time-code"
                           required>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        <i class="fas fa-check"></i>
                        Verify Code
                    </button>
                </div>

                <div style="margin-top: 1rem; text-align: center;">
                    <p style="margin-bottom: 0.5rem;">
                        <a href="#" onclick="dashboard.showBackupCodeForm(); return false;" style="color: var(--primary-color);">
                            <i class="fas fa-key"></i>
                            Use backup code instead
                        </a>
                    </p>
                    <p style="margin-bottom: 0;">
                        <a href="#" onclick="dashboard.cancelTwoFA(); return false;" style="color: var(--text-secondary);">
                            <i class="fas fa-arrow-left"></i>
                            Back to login
                        </a>
                    </p>
                </div>
            </form>


            <form id="backupCodeForm" class="login-form" style="display: none;">
                <h2><i class="fas fa-key"></i> Backup Code</h2>
                <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">Enter one of your backup codes</p>
                
                <div class="form-group">
                    <label for="backupCode">
                        <i class="fas fa-key"></i>
                        Backup Code
                    </label>
                    <input type="text" 
                           id="backupCode" 
                           name="backupCode" 
                           placeholder="ABC12345"
                           maxlength="8"
                           style="text-transform: uppercase;"
                           required>
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="btn btn-primary" style="width: 100%;">
                        <i class="fas fa-check"></i>
                        Verify Backup Code
                    </button>
                </div>

                <div style="margin-top: 1rem; text-align: center;">
                    <p style="margin-bottom: 0.5rem;">
                        <a href="#" onclick="dashboard.show2FAVerification(dashboard.tempUserId, dashboard.tempEmail); return false;" style="color: var(--primary-color);">
                            <i class="fas fa-mobile-alt"></i>
                            Use authenticator app instead
                        </a>
                    </p>
                    <p style="margin-bottom: 0;">
                        <a href="#" onclick="dashboard.cancelTwoFA(); return false;" style="color: var(--text-secondary);">
                            <i class="fas fa-arrow-left"></i>
                            Back to login
                        </a>
                    </p>
                </div>
            </form>
        `;

        authContainer.insertAdjacentHTML('beforeend', twoFAFormHTML);

        // Add event listeners
        document.getElementById('twoFAForm').addEventListener('submit', (e) => this.handleTwoFAVerification(e));
        document.getElementById('backupCodeForm').addEventListener('submit', (e) => this.handleBackupCodeVerification(e));
        
        // Format TOTP input
        document.getElementById('totpCode').addEventListener('input', function(e) {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
        
        // Format backup code input
        document.getElementById('backupCode').addEventListener('input', function(e) {
            this.value = this.value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        });
    }

    showBackupCodeForm() {
        document.getElementById('twoFAForm').style.display = 'none';
        document.getElementById('backupCodeForm').style.display = 'block';
        document.getElementById('backupCode').focus();
    }

    cancelTwoFA() {
        this.hide2FAForm();
        // Clear any temporary session data if needed
        this.tempUserId = null;
        this.tempEmail = null;
        
        // Clear login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.reset();
        }
    }

    async handleTwoFAVerification(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const totpCode = formData.get('totpCode');

        if (!totpCode || totpCode.length !== 6) {
            this.showNotification('Please enter a valid 6-digit code', 'error');
            return;
        }

        try {
            const response = await this.apiCall('2fa-verify', 'POST', {
                totp_code: totpCode,
                temp_user_id: this.tempUserId
            });

            // Check if verification was successful
            if (response.success && response.user) {
                // Success - complete login
                this.currentUser = response.user;
                this.csrfToken = response.csrf_token;
                
                this.hide2FAForm();
                this.showApp();
                this.updateUserInfo();
                await this.loadDashboardData();
                this.updateDashboard();
                this.showNotification('Login successful!', 'success');
            } else {
                // Failed verification - show error and stay on 2FA form
                const errorMessage = response.error || 'Invalid verification code. Please try again.';
                this.showNotification(errorMessage, 'error');
                document.getElementById('totpCode').value = '';
                document.getElementById('totpCode').focus();
            }
        } catch (error) {
            // Network or other error - show the actual error message from server
            this.showNotification('Verification failed: ' + error.message, 'error');
            document.getElementById('totpCode').value = '';
            document.getElementById('totpCode').focus();
        }
    }

    async handleBackupCodeVerification(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const backupCode = formData.get('backupCode');

        if (!backupCode || backupCode.length !== 8) {
            this.showNotification('Please enter a valid 8-character backup code', 'error');
            return;
        }

        try {
            const response = await this.apiCall('2fa-backup', 'POST', {
                backup_code: backupCode,
                temp_user_id: this.tempUserId
            });

            // Check if verification was successful
            if (response.success && response.user) {
                // Success - complete login
                this.currentUser = response.user;
                this.csrfToken = response.csrf_token;
                
                this.hide2FAForm();
                this.showApp();
                this.updateUserInfo();
                await this.loadDashboardData();
                this.updateDashboard();
                
                // Show special message for backup code usage
                const remainingText = response.remaining_codes !== undefined ? 
                    ` ${response.remaining_codes} backup codes remaining.` : '';
                this.showNotification(`Login successful!${remainingText}`, 'success');
            } else {
                // Failed verification - show error and stay on backup code form
                const errorMessage = response.error || 'Invalid backup code. Please try again.';
                this.showNotification(errorMessage, 'error');
                document.getElementById('backupCode').value = '';
                document.getElementById('backupCode').focus();
            }
        } catch (error) {
            // Network or other error
            this.showNotification('Backup code verification failed. Please try again.', 'error');
            document.getElementById('backupCode').value = '';
            document.getElementById('backupCode').focus();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new DashboardApp();
});
