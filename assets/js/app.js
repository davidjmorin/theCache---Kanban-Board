class KanbanApp {
    constructor() {
        this.apiBase = 'api.php?endpoint=';
        this.currentUser = null;
        this.data = {
            company: null,
            boards: [],
            currentBoard: null,
            stages: [],
            tasks: [],
            users: [],
            clients: []
        };

        this.loadSavedBoard();
        this.draggedTask = null;
        this.currentTheme = localStorage.getItem('kanban-theme') || 'default';
        this.isAutoRefreshEnabled = true;
        this.autoRefreshInterval = null;
        this.lastUpdateTime = null;
        this.isAutoRefreshing = false; 
        this.searchTimeout = null; 

        this.markdownIt = null;
        this.descriptionEditor = null;
        this.noteEditor = null;
        this.notePopupEditor = null;
        this.descriptionPopupEditor = null;
        this.csrfToken = null;
        this.userPreferences = {};

        this.init();
    }

    async init() {
        this.applyTheme();
        this.setupEventListeners();
        this.initMarkdown();

        document.getElementById('loadingScreen').style.display = 'flex';

        await this.checkAuthentication();

        document.getElementById('loadingScreen').style.display = 'none';

        if (this.currentUser) {
            await this.loadUserPreferences();
            this.updateNavigationVisibility();
            this.startAutoRefresh();
            
            const urlParams = new URLSearchParams(window.location.search);
            const taskId = urlParams.get('task');
            const clientId = urlParams.get('client');
            
            if (clientId) {
                this.pendingClientId = clientId;
                console.log('Client ID from URL:', clientId);
            }
            
            if (taskId) {
                await this.loadBoardData();
                await this.openTaskFromUrl(taskId);
            }
        }
    }

    async apiCall(endpoint, method = 'GET', data = null, queryParams = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
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

            let result;
            try {
                result = JSON.parse(responseText);
            } catch (e) {
                console.error('Failed to parse JSON response:', responseText);
                throw new Error('Invalid JSON response from server');
            }

            if (!response.ok) {
                throw new Error(result.error || 'API request failed');
            }

            return result;
        } catch (error) {
            console.error('API Error:', error);
            this.showNotification('Error: ' + error.message, 'error');
            throw error;
        }
    }

    async silentApiCall(endpoint, method = 'GET', data = null, queryParams = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };

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
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'API request failed');
            }

            return result;
        } catch (error) {
            console.error('Silent API Error:', error);
            throw error;
        }
    }

    async uploadFile(endpoint, formData) {
        try {
            const response = await fetch(this.apiBase + endpoint, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Upload failed');
            }

            return result;
        } catch (error) {
            console.error('Upload Error:', error);
            this.showNotification('Error: ' + error.message, 'error');
            throw error;
        }
    }

    async checkAuthentication() {
        try {
            const response = await this.apiCall('check-auth');
            if (response.authenticated) {
                this.currentUser = response.user;
                this.showApp();
                await this.loadBoardData();
                this.checkDueTasks();
                this.applyTheme();
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('Auth check failed:', error);
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

        if (this.currentUser) {
            const userNameElements = document.querySelectorAll('#currentUserName, #userDropdownName, #mobileUserName');
            userNameElements.forEach(element => {
                element.textContent = this.currentUser.name;
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            this.showLoading();
            const response = await this.apiCall('login', 'POST', {
                email: formData.get('email'),
                password: formData.get('password')
            });

            // Check if 2FA is required
            if (response.requires_2fa) {
                this.hideLoading();
                this.show2FAVerification(response.temp_user_id, formData.get('email'));
                return;
            }

            this.currentUser = response.user;
            this.csrfToken = response.csrf_token;
            
            window.location.href = '/';
        } catch (error) {
            this.showNotification('Login failed: ' + error.message, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async handleRegister(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            this.showLoading();
            const response = await this.apiCall('register', 'POST', {
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password')
            });

            this.currentUser = response.user;
            this.csrfToken = response.csrf_token;
            
            this.showNotification('Registration successful! Welcome to The Cache.', 'success');
            this.showApp();
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('Registration failed: ' + (error.message || 'Unknown error'), 'error');
        } finally {
            this.hideLoading();
        }
    }

    showRegisterForm() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'block';
    }

    showLoginForm() {
        document.getElementById('registerForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        this.hide2FAForm();
    }

    show2FAVerification(tempUserId, email) {
        this.tempUserId = tempUserId;
        this.tempEmail = email;
        
        // Hide login forms
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('registerForm').style.display = 'none';
        
        // Show 2FA form
        let twoFAForm = document.getElementById('twoFAForm');
        if (!twoFAForm) {
            this.create2FAForm();
            twoFAForm = document.getElementById('twoFAForm');
        }
        
        twoFAForm.style.display = 'block';
        document.getElementById('twofa-email').textContent = email;
        document.getElementById('totpCode').value = '';
        document.getElementById('totpCode').focus();
    }

    hide2FAForm() {
        const twoFAForm = document.getElementById('twoFAForm');
        if (twoFAForm) {
            twoFAForm.style.display = 'none';
        }
    }

    create2FAForm() {
        const authContainer = document.querySelector('.auth-forms');
        if (!authContainer) return;

        const twoFAFormHTML = `
            <div id="twoFAForm" class="auth-form" style="display: none;">
                <div class="auth-header">
                    <h2><i class="fas fa-mobile-alt"></i> Two-Factor Authentication</h2>
                    <p>Enter the 6-digit code from your authenticator app</p>
                    <div class="user-info">
                        <i class="fas fa-user"></i>
                        <span id="twofa-email"></span>
                    </div>
                </div>
                
                <form id="twoFAVerifyForm">
                    <div class="form-group">
                        <input type="text" 
                               id="totpCode" 
                               name="totpCode" 
                               placeholder="000000" 
                               maxlength="6" 
                               pattern="[0-9]{6}"
                               autocomplete="off"
                               style="text-align: center; font-size: 1.5rem; letter-spacing: 0.5rem; font-family: monospace;"
                               required>
                        <i class="fas fa-key"></i>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block">
                        <i class="fas fa-check"></i>
                        Verify Code
                    </button>
                </form>

                <div class="auth-alternatives">
                    <button type="button" class="btn-link" onclick="app.showBackupCodeForm()">
                        <i class="fas fa-key"></i>
                        Use backup code instead
                    </button>
                    <button type="button" class="btn-link" onclick="app.cancelTwoFA()">
                        <i class="fas fa-arrow-left"></i>
                        Back to login
                    </button>
                </div>
            </div>

            <div id="backupCodeForm" class="auth-form" style="display: none;">
                <div class="auth-header">
                    <h2><i class="fas fa-key"></i> Use Backup Code</h2>
                    <p>Enter one of your 8-character backup codes</p>
                    <div class="user-info">
                        <i class="fas fa-user"></i>
                        <span id="backup-email"></span>
                    </div>
                </div>
                
                <form id="backupCodeVerifyForm">
                    <div class="form-group">
                        <input type="text" 
                               id="backupCode" 
                               name="backupCode" 
                               placeholder="XXXXXXXX" 
                               maxlength="8" 
                               autocomplete="off"
                               style="text-align: center; font-size: 1.25rem; letter-spacing: 0.25rem; font-family: monospace; text-transform: uppercase;"
                               required>
                        <i class="fas fa-shield-alt"></i>
                    </div>
                    
                    <button type="submit" class="btn btn-primary btn-block">
                        <i class="fas fa-check"></i>
                        Verify Backup Code
                    </button>
                </form>

                <div class="auth-alternatives">
                    <button type="button" class="btn-link" onclick="app.show2FAVerification(app.tempUserId, app.tempEmail)">
                        <i class="fas fa-mobile-alt"></i>
                        Use authenticator app instead
                    </button>
                    <button type="button" class="btn-link" onclick="app.cancelTwoFA()">
                        <i class="fas fa-arrow-left"></i>
                        Back to login
                    </button>
                </div>
            </div>
        `;

        authContainer.insertAdjacentHTML('beforeend', twoFAFormHTML);

        // Add event listeners
        document.getElementById('twoFAVerifyForm').addEventListener('submit', (e) => this.handleTwoFAVerification(e));
        document.getElementById('backupCodeVerifyForm').addEventListener('submit', (e) => this.handleBackupCodeVerification(e));
        
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
        document.getElementById('backup-email').textContent = this.tempEmail;
        document.getElementById('backupCode').value = '';
        document.getElementById('backupCode').focus();
    }

    cancelTwoFA() {
        this.hide2FAForm();
        document.getElementById('backupCodeForm').style.display = 'none';
        document.getElementById('loginForm').style.display = 'block';
        this.tempUserId = null;
        this.tempEmail = null;
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
            this.showLoading();
            const response = await this.apiCall('2fa-verify', 'POST', {
                totp_code: totpCode,
                temp_user_id: this.tempUserId
            });

            this.currentUser = response.user;
            this.csrfToken = response.csrf_token;
            
            this.showNotification('Login successful!', 'success');
            window.location.href = '/';
        } catch (error) {
            this.showNotification('Verification failed: ' + error.message, 'error');
            document.getElementById('totpCode').value = '';
            document.getElementById('totpCode').focus();
        } finally {
            this.hideLoading();
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
            this.showLoading();
            const response = await this.apiCall('2fa-backup', 'POST', {
                backup_code: backupCode,
                temp_user_id: this.tempUserId
            });

            this.currentUser = response.user;
            this.csrfToken = response.csrf_token;
            
            this.showNotification(`Login successful! You have ${response.remaining_codes} backup codes remaining.`, 'success');
            window.location.href = '/';
        } catch (error) {
            this.showNotification('Backup code verification failed: ' + error.message, 'error');
            document.getElementById('backupCode').value = '';
            document.getElementById('backupCode').focus();
        } finally {
            this.hideLoading();
        }
    }

    async handleLogout() {
        try {
            await this.apiCall('logout', 'POST');
            this.currentUser = null;
            this.csrfToken = null;
            this.data = {
                company: null,
                boards: [],
                currentBoard: null,
                stages: [],
                tasks: [],
                users: [],
                clients: []
            };
            this.showLogin();
            this.showNotification('Logged out successfully!', 'success');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    async loadBoardData() {
        try {
            console.log('Starting loadBoardData...');
            this.showLoading();

            if (!this.data.currentBoard) {
                const [companyData, boardsData, usersData, clientsData] = await Promise.all([
                    this.apiCall('company'),
                    this.apiCall('boards'),
                    this.apiCall('users'),
                    this.apiCall('clients')
                ]);

                this.data.company = companyData;
                this.data.boards = boardsData || [];
                this.data.stages = [];
                this.data.tasks = [];
                this.data.users = usersData || [];
                this.data.clients = clientsData || [];

                if (this.data.boards.length > 0) {
                    const savedBoardId = localStorage.getItem('kanban-current-board');
                    if (savedBoardId) {
                        const savedBoard = this.data.boards.find(b => b.id == parseInt(savedBoardId));
                        if (savedBoard) {
                            this.data.currentBoard = savedBoard;
                            console.log('Loaded saved board:', savedBoard.name);
                        } else {
                            console.log('Saved board not found, will use default');
                        }
                    }

                    if (!this.data.currentBoard) {
                        this.data.currentBoard = this.data.boards[0];
                        this.saveBoardSelection(this.data.currentBoard.id);
                        console.log('Using default board:', this.data.currentBoard.name);
                    }
                } else {
                    console.warn('No boards found');
                    this.showNotification('No boards available. Please create a board first.', 'warning');
                }

                this.populateBoardSelector();
                
                if (this.data.currentBoard) {
                    console.log('Loading data for current board:', this.data.currentBoard.name);
                    await this.loadCurrentBoardData();
                } else {
                    console.log('No current board, rendering empty board');
                    this.renderBoard();
                }
                return;
            }

            const [companyData, boardsData, boardData, tasksData, usersData, clientsData] = await Promise.all([
                this.apiCall('company'),
                this.apiCall('boards'),
                this.apiCall('board', 'GET', null, { board_id: this.data.currentBoard.id }),
                this.apiCall('tasks'), // Load all tasks for the user
                this.apiCall('users'),
                this.apiCall('clients')
            ]);

            this.data.company = companyData;
            this.data.boards = boardsData || [];
            this.data.board = boardData.board;
            this.data.stages = boardData.stages || [];
            this.data.tasks = tasksData || []; // Use all tasks instead of just board tasks
            this.data.users = usersData || [];
            this.data.clients = clientsData || [];

            this.populateBoardSelector();
            this.renderBoard();
            this.populateSelectOptions();
            this.checkDueTasks();
            console.log('Completed loadBoardData for existing board');
        } catch (error) {
            console.error('Error loading board data:', error);
            this.showNotification('Error loading board data', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async openTaskFromUrl(taskId) {
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const task = this.data.tasks.find(t => t.id == taskId);
            if (task) {
                this.showTaskModal(taskId);
                this.showNotification(`Opened task: ${task.title}`, 'success');
            } else {
                try {
                    const taskData = await this.apiCall(`tasks&id=${taskId}`);
                    if (taskData) {
                        this.showTaskModal(taskId);
                        this.showNotification(`Opened task: ${taskData.title}`, 'success');
                    } else {
                        this.showNotification('Task not found', 'error');
                    }
                } catch (error) {
                    console.error('Error loading task:', error);
                    this.showNotification('Task not found or access denied', 'error');
                }
            }
        } catch (error) {
            console.error('Error opening task from URL:', error);
            this.showNotification('Error opening task', 'error');
        }
    }

    async loadCurrentBoardData() {
        try {
            const [boardData, usersData, clientsData] = await Promise.all([
                this.apiCall('board', 'GET', null, { board_id: this.data.currentBoard.id }),
                this.apiCall('users'),
                this.apiCall('clients')
            ]);

            this.data.board = boardData.board;
            this.data.stages = boardData.stages || [];
            this.data.tasks = boardData.tasks || [];
            this.data.users = usersData || [];
            this.data.clients = clientsData || [];

            this.renderBoard();
            this.populateSelectOptions();
            this.checkDueTasks();
            
            const companyNameElement = document.getElementById('companyName');
            if (companyNameElement && this.data.currentBoard) {
                companyNameElement.textContent = this.data.currentBoard.name;
            }
            
            console.log('Loaded board data for:', this.data.currentBoard.name);
        } catch (error) {
            console.error('Error loading current board data:', error);
            this.showNotification('Error loading board data', 'error');
        }
    }

    renderBoard() {
        const kanbanBoard = document.getElementById('kanbanBoard');
        kanbanBoard.innerHTML = '';

        this.data.stages.forEach(stage => {
            const stageElement = this.createStageElement(stage);
            kanbanBoard.appendChild(stageElement);
        });

        this.populateSelectOptions();
    }

    async checkDueTasks() {
        try {
            const response = await this.apiCall('due-tasks');
            if (response.tasks && response.tasks.length > 0) {
                const warningDiv = document.getElementById('dueDateWarning');
                if (warningDiv) {
                    warningDiv.style.display = 'block';

                    setTimeout(() => {
                        if (warningDiv) {
                            warningDiv.style.display = 'none';
                        }
                    }, 5000);
                }
            }
        } catch (error) {
            console.error('Failed to check due tasks:', error);
        }
    }

    createStageElement(stage) {
        const stageTasks = this.data.tasks.filter(task => 
            task.stage_id == stage.id && 
            task.board_id == this.data.currentBoard.id
        );
        const activeTasks = stageTasks.filter(task => task.is_completed != 1);
        const completedTasks = stageTasks.filter(task => task.is_completed == 1);
        const totalTasks = stageTasks.length;
        const completedCount = completedTasks.length;

        const stageDiv = document.createElement('div');
        stageDiv.className = 'stage';
        stageDiv.dataset.stageId = stage.id;

        stageDiv.innerHTML = `
            <div class="stage-header" style="border-left: 4px solid ${stage.color}" 
                 draggable="true" 
                 ondragstart="app.handleStageDragStart(event)" 
                 data-stage-id="${stage.id}">
                <div class="stage-title">
                    <span class="stage-color" style="background: ${stage.color}"></span>
                    ${stage.name}
                    <span class="stage-count">${totalTasks}</span>
                    ${completedCount > 0 ? `<span class="stage-completed-count">${completedCount} </span>` : ''}
                </div>
                <div class="stage-actions">
                    <button class="btn-icon" onclick="app.addTaskToStage(${stage.id})" title="Add Task to ${stage.name}">
                        <i class="fas fa-plus"></i>
                    </button>
                    <button class="btn-icon" onclick="app.deleteStage(${stage.id})" title="Delete Stage">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="tasks-container" ondrop="app.handleDrop(event)" ondragover="app.handleDragOver(event)">
                ${activeTasks.map(task => this.createTaskElement(task)).join('')}
            </div>
            ${completedCount > 0 ? `
                <div class="completed-tasks-section">
                    <div class="completed-tasks-header" onclick="app.toggleCompletedTasks(${stage.id})">
                        <i class="fas fa-chevron-down"></i>
                        <span>Completed (${completedCount})</span>
                    </div>
                    <div class="completed-tasks-container" id="completed-${stage.id}" style="display: none;">
                        ${completedTasks.map(task => this.createTaskElement(task)).join('')}
                    </div>
                </div>
            ` : ''}
        `;

        stageDiv.ondragover = (e) => this.handleStageDragOver(e);
        stageDiv.ondrop = (e) => this.handleStageDrop(e);

        return stageDiv;
    }

    initMarkdown() {

        if (typeof window.markdownit !== 'undefined') {
            this.markdownIt = window.markdownit({
                html: true,
                linkify: true,
                typographer: true,
                breaks: true
            });

            try {
                if (window.markdownitEmoji) {
                    this.markdownIt.use(window.markdownitEmoji, { shortcuts: {} });
                }
                if (window.markdownitTaskLists) {
                    this.markdownIt.use(window.markdownitTaskLists, { enabled: true });
                }

                this.markdownIt.use(this.highlightPlugin);
            } catch (error) {
                console.warn('Some markdown plugins failed to load:', error);

            }
        }
    }

    highlightPlugin(md) {
        const defaultRender = md.renderer.rules.fence || function(tokens, idx, options, env, self) {
            return self.renderToken(tokens, idx, options);
        };

        md.renderer.rules.fence = function (tokens, idx, options, env, self) {
            const token = tokens[idx];
            const code = token.content;
            const lang = token.info;

            if (lang && window.Prism && window.Prism.languages && window.Prism.languages[lang]) {
                try {
                    const highlighted = window.Prism.highlight(code, window.Prism.languages[lang], lang);
                    return `<pre class="language-${lang}"><code class="language-${lang}">${highlighted}</code></pre>`;
                } catch (err) {
                    console.warn('Prism highlighting failed:', err);
                }
            }

            return defaultRender(tokens, idx, options, env, self);
        };
    }

    renderMarkdown(text) {
        if (!text || !this.markdownIt) return text;
        return this.markdownIt.render(text);
    }

    getCurrentTaskId() {
        const taskIdInput = document.getElementById('taskId');
        return taskIdInput ? taskIdInput.value : null;
    }

    renderTruncatedDescription(text) {
        if (!text) return '';

        const plainText = text.replace(/[#*`\[\]()]/g, '').replace(/\n/g, ' ');

        if (plainText.length <= 100) {

            return this.renderMarkdown(text);
        }

        let truncated = plainText.substring(0, 100);
        const lastSpace = truncated.lastIndexOf(' ');
        if (lastSpace > 80) { 
            truncated = truncated.substring(0, lastSpace);
        }

        const descriptionId = 'desc_' + Math.random().toString(36).substr(2, 9);

        const encodedDescription = encodeURIComponent(text);

        return `
            <div class="description-preview">
                ${this.renderMarkdown(truncated + '...')}
                <button class="read-more-btn" data-description="${encodedDescription}">
                    Read More
                </button>
            </div>
        `;
    }

    showFullDescription(description) {

        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.style.zIndex = '10000';

        modal.innerHTML = `
            <div class="modal-content small">
                <div class="modal-header">
                    <h2>Full Description</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="full-description markdown-content">
                        ${this.renderMarkdown(description)}
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    initTaskDescriptionEditor() {
        const descriptionTextarea = document.getElementById('taskDescription');
        if (!descriptionTextarea || typeof SimpleMDE === 'undefined') return;

        if (this.descriptionEditor) {
            this.descriptionEditor.toTextArea();
            this.descriptionEditor = null;
        }

        this.descriptionEditor = new SimpleMDE({
            element: descriptionTextarea,
            spellChecker: false,
            autofocus: false,
            placeholder: 'Describe your task... Use markdown for formatting!',
            toolbar: [
                'bold', 'italic', 'heading', '|',
                'quote', 'unordered-list', 'ordered-list', '|',
                'link', 'image', '|',
                'code', 'table', '|',
                'preview', 'side-by-side', 'fullscreen'
            ],
            status: ['lines', 'words', 'cursor'],
            theme: 'dark'
        });

        const editorElement = this.descriptionEditor.codemirror.getWrapperElement();
        editorElement.classList.add('markdown-editor');
    }

    initNoteEditor() {
        const noteTextarea = document.getElementById('newNoteText');
        if (!noteTextarea || typeof SimpleMDE === 'undefined') return;

        if (this.noteEditor) {
            this.noteEditor.toTextArea();
            this.noteEditor = null;
        }

        this.noteEditor = new SimpleMDE({
            element: noteTextarea,
            spellChecker: false,
            autofocus: false,
            placeholder: 'Add a note... Use markdown for formatting!',
            toolbar: [
                'bold', 'italic', 'heading', '|',
                'quote', 'unordered-list', 'ordered-list', '|',
                'link', 'image', '|',
                'preview', 'side-by-side'
            ],
            status: ['lines', 'words'],
            theme: 'dark'
        });

        const editorElement = this.noteEditor.codemirror.getWrapperElement();
        editorElement.classList.add('markdown-editor');
    }

    initNotePopupEditor() {
        const noteTextarea = document.getElementById('noteEditorText');
        if (!noteTextarea || typeof SimpleMDE === 'undefined') return;

        if (this.notePopupEditor) {
            this.notePopupEditor.toTextArea();
            this.notePopupEditor = null;
        }

        this.notePopupEditor = new SimpleMDE({
            element: noteTextarea,
            spellChecker: false,
            autofocus: true,
            placeholder: 'Write your note here... Use markdown for formatting!',
            toolbar: [
                'bold', 'italic', 'heading', '|',
                'quote', 'unordered-list', 'ordered-list', '|',
                'link', 'image', '|',
                'preview', 'side-by-side'
            ],
            status: ['lines', 'words'],
            theme: 'dark'
        });

        const editorElement = this.notePopupEditor.codemirror.getWrapperElement();
        editorElement.classList.add('markdown-editor');
    }

    initDescriptionPopupEditor() {
        const descriptionTextarea = document.getElementById('descriptionEditorText');
        if (!descriptionTextarea || typeof SimpleMDE === 'undefined') return;

        if (this.descriptionPopupEditor) {
            this.descriptionPopupEditor.toTextArea();
            this.descriptionPopupEditor = null;
        }

        this.descriptionPopupEditor = new SimpleMDE({
            element: descriptionTextarea,
            spellChecker: false,
            autofocus: true,
            placeholder: 'Describe your task... Use markdown for formatting!',
            toolbar: [
                'bold', 'italic', 'heading', '|',
                'quote', 'unordered-list', 'ordered-list', '|',
                'link', 'image', '|',
                'code', 'table', '|',
                'preview', 'side-by-side', 'fullscreen'
            ],
            status: ['lines', 'words', 'cursor'],
            theme: 'dark'
        });

        const editorElement =         this.descriptionPopupEditor.codemirror.getWrapperElement();
        editorElement.classList.add('markdown-editor');
    }

    showNoteEditorModal(taskId) {
        document.getElementById('noteTaskId').value = taskId;
        this.initNotePopupEditor();
        this.showModal('noteEditorModal');
    }

    showDescriptionEditorModal(taskId, currentDescription = '') {
        document.getElementById('descriptionTaskId').value = taskId;
        
        // Add default content for new tasks if description is empty
        let descriptionContent = currentDescription;
        if (!descriptionContent && taskId === 'new') {
            const today = new Date();
            const formattedDate = today.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            descriptionContent = `Client Name: 
                                Date: ${formattedDate}
                                What they Need: `;
        }
        
        if (this.descriptionPopupEditor) {
            this.descriptionPopupEditor.value(descriptionContent);
        } else {
            document.getElementById('descriptionEditorText').value = descriptionContent;
        }
        this.initDescriptionPopupEditor();
        this.showModal('descriptionEditorModal');
    }

    createTaskElement(task) {
        const hasNotes = task.notes && task.notes.trim() !== '';
        const hasAttachments = task.attachment_count > 0;
        const hasChecklist = task.checklist_total > 0;
        const checklistProgress = hasChecklist ? Math.round((task.checklist_completed / task.checklist_total) * 100) : 0;
        const isCompleted = task.is_completed == 1;

        let attachments = [];
        if (task.attachments && task.attachments.trim() !== '') {
            attachments = task.attachments.split('|').map(attachment => {
                const parts = attachment.split(':');
                if (parts.length === 3) {
                    return {
                        id: parts[0],
                        original_name: parts[1],
                        filename: parts[2]
                    };
                }
                return null;
            }).filter(Boolean);
        }

        const today = new Date();
        const dueDate = task.due_date ? new Date(task.due_date) : null;

        let dueDateClass = '';
        let dueDateText = '';
        let statusBanner = '';

        if (dueDate && !isCompleted) {
            const timeDiff = dueDate.getTime() - today.getTime();
            const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

            if (daysDiff < 0) {
                dueDateClass = 'overdue';
                dueDateText = `Due ${Math.abs(daysDiff)} days ago`;
                statusBanner = '<div class="task-status-banner overdue">OVERDUE</div>';
            } else if (daysDiff <= 1) {
                dueDateClass = 'due-soon';
                dueDateText = daysDiff === 0 ? 'Due today' : 'Due tomorrow';
                statusBanner = '<div class="task-status-banner due-soon">DUE SOON</div>';
            } else {
                dueDateText = `Due in ${daysDiff} days`;
            }
        }

        const cardStyle = task.card_color && task.card_color !== '#1a202c' 
            ? `style="border-left: 4px solid ${task.card_color};"` 
            : '';

        const priorityClass = `priority-${task.priority || 'medium'}`;
        const completedClass = isCompleted ? 'completed' : '';
        const completionIcon = isCompleted ? 'fas fa-check-circle' : 'far fa-circle';

        return `
            <div class="task-card ${priorityClass} ${completedClass}" draggable="true" data-task-id="${task.id}" 
                 ${cardStyle}
                 ondragstart="app.handleDragStart(event)" onclick="app.editTask(${task.id})">
                ${statusBanner}
                <div class="task-header">
                    <div class="task-title">${task.title}</div>
                </div>
                ${task.description ? `<div class="task-description markdown-content">${this.renderTruncatedDescription(task.description)}</div>` : ''}

                ${dueDate && !isCompleted ? `
                    <div class="task-dates">
                        <span class="task-date ${dueDateClass}">${dueDateText}</span>
                        ${task.due_time ? `<span class="task-time">Due Time:${task.due_time}</span>` : ''}
                    </div>
                ` : ''}

                ${hasChecklist ? `
                    <div class="task-checklist">
                        <div class="checklist-progress">${task.checklist_completed}/${task.checklist_total} completed</div>
                        <div class="checklist-bar">
                            <div class="checklist-progress-fill" style="width: ${checklistProgress}%"></div>
                        </div>
                    </div>
                ` : ''}

                ${isCompleted ? `
                    <div class="task-completion-info">
                        <i class="fas fa-check-circle"></i>
                        <span>${task.completed_at ? `Completed ${this.formatDate(task.completed_at)}` : 'Completed'}</span>
                    </div>
                ` : ''}

                <div class="task-meta">
                    ${task.user_name ? `<span class="task-assignee"><i class="fas fa-user"></i> ${task.user_name}</span>` : ''}
                    ${task.client_name ? `<span class="task-client" onclick="app.showClientTasks(${task.client_id}, '${task.client_name}'); event.stopPropagation();"><i class="fas fa-building"></i> ${task.client_name}</span>` : ''}
                    ${hasAttachments ? `
                        <div class="task-attachments">
                            <i class="fas fa-paperclip"></i>
                            ${attachments.map(att => `
                                <a href="uploads/${att.filename}" target="_blank" download="${att.original_name}" class="attachment-link-small">
                                    ${att.original_name}
                                </a>
                            `).join('')}
                        </div>
                    ` : ''}
                    ${hasNotes ? `<span class="task-notes"><i class="fas fa-sticky-note"></i> Notes</span>` : ''}
                </div>
                
                <div class="task-actions-bottom">
                    <button class="btn-icon completion-btn" onclick="app.toggleTaskCompletion(${task.id}); event.stopPropagation();" title="${isCompleted ? 'Mark as incomplete' : 'Mark as complete'}">
                        <i class="${completionIcon}"></i>
                    </button>
                    <button class="btn-icon" onclick="app.showShareTaskModal(${task.id}); event.stopPropagation();" title="Share Task">
                        <i class="fas fa-share"></i>
                    </button>
                    <button class="btn-icon" onclick="app.deleteTask(${task.id}); event.stopPropagation();" title="Delete Task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    populateSelectOptions() {
        const userSelect = document.getElementById('taskAssignee');
        if (userSelect) {
            userSelect.innerHTML = '<option value="">Unassigned</option>';
            if (this.data.users && this.data.users.length > 0) {
                this.data.users.forEach(user => {
                    if (user.is_active !== false) { 
                        const option = document.createElement('option');
                        option.value = user.id;
                        option.textContent = user.name || user.full_name || user.email || 'Unknown User';
                        userSelect.appendChild(option);
                    }
                });
            }
        }

        const clientSelect = document.getElementById('taskClient');
        if (clientSelect) {
            clientSelect.innerHTML = '<option value="">No Client</option>';
            if (this.data.clients && this.data.clients.length > 0) {
                this.data.clients.forEach(client => {
                    const option = document.createElement('option');
                    option.value = client.id;
                    option.textContent = client.name;
                    clientSelect.appendChild(option);
                });
            }
        }

        const stageSelect = document.getElementById('taskStage');
        if (stageSelect && stageSelect.children.length === 0) {
            stageSelect.innerHTML = '<option value="">Select Stage</option>';
        }

        const boardSelect = document.getElementById('taskBoard');
        if (boardSelect) {
            boardSelect.innerHTML = '<option value="">Select Board</option>';
            if (this.data.boards && this.data.boards.length > 0) {
                this.data.boards.forEach(board => {
                    const option = document.createElement('option');
                    option.value = board.id;
                    option.textContent = board.name;
                    boardSelect.appendChild(option);
                });
            }
        }
    }

    setupEventListeners() {

        document.getElementById('loginForm').addEventListener('submit', (e) => this.handleLogin(e));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleRegister(e));
        document.getElementById('showRegisterForm').addEventListener('click', (e) => this.showRegisterForm());
        document.getElementById('showLoginForm').addEventListener('click', (e) => this.showLoginForm());

        document.getElementById('logoutBtn').addEventListener('click', (e) => this.handleLogout());

        document.getElementById('companyForm').addEventListener('submit', (e) => this.handleCompanySubmit(e));

        document.getElementById('addStageBtn').addEventListener('click', (e) => this.showStageModal());
        document.getElementById('stageForm').addEventListener('submit', (e) => this.handleStageSubmit(e));

        document.getElementById('addTaskBtn').addEventListener('click', (e) => this.showTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskSubmit(e));
        
        document.getElementById('quickAddBtn').addEventListener('click', (e) => this.showQuickAddModal());
        document.getElementById('quickAddForm').addEventListener('submit', (e) => this.handleQuickAddSubmit(e));

        document.getElementById('manageUsersBtn').addEventListener('click', (e) => this.showUsersModal());
        document.getElementById('userForm').addEventListener('submit', (e) => this.addUser(e));
        document.getElementById('passwordForm').addEventListener('submit', (e) => this.handlePasswordChange(e));

        document.querySelectorAll('.user-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('data-tab');
                this.switchUserTab(tabName);
            });
        });

        document.getElementById('manageClientsBtn').addEventListener('click', (e) => this.showClientsModal());
        document.getElementById('addClientBtn').addEventListener('click', (e) => this.showAddClientModal());
        document.getElementById('clientForm').addEventListener('submit', (e) => this.addClient(e));
        document.getElementById('clientSearchInput').addEventListener('input', (e) => this.filterClients(e.target.value));
        document.getElementById('clientSearchClear').addEventListener('click', (e) => this.clearClientSearch());
        document.getElementById('searchInput').addEventListener('input', (e) => this.setupSearch());
        document.getElementById('searchClear').addEventListener('click', (e) => this.hideSearchModal());
        document.getElementById('mobileSearchInput').addEventListener('input', (e) => this.setupSearch());
        document.getElementById('mobileSearchClear').addEventListener('click', (e) => this.hideSearchModal());

        document.getElementById('notificationsBtn').addEventListener('click', (e) => this.showNotificationsModal());

        document.getElementById('boardSelector').addEventListener('change', (e) => this.switchBoard(e.target.value));
        document.getElementById('manageBoardsBtn').addEventListener('click', (e) => this.showBoardsModal());
        document.getElementById('boardForm').addEventListener('submit', (e) => this.handleBoardSubmit(e));

        document.getElementById('noteEditorForm').addEventListener('submit', (e) => this.handleNoteSubmit(e));
        document.getElementById('descriptionEditorForm').addEventListener('submit', (e) => this.handleDescriptionSubmit(e));

        document.getElementById('addNoteBtn').addEventListener('click', (e) => {
            e.preventDefault();
            const taskId = document.getElementById('taskId').value;
            this.showNoteEditorModal(taskId || 'new');
        });

        document.getElementById('addDetailedNoteBtn').addEventListener('click', (e) => {
            e.preventDefault();
            const taskId = document.getElementById('taskId').value;
            if (taskId && taskId !== 'new') {
                window.open(`notes.html?task=${taskId}`, '_blank');
            } else {
                this.showNotification('Please save the task first before creating a detailed note', 'info');
            }
        });

        document.getElementById('editDescriptionBtn').addEventListener('click', (e) => {
            e.preventDefault();
            const taskId = document.getElementById('taskId').value;
            const currentDescription = document.getElementById('taskDescription').value;
            this.showDescriptionEditorModal(taskId || 'new', currentDescription);
        });

        this.setupDropdowns();

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('close') || 
                (e.target.classList.contains('btn-secondary') && e.target.hasAttribute('data-modal'))) {
                e.preventDefault();
                e.stopPropagation();
                const modalId = e.target.getAttribute('data-modal');
                if (modalId) {
                    this.hideModal(modalId);
                }
            }
        });

        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                this.hideModal(e.target.id);
            }
        });

        this.startAutoRefresh();

        document.getElementById('mobileMenuBtn').addEventListener('click', (e) => {
            e.stopPropagation();
            const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
            mobileMenuOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; 
        });

        document.getElementById('mobileMenuClose').addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeMobileMenu();
        });

        document.getElementById('mobileMenuOverlay').addEventListener('click', (e) => {
            if (e.target.id === 'mobileMenuOverlay') {
                this.closeMobileMenu();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeMobileMenu();
            }
        });

        document.getElementById('mobileBoardSelector').addEventListener('change', (e) => {
            this.switchBoard(e.target.value);
            this.closeMobileMenu();
        });

        document.getElementById('mobileManageBoardsBtn').addEventListener('click', (e) => {
            this.showBoardsModal();
            this.closeMobileMenu();
        });

        document.getElementById('mobileAddStageBtn').addEventListener('click', (e) => {
            this.showStageModal();
            this.closeMobileMenu();
        });

        document.getElementById('mobileAddTaskBtn').addEventListener('click', (e) => {
            this.showTaskModal();
            this.closeMobileMenu();
        });

        document.getElementById('mobileManageUsersBtn').addEventListener('click', (e) => {
            this.showUsersModal();
            this.closeMobileMenu();
        });

        document.getElementById('mobileManageClientsBtn').addEventListener('click', (e) => {
            this.showClientsModal();
            this.closeMobileMenu();
        });

        document.getElementById('mobileNotificationsBtn').addEventListener('click', (e) => {
            this.showNotificationsModal();
            this.closeMobileMenu();
        });

        document.getElementById('mobileLogoutBtn').addEventListener('click', (e) => {
            this.handleLogout();
            this.closeMobileMenu();
        });

        document.getElementById('mobileSendDueNotificationsBtn').addEventListener('click', (e) => {
            this.sendDueNotifications();
            this.closeMobileMenu();
        });

        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('read-more-btn')) {
                e.preventDefault();
                const encodedDescription = e.target.getAttribute('data-description');
                if (encodedDescription) {
                    const description = decodeURIComponent(encodedDescription);
                    this.showFullDescription(description);
                }
            }
        });

        const boardSelect = document.getElementById('taskBoard');
        if (boardSelect) {
            boardSelect.addEventListener('change', (e) => this.handleBoardChange(e));
        }
        
        const userSelect = document.getElementById('taskAssignee');
        if (userSelect) {
            userSelect.addEventListener('change', (e) => this.handleUserChange(e));
        }
    }

    setupDropdowns() {
        const managementDropdown = document.getElementById('managementDropdown');
        const managementMenu = document.getElementById('managementMenu');

        managementDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            managementDropdown.parentElement.classList.toggle('active');
        });

        const userDropdown = document.getElementById('userDropdown');
        const userMenu = document.getElementById('userMenu');

        userDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdown.parentElement.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.dropdown').forEach(dropdown => {
                    dropdown.classList.remove('active');
                });
            }
        });
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }

    handleCloseButton(e) {
        e.preventDefault();
        e.stopPropagation();
        const modalId = e.target.dataset.modal || e.target.closest('.modal').id;
        if (modalId) {
            this.hideModal(modalId);
        }
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('show');

        const modal = document.getElementById(modalId);
        const forms = modal.querySelectorAll('form');
        forms.forEach(form => form.reset());

        const hiddenInputs = modal.querySelectorAll('input[type="hidden"]');
        hiddenInputs.forEach(input => input.value = '');

        if (modalId === 'taskModal') {
            this.clearTaskModal();
            
            const boardSelect = document.getElementById('taskBoard');
            const userSelect = document.getElementById('taskAssignee');
            
            if (boardSelect) {
                boardSelect.removeAttribute('data-listener-attached');
            }
            
            if (userSelect) {
                userSelect.removeAttribute('data-listener-attached');
            }
        }
    }

    clearTaskModal() {
        document.getElementById('attachmentsList').innerHTML = '';
        document.getElementById('checklistContainer').innerHTML = '';
        this.addChecklistItem();

        const fileInput = document.getElementById('taskAttachments');
        if (fileInput) {
            fileInput.value = '';
        }

        document.getElementById('notesList').innerHTML = '';
        
        const noteTextarea = document.getElementById('newNoteText');
        if (noteTextarea) {
            noteTextarea.value = '';
        }

        const callRadio = document.querySelector('input[name="noteType"][value="call"]');
        if (callRadio) {
            callRadio.checked = true;
        }
        
        const boardSelect = document.getElementById('taskBoard');
        if (boardSelect) {
            boardSelect.innerHTML = '<option value="">Select Board</option>';
        }
        
        const stageSelect = document.getElementById('taskStage');
        if (stageSelect) {
            stageSelect.innerHTML = '<option value="">Select Stage</option>';
        }
        
        if (this.pendingClientId) {
            const clientSelect = document.getElementById('taskClient');
            if (clientSelect) {
                clientSelect.value = this.pendingClientId;
                console.log('Set client ID from URL in clearTaskModal:', this.pendingClientId);
            }
        }
        
        // Reset color picker to default
        const colorInput = document.getElementById('taskCardColor');
        const colorContainer = document.querySelector('.color-picker-container');
        if (colorInput) {
            colorInput.value = '#1a202c';
        }
        if (colorContainer) {
            colorContainer.setAttribute('data-color', '#1a202c');
        }
    }

    showCompanyModal() {
        document.getElementById('companyName').value = this.data.company.name || '';
        document.getElementById('companyContactName').value = this.data.company.contact_name || '';
        document.getElementById('companyContactNumber').value = this.data.company.contact_number || '';
        document.getElementById('companyEmail').value = this.data.company.email || '';
        document.getElementById('companyUrl').value = this.data.company.url || '';
        this.showModal('companyModal');
    }

    async handleCompanySubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            await this.apiCall('company', 'PUT', {
                name: formData.get('companyName'),
                contact_name: formData.get('companyContactName'),
                contact_number: formData.get('companyContactNumber'),
                email: formData.get('companyEmail'),
                url: formData.get('companyUrl')
            });

            this.data.company.name = formData.get('companyName');
            document.querySelector('.company-name').textContent = this.data.company.name;
            this.hideModal('companyModal');
            this.showNotification('Company updated successfully!', 'success');
        } catch (error) {
        }
    }

    showStageModal(stageId = null) {

        if (stageId) {
            const stage = this.data.stages.find(s => s.id == stageId);
            if (stage) {
                document.getElementById('stageId').value = stage.id;
                document.getElementById('stageName').value = stage.name;
                document.getElementById('stageColor').value = stage.color;
                document.getElementById('stageModalTitle').textContent = 'Edit Stage';
            }
        } else {
            document.getElementById('stageModalTitle').textContent = 'Add Stage';
        }

                    this.showModal('stageModal');
    }

    async handleStageSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const stageId = formData.get('stageId');

        const data = {
            name: formData.get('stageName'),
            color: formData.get('stageColor'),
            board_id: this.data.currentBoard ? this.data.currentBoard.id : null
        };

        try {
            if (stageId) {
                await this.apiCall(`stages&id=${stageId}`, 'PUT', data);
                this.showNotification('Stage updated successfully!', 'success');
            } else {
                await this.apiCall('stages', 'POST', data);
                this.showNotification('Stage created successfully!', 'success');
            }

            await this.loadBoardData();
            this.renderBoard();
            this.hideModal('stageModal');
        } catch (error) {
        }
    }

    async editStage(stageId) {
        this.showStageModal(stageId);
    }

    async deleteStage(stageId) {
        if (confirm('Are you sure you want to delete this stage? All tasks in this stage will be deleted.')) {
            try {
                await this.apiCall(`stages&id=${stageId}`, 'DELETE');
                await this.loadBoardData();
                this.renderBoard();
                this.showNotification('Stage deleted successfully!', 'success');
            } catch (error) {
            }
        }
    }

    addTaskToStage(stageId) {
        this.pendingStageId = stageId;
        
        this.showTaskModal();
        
        setTimeout(() => {
            const titleInput = document.getElementById('taskTitle');
            if (titleInput) {
                titleInput.focus();
            }
        }, 100);
    }

    showTaskModal(taskId = null) {
        if (taskId) {
            this.loadTaskForEdit(taskId);
        } else {
            this.clearTaskModal();
            
            if (this.pendingClientId) {
                const clientSelect = document.getElementById('taskClient');
                if (clientSelect) {
                    clientSelect.value = this.pendingClientId;
                    console.log('Set client ID from URL:', this.pendingClientId);
                }
            }
        }

        this.populateSelectOptions();

        if (this.pendingStageId) {
            const stageSelect = document.getElementById('taskStage');
            if (stageSelect) {
                stageSelect.value = this.pendingStageId;
                console.log('Set stage ID from pending:', this.pendingStageId);
                this.pendingStageId = null; // Clear after setting
            }
        }

        this.showModal('taskModal');
        
        const boardSelect = document.getElementById('taskBoard');
        const userSelect = document.getElementById('taskAssignee');
        
        if (boardSelect && !boardSelect.hasAttribute('data-listener-attached')) {
            boardSelect.addEventListener('change', (e) => this.handleBoardChange(e));
            boardSelect.setAttribute('data-listener-attached', 'true');
        }
        
        if (userSelect && !userSelect.hasAttribute('data-listener-attached')) {
            userSelect.addEventListener('change', (e) => this.handleUserChange(e));
            userSelect.setAttribute('data-listener-attached', 'true');
        }
        
        // Add color picker change listener
        const colorInput = document.getElementById('taskCardColor');
        const colorContainer = document.querySelector('.color-picker-container');
        if (colorInput && colorContainer && !colorInput.hasAttribute('data-listener-attached')) {
            colorInput.addEventListener('change', (e) => {
                colorContainer.setAttribute('data-color', e.target.value);
                console.log('Color changed to:', e.target.value);
            });
            colorInput.setAttribute('data-listener-attached', 'true');
        }
    }

    showQuickAddModal() {
        document.getElementById('quickAddForm').reset();
        
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(9, 0, 0, 0); 
        
        document.getElementById('quickTaskDueDate').value = tomorrow.toISOString().slice(0, 10);
        document.getElementById('quickTaskDueTime').value = '09:00';
        
        this.showModal('quickAddModal');
    }

    async handleQuickAddSubmit(e) {
        e.preventDefault();
        
        const title = document.getElementById('quickTaskTitle').value.trim();
        const description = document.getElementById('quickTaskDescription').value.trim();
        const dueDate = document.getElementById('quickTaskDueDate').value;
        const dueTime = document.getElementById('quickTaskDueTime').value;
        
        if (!title) {
            this.showNotification('Task title is required', 'error');
            return;
        }
        
            const boardSelector = document.getElementById('boardSelector');
            const boardId = boardSelector ? boardSelector.value : null;
            
            if (!boardId) {
                this.showNotification('Please select a board first', 'error');
                return;
            }
        
        try {
            const stages = await this.apiCall(`stages&board_id=${boardId}`);
            if (!stages || stages.length === 0) {
                this.showNotification('No stages available. Please create a stage first.', 'error');
                return;
            }
            
            const firstStageId = stages[0].id;
            
            console.log('Board selector value:', boardId);
            console.log('Current board data:', this.data.currentBoard);
            
            console.log('Due date from input:', dueDate);
            console.log('Due time from input:', dueTime);
            
            const taskData = {
                title: title,
                description: description,
                stage_id: firstStageId,
                user_id: this.getCurrentUserId(), // Set current user as owner
                due_date: dueDate || null,
                due_time: dueTime || null,
                board_id: boardId
            };
            
            const newTask = await this.apiCall('tasks', 'POST', taskData);
            
            this.hideModal('quickAddModal');
            this.showNotification('Task added successfully!', 'success');
            
            await this.loadBoardData();
            
        } catch (error) {
            console.error('Failed to add task:', error);
            this.showNotification('Failed to add task: ' + error.message, 'error');
        }
    }

    async loadTaskForEdit(taskId) {
        try {
            const task = await this.apiCall(`tasks&id=${taskId}`);

            let clientInfo = '';
            if (task.client_id) {
                try {
                    const client = await this.apiCall(`clients&id=${task.client_id}`);
                    if (client && client.name) {
                                            clientInfo = `
                        <div class="client-info">
                            <div class="client-name">${client.name}</div>
                            ${client.contact_name || client.contact_number ? `
                                <div class="client-contact">
                                    ${client.contact_name ? `<i class="fas fa-user"></i> ${client.contact_name}` : ''}
                                    ${client.contact_number ? ` - <i class="fas fa-phone"></i> ${client.contact_number}` : ''}
                                </div>
                            ` : ''}
                        </div>
                    `;
                    }
                } catch (error) {
                    console.error('Failed to load client data:', error);
                }
            }

            const modalHeader = document.querySelector('#taskModal .modal-header');
            modalHeader.innerHTML = `
                <div class="modal-header-content">
                    <div class="modal-title-section">
                        <h2 id="taskModalTitle">Edit Task</h2>
                        ${clientInfo}
                    </div>
                    <span class="close" data-modal="taskModal">&times;</span>
                </div>
            `;

            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.title;

            document.getElementById('taskDescription').value = task.description || '';
            const displayContent = document.querySelector('#taskDescriptionDisplay .description-content');
            if (displayContent) {
                displayContent.innerHTML = this.renderMarkdown(task.description || '');
            }

            this.populateSelectOptions();

            document.getElementById('taskStage').value = task.stage_id;
            document.getElementById('taskBoard').value = task.board_id || '';
            document.getElementById('taskAssignee').value = task.user_id || '';
            document.getElementById('taskClient').value = task.client_id || '';
            document.getElementById('taskStartDate').value = task.start_date || '';
            document.getElementById('taskDueDate').value = task.due_date || '';
            document.getElementById('taskDueTime').value = task.due_time || '';
            document.getElementById('taskCardColor').value = task.card_color || '#1a202c';
            // Update the color container data attribute
            const colorContainer = document.querySelector('.color-picker-container');
            if (colorContainer) {
                colorContainer.setAttribute('data-color', task.card_color || '#1a202c');
            }
            document.getElementById('taskPriority').value = task.priority || 'medium';

            if (task.board_id) {
                try {
                    const stages = await this.apiCall(`stages&board_id=${task.board_id}`);
                    const stageSelect = document.getElementById('taskStage');
                    if (stageSelect && stages && stages.length > 0) {
                        stageSelect.innerHTML = '<option value="">Select Stage</option>';
                        stages.forEach(stage => {
                            const option = document.createElement('option');
                            option.value = stage.id;
                            option.textContent = stage.name;
                            stageSelect.appendChild(option);
                        });
                        stageSelect.value = task.stage_id;
                    }
                } catch (error) {
                    console.error('Error loading stages for task board:', error);
                }
            }

            await this.loadAttachments(taskId);

        await this.loadTaskChecklist(taskId);

            await this.loadNotes(taskId);

        } catch (error) {
        }
    }

    displayAttachments(attachments) {
        const container = document.getElementById('attachmentsList');
        container.innerHTML = '';

        attachments.forEach(attachment => {
            const div = document.createElement('div');
            div.className = 'attachment-item';
            div.innerHTML = `
                <div class="attachment-info">
                    <i class="fas fa-file"></i>
                    <a href="uploads/${attachment.filename}" target="_blank" download="${attachment.original_name}" class="attachment-link">
                        ${attachment.original_name}
                    </a>
                </div>
                <button type="button" class="btn-icon" onclick="app.deleteAttachment(${attachment.id})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(div);
        });
    }

    displayChecklist(checklist) {
        const container = document.getElementById('checklistContainer');
        if (!container) {
            return;
        }
        container.innerHTML = '';

        if (checklist.length === 0) {
            this.addChecklistItem();
        } else {
            checklist.forEach(item => {
                this.addChecklistItem(item.text, item.is_completed, item.id);
            });
            this.addChecklistItem();
        }
    }

    async handleTaskSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const taskId = formData.get('taskId');

        const checklistItems = [];

        document.querySelectorAll('.checklist-item').forEach(item => {
            const input = item.querySelector('.checklist-input');
            if (input && input.value.trim()) {
                checklistItems.push({
                    text: input.value.trim(),
                    is_completed: false
                });
            }
        });

        document.querySelectorAll('.checklist-completed').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            const text = item.querySelector('span').textContent;
            if (text.trim()) {
                checklistItems.push({
                    text: text.trim(),
                    is_completed: checkbox.checked
                });
            }
        });

        let description = formData.get('taskDescription');

        let boardId = formData.get('taskBoard');
        let userId = formData.get('taskAssignee');
        let stageId = formData.get('taskStage');

        if (taskId) {
            if (!boardId) {
                const boardSelect = document.getElementById('taskBoard');
                boardId = boardSelect ? boardSelect.value : null;
            }
            if (!userId) {
                const userSelect = document.getElementById('taskAssignee');
                userId = userSelect ? userSelect.value : null;
            }
            if (!stageId) {
                const stageSelect = document.getElementById('taskStage');
                stageId = stageSelect ? stageSelect.value : null;
            }
        }

        const data = {
            title: formData.get('taskTitle'),
            description: description,
            stage_id: stageId,
            board_id: boardId || (this.data.currentBoard ? this.data.currentBoard.id : null),
            user_id: userId || null,
            client_id: formData.get('taskClient') || null,
            start_date: formData.get('taskStartDate') || null,
            due_date: formData.get('taskDueDate') || null,
            due_time: formData.get('taskDueTime') || null,
            card_color: formData.get('taskCardColor') || '#1a202c',
            priority: formData.get('taskPriority') || 'medium',
            checklist: checklistItems
        };
        
        console.log('Task data being sent:', data);
        console.log('Card color being sent:', data.card_color);
        console.log('Current board:', this.data.currentBoard);
        console.log('Available stages:', this.data.stages);

        try {
            // Validate required fields for new tasks
            if (!taskId) {
                if (!data.stage_id) {
                    this.showNotification('Please select a stage for the task', 'error');
                    return;
                }
                if (!data.board_id) {
                    this.showNotification('Please select a board for the task', 'error');
                    return;
                }
            }
            
            let newTaskId = taskId;

            if (taskId) {
                await this.apiCall(`tasks&id=${taskId}`, 'PUT', data);
                this.showNotification('Task updated successfully!', 'success');
            } else {
                const response = await this.apiCall('tasks', 'POST', data);
                newTaskId = response.id;
                this.showNotification('Task created successfully!', 'success');
                
                // Add the new task to local data immediately
                const newTask = {
                    id: newTaskId,
                    title: data.title,
                    description: data.description,
                    stage_id: data.stage_id,
                    board_id: data.board_id,
                    user_id: data.user_id,
                    client_id: data.client_id,
                    start_date: data.start_date,
                    due_date: data.due_date,
                    due_time: data.due_time,
                    card_color: data.card_color,
                    priority: data.priority,
                    position: 0, // Will be updated by loadBoardData
                    is_completed: false,
                    created_at: new Date().toISOString(),
                    user_name: this.data.users?.find(u => u.id == data.user_id)?.name || null,
                    client_name: this.data.clients?.find(c => c.id == data.client_id)?.name || null,
                    attachment_count: 0,
                    checklist_total: 0,
                    checklist_completed: 0
                };
                
                // Add to tasks array
                if (this.data.tasks) {
                    this.data.tasks.push(newTask);
                }
                
                // Render immediately to show the new task with color
                this.renderBoard();
            }

            const fileInput = document.getElementById('taskAttachments');
            if (fileInput && fileInput.files.length > 0) {
                for (let i = 0; i < fileInput.files.length; i++) {
                    const file = fileInput.files[i];
                    const uploadFormData = new FormData();
                    uploadFormData.append('file', file);
                    uploadFormData.append('task_id', newTaskId);

                    try {
                        await this.uploadFile('attachments', uploadFormData);
                    } catch (error) {
                        console.error('Failed to upload file:', file.name, error);
                        this.showNotification(`Failed to upload ${file.name}: ${error.message}`, 'error');
                    }
                }
                
                if (taskId) {
                    await this.loadAttachments(taskId);
                }
            }

            await this.loadBoardData();
            console.log('Tasks after reload:', this.data.tasks);
            console.log('New task should have color:', data.card_color);
            this.renderBoard();
            this.hideModal('taskModal');
            
            if (this.pendingClientId) {
                this.pendingClientId = null;
                const url = new URL(window.location);
                url.searchParams.delete('client');
                window.history.replaceState({}, '', url);
            }
        } catch (error) {
        }
    }

    async editTask(taskId) {
        this.showTaskModal(taskId);
    }

    async deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            try {
                await this.apiCall(`tasks&id=${taskId}`, 'DELETE');
                await this.loadBoardData();
                this.renderBoard();
                this.showNotification('Task deleted successfully!', 'success');
            } catch (error) {
            }
        }
    }

    async toggleTaskCompletion(taskId) {
        try {

            const task = this.data.tasks.find(t => t.id == taskId);
            if (!task) {
                this.showNotification('Task not found', 'error');
                return;
            }

            const newCompletionStatus = !task.is_completed;

            await this.apiCall(`tasks&id=${taskId}`, 'PUT', {
                is_completed: newCompletionStatus
            });

            task.is_completed = newCompletionStatus;
            task.completed_at = newCompletionStatus ? new Date().toISOString() : null;

            this.renderBoard();

            const action = newCompletionStatus ? 'completed' : 'marked as incomplete';
            this.showNotification(`Task ${action}!`, 'success');
        } catch (error) {
            console.error('Error toggling task completion:', error);
            this.showNotification('Failed to update task completion status', 'error');
        }
    }

    handleDragStart(e) {
        e.stopPropagation();

        this.draggedTask = {
            id: e.target.dataset.taskId,
            element: e.target
        };
        e.target.classList.add('dragging');

    }

    handleDragOver(e) {
        e.preventDefault();
        const container = e.currentTarget;
        container.classList.add('drag-over');

    }

    async handleDrop(e) {
        e.preventDefault();
        const container = e.currentTarget;
        container.classList.remove('drag-over');

        if (!this.draggedTask) return;

        const stageId = container.closest('.stage').dataset.stageId;
        const taskCards = Array.from(container.querySelectorAll('.task-card:not(.dragging)'));
        const afterElement = this.getDragAfterElement(container, e.clientY);

        let position = 0;
        if (afterElement) {
            position = taskCards.indexOf(afterElement);
        } else {
            position = taskCards.length;
        }

        try {
            await this.apiCall(`tasks&id=${this.draggedTask.id}`, 'PUT', {
                stage_id: stageId,
                position: position
            });

            await this.loadBoardData();
            this.renderBoard();
        } catch (error) {
            console.error('Error updating task position:', error);
        }

        this.draggedTask.element.classList.remove('dragging');
        this.draggedTask = null;
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    handleStageDragStart(e) {

        if (e.target.closest('.task-card') || e.target.closest('.tasks-container')) {

            e.preventDefault();
            return;
        }

        const stageId = e.currentTarget.dataset.stageId;
        const stageElement = e.currentTarget.closest('.stage');

        this.draggedStage = {
            id: stageId,
            element: stageElement
        };
        stageElement.classList.add('dragging');

    }

    handleStageDragOver(e) {
        e.preventDefault();
        const container = e.currentTarget;
        container.classList.add('drag-over');

    }

    async handleStageDrop(e) {
        e.preventDefault();
        const container = e.currentTarget;
        container.classList.remove('drag-over');

        if (!this.draggedStage) return;

        const stages = Array.from(document.querySelectorAll('.stage:not(.dragging)'));
        const afterElement = this.getStageDragAfterElement(stages, e.clientX);

        let position = 0;
        if (afterElement) {
            position = stages.indexOf(afterElement);
        } else {
            position = stages.length;
        }

        try {
            await this.apiCall(`stages&id=${this.draggedStage.id}`, 'PUT', {
                position: position
            });

            await this.loadBoardData();
            this.renderBoard();
        } catch (error) {
            console.error('Error updating stage position:', error);
        }

        this.draggedStage.element.classList.remove('dragging');
        this.draggedStage = null;
    }

    getStageDragAfterElement(stages, x) {
        return stages.reduce((closest, stage) => {
            const box = stage.getBoundingClientRect();
            const offset = x - box.left - box.width / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: stage };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    showUsersModal() {
        this.loadUsers();
        this.showModal('usersModal');
        this.switchUserTab('users'); 

        const isAdmin = this.currentUser && this.currentUser.is_admin;
        const addUserTab = document.querySelector('[data-tab="add-user"]');
        if (addUserTab) {
            addUserTab.style.display = isAdmin ? 'block' : 'none';
        }
    }

    switchUserTab(tabName) {
        document.querySelectorAll('.user-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        document.querySelectorAll('.user-tab-content').forEach(content => {
            content.classList.remove('active');
        });

        if (tabName === 'users') {
            document.getElementById('usersTab').classList.add('active');
        } else if (tabName === 'add-user') {
            document.getElementById('addUserTab').classList.add('active');
        }
    }

    loadUsers() {
        const container = document.getElementById('usersList');
        container.innerHTML = '';

        const isAdmin = this.currentUser && this.currentUser.is_admin;

        this.data.users.forEach(user => {
            const div = document.createElement('div');
            div.className = 'user-card';
            div.innerHTML = `
                <div class="user-info">
                    <div class="user-name">${user.name} ${user.is_admin ? 'Admin' : ''}</div>
                    <div class="user-details">
                        <div class="user-username">@${user.username || user.email.split('@')[0]}</div>
                        <div class="user-email">${user.email}</div>
                        <div class="user-joined">Joined ${this.formatDate(user.created_at)}</div>
                    </div>
                </div>
                <div class="user-actions">
                    ${isAdmin && user.is_admin && user.id !== this.currentUser?.id ? `<button class="btn btn-danger btn-small" onclick="app.removeAdmin(${user.id})">Remove Admin</button>` : ''}
                    ${isAdmin ? `<button class="btn btn-danger btn-small" onclick="app.deactivateUser(${user.id})">Deactivate</button>` : ''}
                    ${isAdmin && user.id !== this.currentUser?.id ? `<button class="btn btn-danger btn-small" onclick="app.deleteUser(${user.id})">Delete</button>` : ''}
                    ${user.id === this.currentUser?.id ? `<button class="btn btn-secondary btn-small" onclick="app.changePassword(${user.id})">Change Password</button>` : ''}
                </div>
            `;
            container.appendChild(div);
        });
    }

    formatDate(dateString) {
        if (!dateString) return 'Unknown';
        const date = new Date(dateString);
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${months[date.getMonth()]} ${date.getDate()}`;
    }

    async addUser(e) {
        e.preventDefault();

        if (!this.currentUser || !this.currentUser.is_admin) {
            this.showNotification('Only administrators can manage users', 'error');
            return;
        }

        const formData = new FormData(document.getElementById('userForm'));
        const userId = formData.get('userId');

        const data = {
            name: formData.get('userName'),
            email: formData.get('userEmail'),
            full_name: formData.get('userFullName'),
            password: formData.get('userPassword'),
            is_admin: formData.get('userIsAdmin') ? 1 : 0
        };

        if (!data.name || !data.email || !data.password) {
            this.showNotification('Please enter username, email, and password', 'error');
            return;
        }

        try {
            if (userId) {
                await this.apiCall(`users&id=${userId}`, 'PUT', data);
                this.showNotification('User updated successfully!', 'success');
            } else {
                await this.apiCall('users', 'POST', data);
                this.showNotification('User added successfully!', 'success');
            }

            await this.loadBoardData();
            this.loadUsers();
            this.populateSelectOptions();

            document.getElementById('userForm').reset();
            document.getElementById('userId').value = '';

            const submitBtn = document.querySelector('#userForm button[type="submit"]');
            submitBtn.textContent = 'Add User';
        } catch (error) {
        }
    }

    async editUser(userId) {
        const user = this.data.users.find(u => u.id == userId);
        if (user) {
            document.getElementById('userId').value = user.id;
            document.getElementById('newUserName').value = user.name;
            document.getElementById('newUserEmail').value = user.email;

            const submitBtn = document.querySelector('#userForm button[type="submit"]');
            submitBtn.textContent = 'Update User';
        }
    }

    async deleteUser(userId) {
        if (!this.currentUser || !this.currentUser.is_admin) {
            this.showNotification('Only administrators can manage users', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this user?')) {
            try {
                await this.apiCall(`users&id=${userId}`, 'DELETE');
                await this.loadBoardData();
                this.loadUsers();
                this.populateSelectOptions();
                this.showNotification('User deleted successfully!', 'success');
            } catch (error) {
            }
        }
    }

    async removeAdmin(userId) {
        if (!this.currentUser || !this.currentUser.is_admin) {
            this.showNotification('Only administrators can manage users', 'error');
            return;
        }

        if (confirm('Are you sure you want to remove admin privileges from this user?')) {
            try {
                await this.apiCall(`users&id=${userId}`, 'PUT', { is_admin: 0 });
                await this.loadBoardData();
                this.loadUsers();
                this.showNotification('Admin privileges removed successfully!', 'success');
            } catch (error) {
            }
        }
    }

    async deactivateUser(userId) {
        if (!this.currentUser || !this.currentUser.is_admin) {
            this.showNotification('Only administrators can manage users', 'error');
            return;
        }

        if (confirm('Are you sure you want to deactivate this user?')) {
            try {
                await this.apiCall(`users&id=${userId}`, 'PUT', { is_active: 0 });
                await this.loadBoardData();
                this.loadUsers();
                this.showNotification('User deactivated successfully!', 'success');
            } catch (error) {
            }
        }
    }

    changePassword(userId) {
        document.getElementById('passwordUserId').value = userId;
        this.showModal('passwordModal');
    }

    async handlePasswordChange(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const userId = formData.get('passwordUserId');
        const newPassword = formData.get('newPassword');
        const confirmPassword = formData.get('confirmPassword');

        if (userId != this.currentUser.id) {
            this.showNotification('You can only change your own password', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.showNotification('Passwords do not match!', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.showNotification('Password must be at least 6 characters long!', 'error');
            return;
        }

        try {
            await this.apiCall(`users&id=${userId}`, 'PUT', { password: newPassword });
            this.hideModal('passwordModal');
            this.showNotification('Password changed successfully!', 'success');
            e.target.reset();
        } catch (error) {
        }
    }

    showClientsModal() {
        this.loadClients();
        this.showModal('clientsModal');
    }

    showAddClientModal(clientId = null) {
        document.getElementById('clientForm').reset();
        document.getElementById('clientId').value = '';
        
        const modalTitle = document.getElementById('addClientModalTitle');
        const submitBtn = document.querySelector('#clientForm button[type="submit"]');
        
        if (clientId) {
            const client = this.data.clients.find(c => c.id == clientId);
            if (client) {
                document.getElementById('clientId').value = client.id;
                document.getElementById('newClientName').value = client.name;
                document.getElementById('newClientContactName').value = client.contact_name || '';
                document.getElementById('newClientContactNumber').value = client.contact_number || '';
                document.getElementById('newClientEmail').value = client.email || '';
                document.getElementById('newClientUrl').value = client.url || '';
                
                modalTitle.textContent = 'Edit Client';
                submitBtn.textContent = 'Update Client';
            }
        } else {
            modalTitle.textContent = 'Add New Client';
            submitBtn.textContent = 'Add Client';
        }
        
        this.showModal('addClientModal');
    }

    loadClients() {
        this.renderClientList(this.data.clients);
    }

    renderClientList(clients) {
        const container = document.getElementById('clientsList');
        container.innerHTML = '';

        if (clients.length === 0) {
            container.innerHTML = `
                <div class="text-center" style="padding: 2rem; color: var(--text-secondary);">
                    <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No clients found. Add your first client above.</p>
                </div>
            `;
            return;
        }

        clients.forEach(client => {
            const div = document.createElement('div');
            div.className = 'client-item';
            
            const clientTasks = this.data.tasks.filter(task => task.client_id == client.id);
            const activeTasks = clientTasks.filter(task => !task.is_completed).length;
            const completedTasks = clientTasks.filter(task => task.is_completed).length;
            
            const displayName = client.name || 'Unnamed Client';
            const displayContactName = client.contact_name && client.contact_name !== 'NONE' && client.contact_name !== 'NA' ? client.contact_name : '';
            const displayContactNumber = client.contact_number && client.contact_number !== 'NONE' && client.contact_number !== 'NA' ? client.contact_number : '';
            const displayEmail = client.email && client.email !== 'none@none.com' ? client.email : '';
            
            div.innerHTML = `
                <div class="client-info">
                    <div class="client-name">${displayName}</div>
                    ${displayContactName && displayContactNumber ? `
                        <div class="client-contact">
                            <i class="fas fa-user"></i>
                            ${displayContactName} - ${displayContactNumber}
                        </div>
                    ` : displayContactName ? `
                        <div class="client-contact">
                            <i class="fas fa-user"></i>
                            ${displayContactName}
                        </div>
                    ` : displayContactNumber ? `
                        <div class="client-contact">
                            <i class="fas fa-phone"></i>
                            ${displayContactNumber}
                        </div>
                    ` : ''}
                    ${displayEmail ? `
                        <div class="client-email">
                            <i class="fas fa-envelope"></i>
                            ${displayEmail}
                        </div>
                    ` : ''}
                    ${client.url && client.url !== 'NONE' && client.url !== 'NA' ? `
                        <div class="client-url">
                            <i class="fas fa-globe"></i>
                            <a href="${client.url}" target="_blank" rel="noopener noreferrer">${client.url}</a>
                        </div>
                    ` : ''}
                    <div class="client-stats">
                        <div class="client-stat">
                            <i class="fas fa-tasks"></i>
                            <span>${activeTasks} active tasks</span>
                        </div>
                        <div class="client-stat">
                            <i class="fas fa-check-circle"></i>
                            <span>${completedTasks} completed</span>
                        </div>
                    </div>
                </div>
                <div class="client-actions">
                    <button class="btn btn-primary btn-small" onclick="app.viewClientTasks(${client.id}, '${displayName}')">
                        <i class="fas fa-eye"></i> View Tasks
                    </button>
                    <button class="btn btn-secondary btn-small" onclick="app.editClient(${client.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-small" onclick="app.deleteClient(${client.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    filterClients(searchTerm) {
        const clearBtn = document.getElementById('clientSearchClear');
        
        if (searchTerm.trim() === '') {
            clearBtn.classList.remove('show');
            this.renderClientList(this.data.clients);
            return;
        }

        clearBtn.classList.add('show');
        
        const filteredClients = this.data.clients.filter(client => {
            const searchLower = searchTerm.toLowerCase();
            return (
                client.name.toLowerCase().includes(searchLower) ||
                client.contact_name.toLowerCase().includes(searchLower) ||
                client.contact_number.toLowerCase().includes(searchLower) ||
                (client.email && client.email.toLowerCase().includes(searchLower))
            );
        });

        this.renderClientList(filteredClients);
    }

    clearClientSearch() {
        const searchInput = document.getElementById('clientSearchInput');
        const clearBtn = document.getElementById('clientSearchClear');
        
        searchInput.value = '';
        clearBtn.classList.remove('show');
        this.renderClientList(this.data.clients);
    }

    viewClientTasks(clientId, clientName) {
        this.showClientTasks(clientId, clientName);
    }

    async addClient(e) {
        e.preventDefault();
        const formData = new FormData(document.getElementById('clientForm'));
        const clientId = formData.get('clientId');

        const data = {
            name: formData.get('clientName'),
            contact_name: formData.get('clientContactName'),
            contact_number: formData.get('clientContactNumber'),
            email: formData.get('clientEmail') || null,
            url: formData.get('clientUrl') || null
        };

        if (!data.name || !data.contact_name || !data.contact_number) {
            this.showNotification('Please enter client name, contact name, and contact number', 'error');
            return;
        }

        try {
            if (clientId) {
                await this.apiCall(`clients&id=${clientId}`, 'PUT', data);
                this.showNotification('Client updated successfully!', 'success');
            } else {
                await this.apiCall('clients', 'POST', data);
                this.showNotification('Client added successfully!', 'success');
            }

            await this.loadBoardData();
            this.loadClients();
            this.populateSelectOptions();

            this.hideModal('addClientModal');
            
            document.getElementById('clientForm').reset();
            document.getElementById('clientId').value = '';

            const submitBtn = document.querySelector('#clientForm button[type="submit"]');
            submitBtn.textContent = 'Add Client';
        } catch (error) {
            console.error('Error adding/updating client:', error);
            this.showNotification('Failed to save client. Please try again.', 'error');
        }
    }

    async editClient(clientId) {
        this.showAddClientModal(clientId);
    }

    async deleteClient(clientId) {
        if (confirm('Are you sure you want to delete this client?')) {
            try {
                await this.apiCall(`clients&id=${clientId}`, 'DELETE');
                await this.loadBoardData();
                this.loadClients();
                this.populateSelectOptions();
                this.showNotification('Client deleted successfully!', 'success');
            } catch (error) {
                console.error('Error deleting client:', error);
                this.showNotification('Failed to delete client. Please try again.', 'error');
            }
        }
    }

    addChecklistItem(text = '', isCompleted = false, itemId = null) {
        const container = document.getElementById('checklistContainer');
        const div = document.createElement('div');

        if (text === '' && !isCompleted) {
            div.className = 'checklist-item';
            div.innerHTML = `
                <input type="checkbox" disabled>
                <input type="text" placeholder="Checklist item" class="checklist-input" value="${text}">
                <button type="button" class="btn-icon remove-checklist"><i class="fas fa-times"></i></button>
            `;

            const input = div.querySelector('.checklist-input');
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    e.stopPropagation();
                    setTimeout(() => {
                        this.handleChecklistInput(e);
                    }, 0);
                }
            });
        } else {
            div.className = isCompleted ? 'checklist-completed completed' : 'checklist-completed';
            div.innerHTML = `
                <input type="checkbox" ${isCompleted ? 'checked' : ''} onchange="app.handleChecklistToggle(this)" data-item-id="${itemId}">
                <span>${text}</span>
                <button type="button" class="btn-icon remove-checklist" data-item-id="${itemId}"><i class="fas fa-times"></i></button>
            `;
        }

        container.appendChild(div);
        this.setupChecklistHandlers();
    }

    async handleChecklistInput(event) {
        const input = event.target;
        const text = input.value.trim();

        if (text === '') return;

        const taskId = document.getElementById('taskId').value;

        if (!taskId) {
            const newItemDiv = input.parentElement;
            newItemDiv.className = 'checklist-completed';
            newItemDiv.innerHTML = `
                <input type="checkbox" checked disabled>
                <span>${text}</span>
                <button type="button" class="btn-icon remove-checklist"><i class="fas fa-times"></i></button>
            `;
            this.addChecklistItem();
            return;
        }

        try {
            await this.apiCall('checklist', 'POST', {
                task_id: taskId,
                text: text,
                is_completed: 0
            });

            input.value = '';
            this.addChecklistItem();
            await this.loadTaskChecklist(taskId);

        } catch (error) {
            console.error('Failed to add checklist item:', error);
            this.showNotification('Failed to add checklist item', 'error');
        }
    }

    async handleChecklistToggle(checkbox) {
        const itemId = checkbox.dataset.itemId;
        if (!itemId) return;

        const isChecked = checkbox.checked;

        try {
            await this.apiCall(`checklist&id=${itemId}`, 'PUT', {
                is_completed: isChecked ? 1 : 0
            });

            const item = checkbox.parentElement;
            item.classList.toggle('completed', isChecked);

            const textElement = item.querySelector('span');
            if (textElement) {
                textElement.style.textDecoration = isChecked ? 'line-through' : 'none';
                textElement.style.color = isChecked ? 'var(--text-secondary)' : 'inherit';
            }

        } catch (error) {
            console.error('Failed to update checklist item:', error);
            this.showNotification('Failed to update checklist item', 'error');
            checkbox.checked = !isChecked;
        }
    }

    async loadTaskChecklist(taskId) {
        try {
            const response = await this.apiCall(`task-checklist&id=${taskId}`);
            this.displayChecklist(response.checklist || []);
        } catch (error) {
            console.error('Failed to load checklist:', error);
        }
    }

    async removeChecklistItem(button) {
        const itemId = button.dataset.itemId;
        if (!itemId) {
            button.parentElement.remove();
            return;
        }

        try {
            await this.apiCall(`checklist&id=${itemId}`, 'DELETE');
            button.parentElement.remove();
        } catch (error) {
            console.error('Failed to remove checklist item:', error);
            this.showNotification('Failed to remove checklist item', 'error');
        }
    }

    setupChecklistHandlers() {
        document.querySelectorAll('.remove-checklist').forEach(btn => {
            btn.onclick = (e) => {
                e.preventDefault();
                this.removeChecklistItem(btn);
            };
        });

        const addButton = document.getElementById('addChecklistItem');
        if (addButton) {
            addButton.onclick = (e) => {
                e.preventDefault();
                this.addChecklistItem();
            };
        }
    }

    handleFileSelection(e) {
        const files = Array.from(e.target.files);

        const container = document.getElementById('attachmentsList');
        container.innerHTML = '';

        files.forEach(file => {
            const div = document.createElement('div');
            div.className = 'attachment-item';
            div.innerHTML = `
                <div class="attachment-info">
                    <i class="fas fa-file"></i>
                    <span>${file.name} (${this.formatFileSize(file.size)})</span>
                </div>
                <span style="color: var(--text-secondary); font-size: 0.875rem;">Pending upload</span>
            `;
            container.appendChild(div);
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async loadAttachments(taskId) {
        try {
            const attachments = await this.apiCall(`attachments&id=${taskId}`, 'GET');
            this.displayAttachments(attachments);
        } catch (error) {
            console.error('Failed to load attachments:', error);
            this.displayAttachments([]);
        }
    }

    async deleteAttachment(attachmentId) {
        if (confirm('Are you sure you want to delete this attachment?')) {
            try {
                await this.apiCall(`attachments&id=${attachmentId}`, 'DELETE');
                const taskId = document.getElementById('taskId').value;
                if (taskId) {
                    await this.loadAttachments(taskId);
                }
                this.showNotification('Attachment deleted successfully!', 'success');
            } catch (error) {
            }
        }
    }

    async loadNotes(taskId) {
        try {
            const notes = await this.apiCall(`obsidian-notes&id=${taskId}`, 'GET');
            this.displayNotes(notes);
            
            const linkedNotes = await this.apiCall(`notes`, 'GET', null, { task_id: taskId });
            this.displayLinkedNotes(linkedNotes);
        } catch (error) {
            console.error('Failed to load notes:', error);
        }
    }

    displayNotes(notes) {
        const container = document.getElementById('notesList');
        container.innerHTML = '';

        if (notes.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 1rem;">No notes yet</div>';
            return;
        }

        notes.forEach(note => {
            const div = document.createElement('div');
            div.className = 'note-item';

            const noteTypeIcon = this.getNoteTypeIcon(note.note_type);
            const noteTypeClass = this.getNoteTypeClass(note.note_type);
            const formattedTime = this.formatNoteTime(note.created_at);

            div.innerHTML = `
                <div class="note-content">
                    <div class="note-header">
                        <span class="note-time">${formattedTime}</span>
                        <span class="note-type-badge ${noteTypeClass}">
                            <i class="${noteTypeIcon}"></i>
                            ${this.capitalizeFirst(note.note_type)}
                        </span>
                    </div>
                    <div class="note-text markdown-content">${this.renderMarkdown(note.note_text)}</div>
                    <div class="note-footer">
                        <span class="note-user">${note.user_name}</span>
                    </div>
                </div>
                <div class="note-actions">
                    <button type="button" class="btn-icon" onclick="app.deleteNote(${note.id})" title="Delete Note">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    displayLinkedNotes(notes) {
        const container = document.getElementById('linkedNotesList');
        container.innerHTML = '';

        if (!notes || notes.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 1rem;">No linked detailed notes</div>';
            return;
        }

        notes.forEach(note => {
            const div = document.createElement('div');
            div.className = 'note-item linked-note-item';
            const formattedTime = this.formatNoteTime(note.created_at);

            div.innerHTML = `
                <div class="note-content">
                    <div class="note-header">
                        <span class="note-time">${formattedTime}</span>
                        <span class="note-type-badge note-type-detailed">
                            <i class="fas fa-sticky-note"></i>
                            Detailed Note
                        </span>
                    </div>
                    <div class="note-text markdown-content">
                        <strong>${note.title}</strong>
                        ${note.content ? '<br>' + this.renderMarkdown(note.content.substring(0, 200) + (note.content.length > 200 ? '...' : '')) : ''}
                    </div>
                    <div class="note-footer">
                        <span class="note-user">${note.user_name || 'Unknown'}</span>
                    </div>
                </div>
                <div class="note-actions">
                    <button type="button" class="btn-icon" onclick="window.open('notes.html?note=${note.id}', '_blank')" title="Open in Notes">
                        <i class="fas fa-external-link-alt"></i>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    async handleNoteSubmit(e) {
        e.preventDefault();
        const taskId = document.getElementById('noteTaskId').value;

        let noteText = '';
        if (this.notePopupEditor) {
            noteText = this.notePopupEditor.value().trim();
        } else {
            noteText = document.getElementById('noteEditorText').value.trim();
        }

        if (!noteText) {
            this.showNotification('Please enter a note', 'error');
            return;
        }

        const noteTypeElement = document.querySelector('input[name="noteType"]:checked');
        if (!noteTypeElement) {
            this.showNotification('Please select a note type', 'error');
            return;
        }

        const noteType = noteTypeElement.value;
        console.log('Note type selected:', noteType);

        try {
            if (taskId === 'new') {
                this.hideModal('noteEditorModal');
                this.showNotification('Note will be added when task is saved', 'info');
                return;
            }

            const data = {
                task_id: taskId,
                note_text: noteText,
                note_type: noteType
            };

            console.log('Sending note data:', data);

            await this.apiCall('obsidian-notes', 'POST', data);

            if (this.notePopupEditor) {
                this.notePopupEditor.value('');
            } else {
                document.getElementById('noteEditorText').value = '';
            }

            this.hideModal('noteEditorModal');
            await this.loadNotes(taskId);
            this.showNotification('Note added successfully', 'success');
        } catch (error) {
            console.error('Failed to add note:', error);
            this.showNotification('Failed to add note', 'error');
        }
    }

        async handleDescriptionSubmit(e) {
        e.preventDefault();
        const taskId = document.getElementById('descriptionTaskId').value;

        let description = '';
        if (this.descriptionPopupEditor) {
            description = this.descriptionPopupEditor.value().trim();
        } else {
            description = document.getElementById('descriptionEditorText').value.trim();
        }

        try {
            if (taskId === 'new') {
                document.getElementById('taskDescription').value = description;
                const displayContent = document.querySelector('#taskDescriptionDisplay .description-content');
                if (displayContent) {
                    displayContent.innerHTML = this.renderMarkdown(description);
                }
                
                this.hideModal('descriptionEditorModal');
                this.showNotification('Description updated successfully', 'success');
                return;
            }

            const currentTask = await this.apiCall(`tasks&id=${taskId}`);

            const data = {
                title: currentTask.title,
                description: description,
                stage_id: currentTask.stage_id,
                user_id: currentTask.user_id,
                client_id: currentTask.client_id,
                priority: currentTask.priority || 'medium',
                start_date: currentTask.start_date,
                due_date: currentTask.due_date,
                due_time: currentTask.due_time,
                card_color: currentTask.card_color || '#1a202c'
            };

            console.log('Sending description update:', data);

            await this.apiCall(`tasks&id=${taskId}`, 'PUT', data);

            document.getElementById('taskDescription').value = description;
            const displayContent = document.querySelector('#taskDescriptionDisplay .description-content');
            if (displayContent) {
                displayContent.innerHTML = this.renderMarkdown(description);
            }

            this.hideModal('descriptionEditorModal');
            this.showNotification('Description updated successfully', 'success');
        } catch (error) {
            console.error('Failed to update description:', error);
            this.showNotification('Failed to update description', 'error');
        }
    }

    async deleteNote(noteId) {
        if (!confirm('Are you sure you want to delete this note?')) {
            return;
        }

        try {
            await this.apiCall(`obsidian-notes&id=${noteId}`, 'DELETE');
            this.showNotification('Note deleted successfully', 'success');
            const taskId = document.getElementById('taskId').value;
            if (taskId) {
                await this.loadNotes(taskId);
            }
        } catch (error) {
            console.error('Failed to delete note:', error);
            this.showNotification('Failed to delete note', 'error');
        }
    }

    formatDateTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleString();
    }

    formatNoteTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    getNoteTypeIcon(noteType) {
        switch (noteType) {
            case 'call': return 'fas fa-phone';
            case 'email': return 'fas fa-envelope';
            case 'inperson': return 'fas fa-user';
            default: return 'fas fa-sticky-note';
        }
    }

    getNoteTypeClass(noteType) {
        switch (noteType) {
            case 'call': return 'note-type-call';
            case 'email': return 'note-type-email';
            case 'inperson': return 'note-type-inperson';
            default: return 'note-type-default';
        }
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    async showClientTasks(clientId, clientName) {
        try {
            const response = await this.apiCall(`client-tasks&id=${clientId}`);
            document.getElementById('clientTasksTitle').textContent = `Tasks for ${clientName}`;

            const container = document.getElementById('clientTasksGrid');
            container.innerHTML = '';

            if (response.tasks && response.tasks.length > 0) {
                response.tasks.forEach(task => {
                    const taskCard = document.createElement('div');
                    taskCard.className = 'task-card';
                    taskCard.onclick = () => this.editTaskFromClientModal(task.id);
                    taskCard.innerHTML = this.createTaskElement(task);
                    container.appendChild(taskCard);
                });
            } else {
                container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No tasks found for this client.</p>';
            }

            this.showModal('clientTasksModal');
        } catch (error) {
            this.showNotification('Error loading client tasks: ' + error.message, 'error');
        }
    }

    async editTaskFromClientModal(taskId) {
        this.hideModal('clientTasksModal');

        await this.editTask(taskId);
    }

    applyTheme() {
        document.body.className = '';
    }

    showLoading() {
    }

    hideLoading() {
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div style="
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'error' ? '#e74c3c' : type === 'success' ? '#2ecc71' : '#3498db'};
                color: white;
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.2);
                z-index: 10000;
                max-width: 300px;
                animation: slideIn 0.3s ease-out;
            ">
                ${message}
            </div>
        `;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 3000);
    }

    setupSearch() {
        const searchInput = document.getElementById('searchInput');
        const mobileSearchInput = document.getElementById('mobileSearchInput');
        const searchClear = document.getElementById('searchClear');
        const mobileSearchClear = document.getElementById('mobileSearchClear');

        const activeInput = document.activeElement === mobileSearchInput ? mobileSearchInput : searchInput;
        const activeClear = document.activeElement === mobileSearchInput ? mobileSearchClear : searchClear;

        const query = activeInput.value.trim();

        if (query.length === 0) {
            this.hideSearchModal();
            return;
        }

        if (query.length < 2) {
            return;
        }

        activeClear.style.display = 'block';

        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.performSearch(query);
        }, 300);
    }

    async performSearch(query) {
        try {
            const results = await this.apiCall(`search&query=${encodeURIComponent(query)}`);
            this.showSearchResults(results, query);
        } catch (error) {
            console.error('Search error:', error);
            this.showNotification('Search failed', 'error');
        }
    }

    showSearchResults(results, query) {
        const modal = document.getElementById('searchModal');
        const resultsContainer = document.getElementById('searchResults');

        modal.querySelector('h2').textContent = `Search Results for "${query}"`;

        resultsContainer.innerHTML = '';

        this.displaySearchResults(results.tasks || [], 'tasks', resultsContainer);
        this.displaySearchResults(results.clients || [], 'clients', resultsContainer);
        this.displaySearchResults(results.projects || [], 'projects', resultsContainer);

        this.showModal('searchModal');

        this.setupSearchTabs();
    }

    displaySearchResults(items, type, container) {
        if (items.length === 0) return;

        const section = document.createElement('div');
        section.className = `search-section search-section-${type}`;
        section.style.display = type === 'tasks' ? 'block' : 'none';

        const title = document.createElement('h3');
        title.textContent = this.capitalizeFirst(type);
        title.style.marginBottom = '1rem';
        title.style.color = 'var(--text-primary)';
        section.appendChild(title);

        items.forEach(item => {
            const resultItem = this.createSearchResultItem(item, type);
            section.appendChild(resultItem);
        });

        container.appendChild(section);
    }

    createSearchResultItem(item, type) {
        const div = document.createElement('div');
        div.className = 'search-result-item';

        let content = '';

        switch (type) {
            case 'tasks':
                content = `
                    <div class="search-result-header">
                        <span class="search-result-title">${item.title}</span>
                        <span class="search-result-type">Task</span>
                    </div>
                    <div class="search-result-description">${item.description || 'No description'}</div>
                    <div class="search-result-meta">
                        <span><i class="fas fa-user"></i> ${item.user_name || 'Unassigned'}</span>
                        <span><i class="fas fa-building"></i> ${item.client_name || 'No client'}</span>
                        <span><i class="fas fa-layer-group"></i> ${item.stage_name || 'No stage'}</span>
                        ${item.due_date ? `<span><i class="fas fa-calendar"></i> ${new Date(item.due_date).toLocaleDateString()}</span>` : ''}
                    </div>
                `;
                div.addEventListener('click', () => {
                    this.hideModal('searchModal');
                    this.editTask(item.id);
                });
                break;

            case 'clients':
                content = `
                    <div class="search-result-header">
                        <span class="search-result-title">${item.name}</span>
                        <span class="search-result-type">Client</span>
                    </div>
                    <div class="search-result-description">${item.contact_name || 'No contact'}</div>
                    <div class="search-result-meta">
                        <span><i class="fas fa-phone"></i> ${item.contact_number || 'No phone'}</span>
                        <span><i class="fas fa-envelope"></i> ${item.email || 'No email'}</span>
                        ${item.task_count ? `<span><i class="fas fa-tasks"></i> ${item.task_count} tasks</span>` : ''}
                    </div>
                `;
                div.addEventListener('click', () => {
                    this.hideModal('searchModal');
                    this.showClientTasks(item.id, item.name);
                });
                break;

            case 'projects':
                content = `
                    <div class="search-result-header">
                        <span class="search-result-title">${item.name || 'Unnamed Project'}</span>
                        <span class="search-result-type">Project</span>
                    </div>
                    <div class="search-result-description">${item.description || 'No description'}</div>
                    <div class="search-result-meta">
                        <span><i class="fas fa-user"></i> ${item.user_name || 'Unassigned'}</span>
                        <span><i class="fas fa-building"></i> ${item.client_name || 'No client'}</span>
                        ${item.due_date ? `<span><i class="fas fa-calendar"></i> ${new Date(item.due_date).toLocaleDateString()}</span>` : ''}
                    </div>
                `;
                div.addEventListener('click', () => {
                    this.hideModal('searchModal');
                    this.editTask(item.id);
                });
                break;
        }

        div.innerHTML = content;
        return div;
    }

    setupSearchTabs() {
        const tabs = document.querySelectorAll('.search-tab');
        const sections = document.querySelectorAll('.search-section');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                sections.forEach(section => {
                    section.style.display = 'none';
                });

                const targetType = tab.dataset.tab;
                const targetSection = document.querySelector(`.search-section-${targetType}`);
                if (targetSection) {
                    targetSection.style.display = 'block';
                }
            });
        });
    }

    hideSearchModal() {
        this.hideModal('searchModal');
    }

    async showNotificationsModal() {
        await this.loadNotifications();
        this.showModal('notificationsModal');
    }

    async loadNotifications() {
        try {
            const notifications = await this.apiCall('notifications');
            this.displayNotifications(notifications);
            this.updateNotificationCount(notifications.filter(n => !n.is_read).length);
        } catch (error) {
            console.error('Error loading notifications:', error);
            this.showNotification('Failed to load notifications', 'error');
        }
    }

    displayNotifications(notifications) {
        const container = document.getElementById('notificationsList');

        if (notifications.length === 0) {
            container.innerHTML = '<p class="no-notifications">No notifications</p>';
            return;
        }

        container.innerHTML = notifications.map(notification => `
            <div class="notification-item ${notification.is_read ? 'read' : 'unread'}" data-id="${notification.id}">
                <div class="notification-content">
                    <div class="notification-message">${notification.message}</div>
                    <div class="notification-meta">
                        <span class="notification-time">${this.formatDateTime(notification.created_at)}</span>
                        ${notification.task_title ? `<span class="notification-task">Task: ${notification.task_title}</span>` : ''}
                    </div>
                </div>
                <div class="notification-actions">
                    ${!notification.is_read ? `<button class="btn btn-sm btn-primary mark-read-btn" onclick="app.markNotificationAsRead(${notification.id})">Mark Read</button>` : ''}
                    <button class="btn btn-sm btn-secondary delete-notification-btn" onclick="app.deleteNotification(${notification.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    updateNotificationCount(count) {
        const notificationElements = document.querySelectorAll('#notificationCount, #mobileNotificationCount');
        notificationElements.forEach(element => {
            element.textContent = count;
        });
    }

    async markNotificationAsRead(notificationId) {
        try {
            await this.apiCall(`notifications&id=${notificationId}`, 'PUT', { is_read: 1 });
            await this.loadNotifications();
        } catch (error) {
            console.error('Error marking notification as read:', error);
            this.showNotification('Failed to mark notification as read', 'error');
        }
    }

    async deleteNotification(notificationId) {
        try {
            await this.apiCall(`notifications&id=${notificationId}`, 'DELETE');
            await this.loadNotifications();
        } catch (error) {
            console.error('Error deleting notification:', error);
            this.showNotification('Failed to delete notification', 'error');
        }
    }

    startAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
        }

        this.autoRefreshInterval = setInterval(() => {
            if (this.isAutoRefreshEnabled && this.currentUser) {
                this.checkForUpdates();
            }
        }, 5000);

    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }

    }

    async checkForUpdates() {
        try {
            this.isAutoRefreshing = true;

            if (!this.data.currentBoard) {
                return;
            }

            const lastUpdate = this.lastUpdateTime ? this.lastUpdateTime.toISOString() : '';

            const checkResponse = await this.silentApiCall('board', 'GET', null, { 
                board_id: this.data.currentBoard.id,
                last_update: lastUpdate 
            });

            if (checkResponse.has_updates) {

                this.lastUpdateTime = new Date();

                const boardData = await this.silentApiCall('board', 'GET', null, { 
                    board_id: this.data.currentBoard.id 
                });
                this.updateBoardData(boardData);

                this.showUpdateNotification();
            }
        } catch (error) {
            console.error('Error checking for updates:', error);
        } finally {
            this.isAutoRefreshing = false;
        }
    }

    showUpdateNotification() {
        const notification = document.createElement('div');
        notification.className = 'update-notification';
        notification.textContent = 'Board updated with latest changes';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(76, 175, 80, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            opacity: 0;
            transition: opacity 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        `;

        document.body.appendChild(notification);

        setTimeout(() => notification.style.opacity = '1', 10);

        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    updateBoardData(boardData) {
        const scrollPositions = {};
        const stages = document.querySelectorAll('.stage');
        stages.forEach(stage => {
            const container = stage.querySelector('.tasks-container');
            if (container) {
                scrollPositions[stage.dataset.stageId] = container.scrollTop;
            }
        });

        if (boardData.company) {
            const companyNameElement = document.getElementById('companyName');
            if (companyNameElement && companyNameElement.textContent !== boardData.company.name) {
                companyNameElement.textContent = boardData.company.name;
            }
        }

        if (boardData.stages) {
            boardData.stages.forEach(updatedStage => {
                const existingStage = document.querySelector(`[data-stage-id="${updatedStage.id}"]`);
                if (existingStage) {
                    const titleElement = existingStage.querySelector('.stage-title');
                    if (titleElement) {
                        const colorSpan = titleElement.querySelector('.stage-color');
                        const countSpan = titleElement.querySelector('.stage-count');

                        if (colorSpan && countSpan) {
                            let stageNameNode = null;
                            for (let node of titleElement.childNodes) {
                                if (node.nodeType === Node.TEXT_NODE && 
                                    node.previousSibling === colorSpan && 
                                    node.nextSibling === countSpan) {
                                    stageNameNode = node;
                                    break;
                                }
                            }

                            if (stageNameNode && stageNameNode.textContent.trim() !== updatedStage.name) {
                                stageNameNode.textContent = updatedStage.name;
                            }
                        }
                    }

                    const taskElements = existingStage.querySelectorAll('[data-task-id]');
                    const countElement = existingStage.querySelector('.stage-count');
                    if (countElement) {
                        const newCount = taskElements.length;
                        if (countElement.textContent !== newCount.toString()) {
                            countElement.textContent = newCount;
                        }
                    }
                }
            });
        }

        if (boardData.tasks) {
            const currentTaskIds = new Set();
            const existingTaskIds = new Set();

            document.querySelectorAll('[data-task-id]').forEach(task => {
                existingTaskIds.add(task.dataset.taskId);
            });

            boardData.tasks.forEach(updatedTask => {
                currentTaskIds.add(updatedTask.id.toString());
                const existingTask = document.querySelector(`[data-task-id="${updatedTask.id}"]`);

                if (existingTask) {
                    this.updateTaskElement(existingTask, updatedTask);
                } else {
                    this.addNewTaskToStage(updatedTask);
                }
            });

            existingTaskIds.forEach(taskId => {
                if (!currentTaskIds.has(taskId)) {
                    const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
                    if (taskElement) {
                        taskElement.style.transition = 'opacity 0.3s ease-out';
                        taskElement.style.opacity = '0';
                        setTimeout(() => {
                            if (taskElement.parentNode) {
                                taskElement.remove();
                            }
                        }, 300);
                    }
                }
            });
        }

        setTimeout(() => {
            stages.forEach(stage => {
                const container = stage.querySelector('.tasks-container');
                if (container && scrollPositions[stage.dataset.stageId]) {
                    container.scrollTop = scrollPositions[stage.dataset.stageId];
                }
            });
        }, 50);
    }

    updateTaskElement(taskElement, updatedTask) {
        let hasChanges = false;

        const currentStageId = taskElement.closest('.stage').dataset.stageId;
        if (currentStageId !== updatedTask.stage_id.toString()) {
            const newStageElement = document.querySelector(`[data-stage-id="${updatedTask.stage_id}"]`);
            if (newStageElement) {
                const tasksContainer = newStageElement.querySelector('.tasks-container');
                if (tasksContainer) {
                    taskElement.style.transition = 'all 0.3s ease';
                    taskElement.style.transform = 'scale(0.95)';

                    setTimeout(() => {
                        tasksContainer.appendChild(taskElement);
                        taskElement.style.transform = 'scale(1)';
                        setTimeout(() => {
                            taskElement.style.transition = '';
                            taskElement.style.transform = '';
                        }, 300);
                    }, 150);

                    hasChanges = true;
                }
            }
        }

        const titleElement = taskElement.querySelector('.task-title');
        if (titleElement && titleElement.textContent !== updatedTask.title) {
            titleElement.textContent = updatedTask.title;
            hasChanges = true;
        }

        const descElement = taskElement.querySelector('.task-description');
        const newDescription = updatedTask.description || '';
        const currentContent = descElement ? descElement.innerHTML : '';
        const newContent = this.renderTruncatedDescription(newDescription);

        if (descElement && currentContent !== newContent) {
            descElement.innerHTML = newContent;
            hasChanges = true;
        }

        const assigneeElement = taskElement.querySelector('.task-assignee');
        const newAssignee = updatedTask.user_name || 'Unassigned';
        if (assigneeElement && assigneeElement.textContent !== newAssignee) {
            assigneeElement.textContent = newAssignee;
            hasChanges = true;
        }

        const clientElement = taskElement.querySelector('.task-client');
        const newClient = updatedTask.client_name || '';
        if (clientElement && clientElement.textContent !== newClient) {
            clientElement.textContent = newClient;
            hasChanges = true;
        }

        const currentPriority = taskElement.className.match(/priority-(\w+)/)?.[1];
        const newPriority = updatedTask.priority || 'medium';
        if (currentPriority !== newPriority) {
            taskElement.className = taskElement.className.replace(/priority-\w+/, '');
            taskElement.classList.add(`priority-${newPriority}`);
            hasChanges = true;
        }

        const dueDateElement = taskElement.querySelector('.task-date.due-date');
        if (dueDateElement && updatedTask.due_date) {
            const dueDate = new Date(updatedTask.due_date);
            const newDueDateText = dueDate.toLocaleDateString();

            if (dueDateElement.textContent !== newDueDateText) {
                dueDateElement.textContent = newDueDateText;
                dueDateElement.className = 'task-date due-date';

                const today = new Date();
                const diffTime = dueDate.getTime() - today.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                dueDateElement.classList.remove('overdue', 'due-soon');

                if (diffDays < 0) {
                    dueDateElement.classList.add('overdue');
                } else if (diffDays <= 3) {
                    dueDateElement.classList.add('due-soon');
                }
                hasChanges = true;
            }
        }

        const attachmentsElement = taskElement.querySelector('.task-attachments');
        if (attachmentsElement && updatedTask.attachment_count > 0) {
            const newAttachmentText = `<i class="fas fa-paperclip"></i> ${updatedTask.attachment_count}`;
            if (attachmentsElement.innerHTML !== newAttachmentText) {
                attachmentsElement.innerHTML = newAttachmentText;
                hasChanges = true;
            }
        }

        if (updatedTask.checklist_total > 0) {
            const checklistContainer = taskElement.querySelector('.task-checklist');
            if (checklistContainer) {
                const percentage = Math.round((updatedTask.checklist_completed / updatedTask.checklist_total) * 100);
                const newChecklistHTML = `
                    <div class="checklist-progress">${updatedTask.checklist_completed}/${updatedTask.checklist_total} completed</div>
                    <div class="checklist-bar">
                        <div class="checklist-progress-fill" style="width: ${percentage}%"></div>
                    </div>
                `;

                if (checklistContainer.innerHTML !== newChecklistHTML) {
                    checklistContainer.innerHTML = newChecklistHTML;
                    hasChanges = true;
                }
            }
        }

        if (hasChanges) {
            taskElement.style.transition = 'background-color 0.3s ease';
            taskElement.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
            setTimeout(() => {
                taskElement.style.backgroundColor = '';
            }, 1000);
        }
    }

    addNewTaskToStage(task) {
        const stageElement = document.querySelector(`[data-stage-id="${task.stage_id}"]`);
        if (stageElement) {
            const tasksContainer = stageElement.querySelector('.tasks-container');
            if (tasksContainer) {
                const taskElement = document.createElement('div');
                taskElement.className = 'task-card';
                taskElement.setAttribute('data-task-id', task.id);
                taskElement.setAttribute('draggable', 'true');
                taskElement.innerHTML = this.createTaskElement(task);

                taskElement.addEventListener('dragstart', (e) => this.handleDragStart(e));

                taskElement.addEventListener('click', () => this.editTask(task.id));

                tasksContainer.appendChild(taskElement);
            }
        }
    }

    removeDeletedTasks(currentTasks) {
        const existingTasks = document.querySelectorAll('[data-task-id]');
        existingTasks.forEach(taskElement => {
            const taskId = taskElement.getAttribute('data-task-id');
            const taskExists = currentTasks.some(task => task.id == taskId);

            if (!taskExists) {
                taskElement.remove();
            }
        });
    }

    populateBoardSelector() {
        const boardSelect = document.getElementById('boardSelector');
        const mobileBoardSelect = document.getElementById('mobileBoardSelector');

        if (!boardSelect || !mobileBoardSelect) {
            console.warn('Board selectors not found');
            return;
        }

        boardSelect.innerHTML = '<option value="">Select Board</option>';
        mobileBoardSelect.innerHTML = '<option value="">Select Board</option>';

        this.data.boards.forEach(board => {
            const option = document.createElement('option');
            option.value = board.id;
            option.textContent = board.name;
            boardSelect.appendChild(option);

            const mobileOption = document.createElement('option');
            mobileOption.value = board.id;
            mobileOption.textContent = board.name;
            mobileBoardSelect.appendChild(mobileOption);
        });

        if (this.data.currentBoard) {
            boardSelect.value = this.data.currentBoard.id;
            mobileBoardSelect.value = this.data.currentBoard.id;
            console.log('Set board selector to:', this.data.currentBoard.name);
        } else {
            console.log('No current board to set in selector');
        }
    }

    async switchBoard(boardId) {
        if (!boardId) {
            this.data.currentBoard = null;
            this.saveBoardSelection(null);
            this.loadBoardData();
            return;
        }

        const board = this.data.boards.find(b => b.id == boardId);
        if (!board) {
            this.showNotification('Board not found', 'error');
            return;
        }

        this.data.currentBoard = board;
        this.saveBoardSelection(board.id);
        this.populateBoardSelector();

        const companyNameElement = document.getElementById('companyName');
        if (companyNameElement) {
            companyNameElement.textContent = board.name;
        }

        console.log('Switched to board:', board.name);
        await this.loadCurrentBoardData();
    }

    showBoardsModal() {
        this.showModal('boardsModal');
        this.loadBoards();
        this.setupBoardsTabs();
    }

    setupBoardsTabs() {
        const tabs = document.querySelectorAll('.boards-tab');
        const contents = document.querySelectorAll('.boards-tab-content');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const targetTab = tab.getAttribute('data-tab');

                tabs.forEach(t => t.classList.remove('active'));
                contents.forEach(c => c.classList.remove('active'));

                tab.classList.add('active');

                let contentId;
                switch(targetTab) {
                    case 'boards':
                        contentId = 'boardsTab';
                        break;
                    case 'add-board':
                        contentId = 'addBoardTab';
                        break;
                    default:
                        contentId = targetTab + 'Tab';
                }

                const contentElement = document.getElementById(contentId);
                if (contentElement) {
                    contentElement.classList.add('active');
                } else {
                    console.error(`Content element with ID '${contentId}' not found`);
                }
            });
        });
    }

    async loadBoards() {
        try {
            const boardsList = document.getElementById('boardsList');
            if (!boardsList) return;

            boardsList.innerHTML = '';

            this.data.boards.forEach(board => {
                const boardElement = this.createBoardElement(board);
                boardsList.appendChild(boardElement);
            });
        } catch (error) {
            console.error('Error loading boards:', error);
        }
    }

    createBoardElement(board) {
        const boardDiv = document.createElement('div');
        boardDiv.className = 'board-item';
        boardDiv.innerHTML = `
            <div class="board-item-header">
                <div class="board-item-icon" style="background-color: ${board.color}">
                    <i class="${board.icon}"></i>
                </div>
                <div class="board-item-info">
                    <div class="board-item-name">${board.name}</div>
                    <div class="board-item-description">${board.description || 'No description'}</div>
                </div>
            </div>
            <div class="board-item-meta">
                <div class="board-item-stats">
                    <div class="board-item-stat">
                        <i class="fas fa-tasks"></i>
                        <span>${board.task_count || 0} tasks</span>
                    </div>
                    <div class="board-item-stat">
                        <i class="fas fa-columns"></i>
                        <span>${board.stage_count || 0} stages</span>
                    </div>
                </div>
                <div class="board-item-actions">
                    <button class="share-btn" onclick="app.showShareBoardModal(${board.id})">
                        <i class="fas fa-share"></i> Share
                    </button>
                    <button class="edit-btn" onclick="app.editBoard(${board.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="delete-btn" onclick="app.deleteBoard(${board.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
            <div class="board-item-status ${board.is_active ? 'active' : 'inactive'}">
                ${board.is_active ? 'Active' : 'Inactive'}
            </div>
        `;
        return boardDiv;
    }

    async handleBoardSubmit(e) {
        e.preventDefault();

        const formData = new FormData(e.target);

        const boardId = formData.get('boardId');

        const data = {
            name: formData.get('boardName'),
            description: formData.get('boardDescription') || '',
            color: formData.get('boardColor') || '#3498db',
            icon: formData.get('boardIcon') || 'fas fa-tasks',
            is_active: formData.get('boardIsActive') === 'on'
        };

        try {
            if (boardId) {

                await this.apiCall(`boards&id=${boardId}`, 'PUT', data);

                const boardIndex = this.data.boards.findIndex(b => b.id == boardId);
                if (boardIndex !== -1) {
                    this.data.boards[boardIndex] = { ...this.data.boards[boardIndex], ...data };
                }

                this.populateBoardSelector();

                if (this.data.currentBoard && this.data.currentBoard.id == boardId) {
                    await this.loadBoardData();
                }

                this.hideModal('boardsModal');
                this.showNotification('Board updated successfully!', 'success');
            } else {

                const response = await this.apiCall('boards', 'POST', data);

                this.data.boards.push(response);

                this.data.currentBoard = response;
                this.saveBoardSelection(response.id);

                this.populateBoardSelector();

                await this.loadBoardData();

                this.hideModal('boardsModal');
                this.showNotification('Board created successfully!', 'success');
            }
        } catch (error) {
            console.error('Error in handleBoardSubmit:', error);
        }
    }

    async editBoard(boardId) {
        const board = this.data.boards.find(b => b.id === boardId);
        if (!board) return;

        document.getElementById('boardId').value = board.id;
        document.getElementById('boardName').value = board.name;
        document.getElementById('boardDescription').value = board.description || '';
        document.getElementById('boardColor').value = board.color;
        document.getElementById('boardIcon').value = board.icon;
        document.getElementById('boardIsActive').checked = board.is_active;

        const addBoardTab = document.querySelector('[data-tab="add-board"]');
        if (addBoardTab) {
            addBoardTab.click();
        } else {
            console.error('Add board tab not found');
        }
    }

    async deleteBoard(boardId) {
        if (!confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
            return;
        }

        try {
            await this.apiCall(`boards/${boardId}`, 'DELETE');

            this.data.boards = this.data.boards.filter(b => b.id !== boardId);

            if (this.data.currentBoard && this.data.currentBoard.id === boardId) {
                if (this.data.boards.length > 0) {
                    await this.switchBoard(this.data.boards[0].id);
                } else {
                    this.data.currentBoard = null;
                    document.getElementById('companyName').textContent = 'No Boards';
                }
            }

            this.loadBoards();
            this.showNotification('Board deleted successfully', 'success');
        } catch (error) {
            console.error('Error deleting board:', error);
            this.showNotification('Error deleting board', 'error');
        }
    }

    loadSavedBoard() {
        const savedBoardId = localStorage.getItem('kanban-current-board');
        if (savedBoardId) {
            this.data.currentBoard = { id: parseInt(savedBoardId) };
        }
    }

    saveBoardSelection(boardId) {
        if (boardId) {
            localStorage.setItem('kanban-current-board', boardId.toString());
        } else {
            localStorage.removeItem('kanban-current-board');
        }
    }

    closeMobileMenu() {
        const mobileMenuOverlay = document.getElementById('mobileMenuOverlay');
        mobileMenuOverlay.classList.remove('active');
        document.body.style.overflow = ''; 
    }

    async sendDueNotifications() {
        try {
            const response = await this.apiCall('send-due-notifications', 'POST');

            if (response.sent === 0 && response.total_users === 0) {
                this.showNotification('No overdue or upcoming tasks found', 'info');
            } else if (response.sent === 0 && response.total_users > 0) {
                this.showNotification(`Found ${response.total_users} users with overdue/upcoming tasks, but failed to send emails`, 'error');
            } else if (response.sent > 0) {
                this.showNotification(`Sent ${response.sent} notification emails to ${response.total_users} users`, 'success');
            } else {
                this.showNotification('No tasks found or no users to notify', 'info');
            }
        } catch (error) {
            console.error('Notification error:', error);
            this.showNotification('Failed to send notifications: ' + error.message, 'error');
        }
    }

    showShareBoardModal(boardId) {
        this.currentShareItem = { type: 'board', id: boardId };
        this.showModal('shareModal');
        this.loadShareModalData();
    }

    showShareTaskModal(taskId) {
        this.currentShareItem = { type: 'task', id: taskId };
        this.showModal('shareModal');
        this.loadShareModalData();
    }

    async loadShareModalData() {
        try {
            const users = await this.apiCall('users');
            this.populateShareUserList(users);

            await this.loadCurrentShares();

            this.setupShareModalListeners();

            this.switchShareTab('share');
        } catch (error) {
            this.showNotification('Failed to load share data: ' + error.message, 'error');
        }
    }

    populateShareUserList(users) {
        const userList = document.getElementById('shareUserList');
        userList.innerHTML = '';

        const currentUserId = this.data.currentUser?.id || this.getCurrentUserId();

        users.forEach(user => {
            if (currentUserId && user.id == currentUserId) {
                return;
            }

            const userItem = document.createElement('div');
            userItem.className = 'user-checkbox-item';
            const userName = user.name || user.username || 'Unknown User';
            const userDisplay = user.username ? `${userName} (${user.username})` : userName;
            userItem.innerHTML = `
                <input type="checkbox" id="user_${user.id}" value="${user.id}">
                <label for="user_${user.id}">${userDisplay}</label>
            `;
            userList.appendChild(userItem);
        });
    }

    getCurrentUserId() {
        if (this.data.currentUser?.id) {
            return this.data.currentUser.id;
        }

        const userInfoElement = document.querySelector('.user-info');
        if (userInfoElement) {
            const userId = userInfoElement.dataset.userId;
            if (userId) {
                return parseInt(userId);
            }
        }

        return null;
    }

    async loadCurrentShares() {
        if (!this.currentShareItem) return;

        try {
            const sharedWithList = document.getElementById('sharedWithList');
            sharedWithList.innerHTML = '<p>Loading shared users...</p>';

            const endpoint = 'debug-shares';
            const queryParams = this.currentShareItem.type === 'board' ? 
                { board_id: this.currentShareItem.id } : 
                { task_id: this.currentShareItem.id };

            const response = await this.apiCall(endpoint, 'GET', null, queryParams);

            console.log('Debug shares response:', response);

            if (response.shares && response.shares.length > 0) {
                sharedWithList.innerHTML = '';

                response.shares.forEach(share => {
                    const shareItem = document.createElement('div');
                    shareItem.className = 'user-checkbox-item';
                    shareItem.innerHTML = `
                        <input type="checkbox" id="shared_user_${share.user_id}" value="${share.user_id}">
                        <label for="shared_user_${share.user_id}">${share.user_name}</label>
                    `;
                    sharedWithList.appendChild(shareItem);
                });
            } else {
                sharedWithList.innerHTML = '<p style="text-align: center; color: var(--text-secondary); padding: 1rem;">No users currently have access to this item.</p>';
            }

        } catch (error) {
            console.error('Failed to load current shares:', error);
            const sharedWithList = document.getElementById('sharedWithList');
            sharedWithList.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">Failed to load shared users.</p>';
        }
    }

    setupShareModalListeners() {
        const shareTabs = document.querySelectorAll('.share-tab');
        shareTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchShareTab(tabName);
            });
        });

        const shareBtn = document.getElementById('shareBtn');
        shareBtn.addEventListener('click', () => this.handleShare());

        const unshareBtn = document.getElementById('unshareBtn');
        unshareBtn.addEventListener('click', () => this.handleUnshare());
    }

    switchShareTab(tabName) {
        document.querySelectorAll('.share-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });

        document.querySelectorAll('.share-tab-content').forEach(content => {

            const expectedId = tabName === 'shared-with' ? 'sharedWithTab' : tabName + 'Tab';
            content.classList.toggle('active', content.id === expectedId);
        });
    }

    async handleShare() {
        if (!this.currentShareItem) return;

        const selectedUsers = Array.from(document.querySelectorAll('#shareUserList input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        if (selectedUsers.length === 0) {
            this.showNotification('Please select at least one user to share with.', 'error');
            return;
        }

        try {
            const endpoint = this.currentShareItem.type === 'board' ? 'share-board' : 'share-task';
            await this.apiCall(`${endpoint}&id=${this.currentShareItem.id}`, 'POST', {
                user_ids: selectedUsers
            });

            this.showNotification(`${this.currentShareItem.type} shared successfully!`, 'success');

            await this.loadCurrentShares();

            document.querySelectorAll('#shareUserList input[type="checkbox"]').forEach(checkbox => {
                checkbox.checked = false;
            });

            this.switchShareTab('shared-with');
        } catch (error) {
            this.showNotification(`Failed to share ${this.currentShareItem.type}: ` + error.message, 'error');
        }
    }

    async handleUnshare() {
        if (!this.currentShareItem) return;

        const selectedUsers = Array.from(document.querySelectorAll('#sharedWithList input[type="checkbox"]:checked'))
            .map(checkbox => checkbox.value);

        if (selectedUsers.length === 0) {
            this.showNotification('Please select at least one user to remove access from.', 'error');
            return;
        }

        try {
            const endpoint = this.currentShareItem.type === 'board' ? 'unshare-board' : 'unshare-task';
            await this.apiCall(`${endpoint}&id=${this.currentShareItem.id}`, 'DELETE', {
                user_ids: selectedUsers
            });

            this.showNotification(`Access removed successfully!`, 'success');

            await this.loadCurrentShares();
        } catch (error) {
            this.showNotification(`Failed to remove access: ` + error.message, 'error');
        }
    }

    async handleBoardChange(event) {
        const boardId = event.target.value;
        const stageSelect = document.getElementById('taskStage');
        
        stageSelect.innerHTML = '<option value="">Select Stage</option>';
        
        if (!boardId) {
            return;
        }
        
        try {
            const stages = await this.apiCall(`stages&board_id=${boardId}`);
            
            if (stages && stages.length > 0) {
                stages.forEach(stage => {
                    const existingOption = stageSelect.querySelector(`option[value="${stage.id}"]`);
                    if (!existingOption) {
                        const option = document.createElement('option');
                        option.value = stage.id;
                        option.textContent = stage.name;
                        stageSelect.appendChild(option);
                    }
                });
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No stages available for this board';
                option.disabled = true;
                stageSelect.appendChild(option);
            }
        } catch (error) {
            console.error('Error loading stages for board:', error);
            this.showNotification('Error loading stages for selected board', 'error');
        }
    }

    async handleUserChange(event) {
        const userId = event.target.value;
        const boardSelect = document.getElementById('taskBoard');
        const stageSelect = document.getElementById('taskStage');
        
        boardSelect.innerHTML = '<option value="">Select Board</option>';
        stageSelect.innerHTML = '<option value="">Select Stage</option>';
        
        if (!userId) {
            return;
        }
        
        try {
            const boards = await this.apiCall(`boards&user_id=${userId}`);
            
            if (boards && boards.length > 0) {
                boards.forEach(board => {
                    const existingOption = boardSelect.querySelector(`option[value="${board.id}"]`);
                    if (!existingOption) {
                        const option = document.createElement('option');
                        option.value = board.id;
                        option.textContent = board.name;
                        boardSelect.appendChild(option);
                    }
                });
            } else {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No boards available for this user';
                option.disabled = true;
                boardSelect.appendChild(option);
            }
        } catch (error) {
            console.error('Error loading boards for user:', error);
            this.showNotification('Error loading boards for selected user', 'error');
        }
    }

    toggleCompletedTasks(stageId) {
        const completedContainer = document.getElementById(`completed-${stageId}`);
        const header = completedContainer.previousElementSibling;
        const icon = header.querySelector('i');
        
        if (completedContainer.style.display === 'none') {
            completedContainer.style.display = 'block';
            icon.className = 'fas fa-chevron-up';
            header.classList.add('expanded');
        } else {
            completedContainer.style.display = 'none';
            icon.className = 'fas fa-chevron-down';
            header.classList.remove('expanded');
        }
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
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new KanbanApp();
});

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
`;
document.head.appendChild(style);