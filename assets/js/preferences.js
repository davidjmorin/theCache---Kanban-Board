class PreferencesApp {
    constructor() {
        this.apiBase = 'api.php?endpoint=';
        this.currentUser = null;
        this.preferences = {};
        this.saveTimeout = null;
        this.currentLogo = null;

        this.moduleConfig = {
            dashboard: {
                name: 'Dashboard',
                description: 'Overview of your workspace with metrics and quick actions',
                icon: 'fas fa-tachometer-alt'
            },
            kanban: {
                name: 'Kanban Board',
                description: 'Task management with drag-and-drop boards',
                icon: 'fas fa-columns'
            },
            crm: {
                name: 'CRM',
                description: 'Customer relationship management and client tracking',
                icon: 'fas fa-users'
            },
            calendar: {
                name: 'Calendar',
                description: 'Schedule and calendar view of tasks and events',
                icon: 'fas fa-calendar'
            },
            notes: {
                name: 'Notes',
                description: 'Markdown notes and documentation system',
                icon: 'fas fa-sticky-note'
            }
        };

        this.init();
    }

    async init() {
        document.getElementById('loadingScreen').style.display = 'flex';

        await this.checkAuthentication();
        
        if (this.currentUser) {
            await this.loadPreferences();
            await this.loadCurrentLogo();
            this.renderModuleCards();
            this.setupEventListeners();
            this.setupLogoHandlers();
            document.getElementById('loadingPreferences').style.display = 'none';
            document.getElementById('preferencesContent').style.display = 'block';
        }

        document.getElementById('loadingScreen').style.display = 'none';
    }

    async checkAuthentication() {
        try {
            const response = await fetch(this.apiBase + 'check-auth');
            const data = await response.json();

            if (data.authenticated) {
                this.currentUser = data.user;
                window.csrfToken = data.csrf_token; // Store CSRF token globally
                document.getElementById('loginContainer').style.display = 'none';
                document.getElementById('appContainer').style.display = 'block';
            } else {
                this.showLogin();
            }
        } catch (error) {
            console.error('Authentication check failed:', error);
            this.showLogin();
        }
    }

    showLogin() {
        document.getElementById('appContainer').style.display = 'none';
        document.getElementById('loginContainer').style.display = 'flex';
        this.setupLoginForm();
    }

    setupLoginForm() {
        const loginForm = document.getElementById('loginForm');
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;

            try {
                const response = await fetch(this.apiBase + 'login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (data.success) {
                    location.reload();
                } else {
                    alert(data.error || 'Login failed');
                }
            } catch (error) {
                console.error('Login error:', error);
                alert('Login failed. Please try again.');
            }
        });
    }

    async loadPreferences() {
        try {
            const response = await fetch(this.apiBase + 'user-preferences');
            if (response.ok) {
                this.preferences = await response.json();
            } else {
                console.error('Failed to load preferences');
                this.preferences = {};
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
            this.preferences = {};
        }
    }

    renderModuleCards() {
        const moduleGrid = document.getElementById('moduleGrid');
        moduleGrid.innerHTML = '';

        Object.entries(this.moduleConfig).forEach(([moduleKey, config]) => {
            const isEnabled = this.preferences[moduleKey] !== 0 && this.preferences[moduleKey] !== false; // Default to enabled unless explicitly disabled (0 or false)
            
            const card = document.createElement('div');
            card.className = 'module-card';
            card.innerHTML = `
                <div class="module-header">
                    <div class="module-info">
                        <div class="module-icon ${moduleKey}">
                            <i class="${config.icon}"></i>
                        </div>
                        <div class="module-details">
                            <h3>${config.name}</h3>
                            <p>${config.description}</p>
                        </div>
                    </div>
                    <label class="toggle-switch">
                        <input type="checkbox" ${isEnabled ? 'checked' : ''} 
                               data-module="${moduleKey}">
                        <span class="slider"></span>
                    </label>
                </div>
            `;

            moduleGrid.appendChild(card);
        });
    }

    setupEventListeners() {
        const moduleGrid = document.getElementById('moduleGrid');
        moduleGrid.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox') {
                const moduleKey = e.target.dataset.module;
                const isEnabled = e.target.checked;
                this.updatePreference(moduleKey, isEnabled);
            }
        });
    }

    async updatePreference(moduleKey, isEnabled) {
        try {
            const response = await fetch(this.apiBase + 'user-preferences', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    module_name: moduleKey,
                    is_enabled: isEnabled
                })
            });

            if (response.ok) {
                this.preferences[moduleKey] = isEnabled;
                this.showSaveStatus();
            } else {
                const error = await response.json();
                console.error('Failed to update preference:', error);
                alert('Failed to save preference. Please try again.');
            }
        } catch (error) {
            console.error('Error updating preference:', error);
            alert('Failed to save preference. Please try again.');
        }
    }

    showSaveStatus() {
        const saveStatus = document.getElementById('saveStatus');
        saveStatus.classList.add('show');
        
        // Clear any existing timeout
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        
        // Hide after 2 seconds
        this.saveTimeout = setTimeout(() => {
            saveStatus.classList.remove('show');
        }, 2000);
    }

    async loadCurrentLogo() {
        try {
            const response = await fetch(this.apiBase + 'user-logo');
            if (response.ok) {
                this.currentLogo = await response.json();
                this.updateLogoPreview();
            } else {
                console.error('Failed to load current logo');
            }
        } catch (error) {
            console.error('Error loading current logo:', error);
        }
    }

    updateLogoPreview() {
        const logoImg = document.getElementById('currentLogo');
        const logoStatus = document.getElementById('logoStatus');
        const logoDetails = document.getElementById('logoDetails');
        const deleteBtn = document.getElementById('deleteLogoBtn');

        if (this.currentLogo && this.currentLogo.has_logo) {
            logoImg.src = this.currentLogo.logo_url;
            logoStatus.textContent = 'Custom Logo';
            logoDetails.textContent = `Uploaded: ${this.currentLogo.original_name}`;
            deleteBtn.style.display = 'inline-flex';
        } else {
            logoImg.src = '/assets/thecache_logo.png';
            logoStatus.textContent = 'Default Logo';
            logoDetails.textContent = 'Using system default logo';
            deleteBtn.style.display = 'none';
        }
    }

    setupLogoHandlers() {
        const logoInput = document.getElementById('logoInput');
        const uploadBtn = document.getElementById('uploadLogoBtn');
        const deleteBtn = document.getElementById('deleteLogoBtn');

        uploadBtn.addEventListener('click', () => {
            logoInput.click();
        });

        logoInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.uploadLogo(e.target.files[0]);
            }
        });

        deleteBtn.addEventListener('click', () => {
            this.deleteLogo();
        });
    }

    async uploadLogo(file) {
        // Validate file
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            alert('Invalid file type. Please upload JPG, PNG, GIF, or SVG files only.');
            return;
        }

        const maxSize = 2 * 1024 * 1024; // 2MB
        if (file.size > maxSize) {
            alert('File too large. Maximum size is 2MB.');
            return;
        }

        const formData = new FormData();
        formData.append('logo', file);

        try {
            // Show uploading state
            const uploadBtn = document.getElementById('uploadLogoBtn');
            const originalText = uploadBtn.innerHTML;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            uploadBtn.disabled = true;

            const response = await fetch(this.apiBase + 'logo-upload', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // Reload current logo and update preview
                await this.loadCurrentLogo();
                this.showSaveStatus('Logo uploaded successfully');
                
                // Refresh logos throughout the application
                if (window.logoHelper) {
                    window.logoHelper.refreshLogos();
                }
            } else {
                alert('Upload failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Upload error:', error);
            alert('Upload failed. Please try again.');
        } finally {
            // Reset button state
            const uploadBtn = document.getElementById('uploadLogoBtn');
            uploadBtn.innerHTML = '<i class="fas fa-upload"></i> Upload Logo';
            uploadBtn.disabled = false;
            
            // Clear file input
            document.getElementById('logoInput').value = '';
        }
    }

    async deleteLogo() {
        if (!confirm('Are you sure you want to remove your custom logo? This will revert to the default logo.')) {
            return;
        }

        try {
            const response = await fetch(this.apiBase + 'user-logo', {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.success) {
                // Reload current logo and update preview
                await this.loadCurrentLogo();
                this.showSaveStatus('Logo removed successfully');
                
                // Refresh logos throughout the application
                if (window.logoHelper) {
                    window.logoHelper.refreshLogos();
                }
            } else {
                alert('Delete failed: ' + (data.error || 'Unknown error'));
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Delete failed. Please try again.');
        }
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new PreferencesApp();
});
