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
            this.updateDashboard();
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

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${responseText}`);
            }

            try {
                return JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse JSON response:', responseText);
                throw new Error('Invalid JSON response');
            }
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
            // Load all necessary data with individual error handling
            const promises = [
                this.apiCall('company').catch(e => { console.error('Company data failed:', e); return null; }),
                this.apiCall('boards').catch(e => { console.error('Boards data failed:', e); return []; }),
                this.apiCall('users').catch(e => { console.error('Users data failed:', e); return []; }),
                this.apiCall('clients').catch(e => { console.error('Clients data failed:', e); return []; }),
                this.apiCall('tasks').catch(e => { console.error('Tasks data failed:', e); return []; }),
                this.apiCall('upcoming-tbr-meetings').catch(e => { console.error('TBR meetings data failed:', e); return []; }),
                this.apiCall('opportunity-stats').catch(e => { console.error('Opportunity stats data failed:', e); return null; })
            ];

            const [companyData, boardsData, usersData, clientsData, tasksData, tbrMeetingsData, opportunityStatsData] = await Promise.all(promises);

            this.data.company = companyData;
            this.data.boards = boardsData || [];
            this.data.users = usersData || [];
            this.data.clients = clientsData || [];
            this.data.tasks = tasksData || [];
            this.data.tbrMeetings = tbrMeetingsData || [];
            this.data.opportunityStats = opportunityStatsData;

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
        this.updateUpcomingTbrMeetings();
    }

    updateMetrics() {
        const currentUserId = this.currentUser.id;
        
        // Filter tasks for current user (created by or assigned to)
        const userTasks = this.data.tasks.filter(task => 
            task.created_by == currentUserId || task.user_id == currentUserId
        );
        
        // Filter boards for current user (created by or shared with)
        const userBoards = this.data.boards.filter(board => 
            board.created_by == currentUserId || board.access_type === 'shared' || board.access_type === 'owner'
        );
        
        // Filter clients for current user (only clients associated with user's tasks)
        const userTaskClientIds = userTasks.map(task => task.client_id).filter(id => id);
        const userClients = this.data.clients.filter(client => 
            userTaskClientIds.includes(client.id)
        );
        
        // Filter users for current user (only users who are part of user's boards)
        const userBoardIds = userBoards.map(board => board.id);
        const userBoardUsers = this.data.users.filter(user => {
            // Include users who have tasks in the user's boards
            const hasTasksInUserBoards = userTasks.some(task => task.user_id == user.id);
            return hasTasksInUserBoards || user.id == currentUserId;
        });
        
        // Update counts with filtered data
        const totalUsers = userBoardUsers.length;
        document.getElementById('totalUsers').textContent = totalUsers;

        const totalClients = userClients.length;
        document.getElementById('totalClients').textContent = totalClients;

        const totalTasks = userTasks.length;
        document.getElementById('totalTasks').textContent = totalTasks;

        const totalBoards = userBoards.length;
        document.getElementById('totalBoards').textContent = totalBoards;

        // Update active boards (boards with tasks)
        const activeBoards = userBoards.filter(board => {
            const boardTasks = userTasks.filter(task => task.board_id == board.id);
            return boardTasks.length > 0;
        }).length;
        document.getElementById('activeBoards').textContent = `${activeBoards} active projects`;
    }

    updateTaskOverview() {
        const currentUserId = this.currentUser.id;
        
        // Filter tasks for current user (created by or assigned to)
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
        
        // Filter data for current user
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
        
        // Calculate trends (simplified - you can make this more sophisticated)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        // Users trend (simplified)
        const usersThisMonth = userBoardUsers.filter(user => {
            const userDate = new Date(user.created_at);
            return userDate.getMonth() === currentMonth && userDate.getFullYear() === currentYear;
        }).length;

        const usersTrend = usersThisMonth > 0 ? `+${usersThisMonth} this month` : 'No change this month';
        document.getElementById('usersTrend').textContent = usersTrend;

        // Clients trend (simplified)
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
        
        // Format currency helper function
        const formatCurrency = (amount) => {
            if (amount >= 1000000) {
                return `$${(amount / 1000000).toFixed(1)}M`;
            } else if (amount >= 1000) {
                return `$${(amount / 1000).toFixed(1)}K`;
            } else {
                return `$${amount.toLocaleString()}`;
            }
        };

        // Update Won opportunities
        document.getElementById('wonOpportunities').textContent = stats.won?.count || 0;
        document.getElementById('wonRevenue').textContent = formatCurrency(stats.won?.total_revenue || 0);

        // Update Qualified opportunities
        document.getElementById('qualifiedOpportunities').textContent = stats.qualified?.count || 0;
        document.getElementById('qualifiedRevenue').textContent = formatCurrency(stats.qualified?.total_revenue || 0);

        // Update Proposal opportunities
        document.getElementById('proposalOpportunities').textContent = stats.proposal?.count || 0;
        document.getElementById('proposalRevenue').textContent = formatCurrency(stats.proposal?.total_revenue || 0);

        // Update Lost opportunities
        document.getElementById('lostOpportunities').textContent = stats.lost?.count || 0;
        document.getElementById('lostRevenue').textContent = formatCurrency(stats.lost?.total_revenue || 0);
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
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        
        // Form switching
        document.getElementById('showRegisterForm').addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });
        document.getElementById('showLoginForm').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => this.handleLogout());

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));
        }

        // Mobile menu
        const mobileMenuBtn = document.getElementById('mobileMenuBtn');
        if (mobileMenuBtn) {
            mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const email = formData.get('email');
        const password = formData.get('password');

        try {
            const response = await this.apiCall('login', 'POST', { email, password });
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
            // Implement search functionality
            console.log('Searching for:', query);
        }
    }

    toggleMobileMenu() {
        const overlay = document.getElementById('mobileMenuOverlay');
        if (overlay) {
            overlay.classList.toggle('active');
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
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

        // Add to page
        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);

        // Close button functionality
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
        // This would open the boards modal - you can implement this based on your existing modal system
        console.log('Opening boards modal');
        // For now, redirect to the kanban page
        window.location.href = '/kanban.html';
    }
}

// Initialize the dashboard app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new DashboardApp();
});
