class NotesApp {
    constructor() {
        this.apiBase = 'api.php?endpoint=';
        this.notes = [];
        this.clients = [];
        this.tasks = [];
        this.currentNote = null;
        this.editor = null;
        this.csrfToken = null;
        this.userPreferences = {};
        this.init();
    }

    async init() {
        const authResult = await this.checkAuth();
        if (!authResult.authenticated) {
            window.location.href = '/kanban.html';
            return;
        }

        this.csrfToken = authResult.csrf_token;
        
        this.editor = CodeMirror.fromTextArea(document.getElementById('noteEditor'), {
            mode: 'markdown',
            theme: 'monokai',
            lineNumbers: true,
            lineWrapping: true,
            autofocus: true,
            placeholder: 'Start writing your note...\n\nUse Markdown syntax for formatting:\n# Headers\n**Bold**\n*Italic*\n- Lists\n[Links](url)'
        });

        await this.loadUserPreferences();
        this.updateNavigationVisibility();
        await this.loadClients();
        await this.loadTasks();
        await this.loadNotes();
        
        const urlParams = new URLSearchParams(window.location.search);
        const taskId = urlParams.get('task');
        const noteId = urlParams.get('note');
        
        if (taskId) {
            document.getElementById('linkTask').value = taskId;
            console.log('Task pre-selected from URL:', taskId);
        }
        
        if (noteId) {
            await this.selectNote(noteId);
        }
        
        this.setupEventListeners();
    }

    async checkAuth() {
        try {
            const response = await fetch('api.php?endpoint=check-auth', {
                method: 'GET',
                credentials: 'include'
            });
            return await response.json();
        } catch (error) {
            console.error('Auth check failed:', error);
            return { authenticated: false };
        }
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const options = {
            method,
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (this.csrfToken && method !== 'GET') {
            options.headers['X-CSRF-Token'] = this.csrfToken;
        }

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.apiBase}${endpoint}`, options);
            
            const text = await response.text();
            let result;
            
            try {
                result = JSON.parse(text);
            } catch (parseError) {
                console.error('Failed to parse JSON response:', text);
                throw new Error('Invalid response from server');
            }
            
            if (!response.ok) {
                throw new Error(result.error || `HTTP ${response.status}: ${response.statusText}`);
            }
            
            return result;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    async loadNotes() {
        try {
            const filters = this.getFilters();
            const queryParams = new URLSearchParams(filters).toString();
            const url = queryParams ? `api.php?endpoint=notes&${queryParams}` : `api.php?endpoint=notes`;
            
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const text = await response.text();
            let notes;
            
            try {
                notes = JSON.parse(text);
            } catch (parseError) {
                console.error('Failed to parse JSON response:', text);
                throw new Error('Invalid response from server');
            }
            
            this.notes = notes;
            this.renderNotesList();
        } catch (error) {
            console.error('Error loading notes:', error);
        }
    }

    async loadClients() {
        try {
            const clients = await this.apiCall('crm-clients');
            this.clients = clients;
            this.populateClientSelects();
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    }

    async loadTasks() {
        try {
            const tasks = await this.apiCall('tasks');
            this.tasks = tasks;
            this.populateTaskSelects();
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    populateClientSelects() {
        const clientFilter = document.getElementById('clientFilter');
        const linkClient = document.getElementById('linkClient');
        
        clientFilter.innerHTML = '<option value="">All Clients</option>';
        linkClient.innerHTML = '<option value="">Link to Client</option>';
        
        this.clients.forEach(client => {
            const option = `<option value="${client.id}">${client.name}</option>`;
            clientFilter.innerHTML += option;
            linkClient.innerHTML += option;
        });
    }

    populateTaskSelects() {
        const taskFilter = document.getElementById('taskFilter');
        const linkTask = document.getElementById('linkTask');
        
        taskFilter.innerHTML = '<option value="">All Tasks</option>';
        linkTask.innerHTML = '<option value="">Link to Task</option>';
        
        this.tasks.forEach(task => {
            const option = `<option value="${task.id}">${task.title}</option>`;
            taskFilter.innerHTML += option;
            linkTask.innerHTML += option;
        });
    }

    getFilters() {
        const filters = {};
        
        const search = document.getElementById('searchFilter').value;
        if (search) filters.search = search;
        
        const clientId = document.getElementById('clientFilter').value;
        if (clientId) filters.client_id = clientId;
        
        const taskId = document.getElementById('taskFilter').value;
        if (taskId) filters.task_id = taskId;
        
        return filters;
    }

    renderNotesList() {
        const notesList = document.getElementById('notesList');
        
        if (this.notes.length === 0) {
            notesList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-sticky-note"></i>
                    <h3>No notes found</h3>
                    <p>Create your first note to get started</p>
                </div>
            `;
            return;
        }
        
        const sortedNotes = this.notes.sort((a, b) => {
            return new Date(b.updated_at) - new Date(a.updated_at);
        });
        
        notesList.innerHTML = sortedNotes.map(note => {
            return `
                <div class="note-item ${note.id === this.currentNote?.id ? 'active' : ''}" 
                     onclick="notesApp.selectNote(${note.id})">
                    <div class="note-title">
                        ${note.title}
                    </div>
                    <div class="note-meta">
                        ${note.client_name ? `<span class="linked-entity"><i class="fas fa-user"></i> ${note.client_name}</span>` : ''}
                        ${note.task_title ? `<span class="linked-entity"><i class="fas fa-tasks"></i> ${note.task_title}</span>` : ''}
                        ${note.tags && note.tags.trim() ? `<span class="note-tags"><i class="fas fa-tags"></i> ${note.tags.split(',').map(tag => tag.trim()).join(', ')}</span>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    async selectNote(noteId) {
        try {
            const note = await this.apiCall(`notes&id=${noteId}`);
            this.currentNote = note;
            this.loadNoteIntoEditor(note);
            this.renderNotesList();
            this.loadLinkedNotes(noteId);
        } catch (error) {
            console.error('Error loading note:', error);
        }
    }

    loadNoteIntoEditor(note) {
        document.getElementById('noteTitle').value = note.title || '';
        this.editor.setValue(note.content || '');
        document.getElementById('noteTags').value = note.tags || '';
        document.getElementById('linkClient').value = note.client_id || '';
        document.getElementById('linkTask').value = note.task_id || '';
        
        const editorContainer = document.getElementById('editorContainer');
        const previewContainer = document.getElementById('previewContainer');
        const previewToggle = document.getElementById('previewToggle');
        
        editorContainer.style.display = 'block';
        previewContainer.style.display = 'none';
        previewToggle.innerHTML = '<i class="fas fa-eye"></i> Preview';
    }

    async loadLinkedNotes(noteId) {
        try {
            const links = await this.apiCall(`note-links&id=${noteId}`);
            const linkedNotesList = document.getElementById('linkedNotesList');
            
            if (links.length === 0) {
                document.getElementById('noteLinks').style.display = 'none';
                return;
            }
            
            linkedNotesList.innerHTML = links.map(link => `
                <div class="link-item" onclick="notesApp.selectNote(${link.target_note_id})">
                    <i class="fas fa-link"></i>
                    <span>${link.target_note_title}</span>
                </div>
            `).join('');
            
            document.getElementById('noteLinks').style.display = 'block';
        } catch (error) {
            console.error('Error loading linked notes:', error);
        }
    }

    async createNote() {
        this.currentNote = null;
        this.clearEditor();
        this.editor.focus();
    }

    clearEditor() {
        document.getElementById('noteTitle').value = '';
        this.editor.setValue('');
        document.getElementById('noteTags').value = '';
        document.getElementById('linkClient').value = '';
        document.getElementById('linkTask').value = '';
        document.getElementById('noteLinks').style.display = 'none';
        
        const editorContainer = document.getElementById('editorContainer');
        const previewContainer = document.getElementById('previewContainer');
        const previewToggle = document.getElementById('previewToggle');
        
        editorContainer.style.display = 'block';
        previewContainer.style.display = 'none';
        previewToggle.innerHTML = '<i class="fas fa-eye"></i> Preview';
    }

    async saveNote() {
        const title = document.getElementById('noteTitle').value.trim();
        const content = this.editor.getValue();
        const tags = document.getElementById('noteTags').value.trim();
        const clientId = document.getElementById('linkClient').value || null;
        const taskId = document.getElementById('linkTask').value || null;
        
        if (!title) {
            this.showNotification('Please enter a title for the note', 'error');
            return;
        }
        
        try {
            const noteData = {
                title,
                content,
                tags: tags || null,
                client_id: clientId,
                task_id: taskId
            };
            
            if (this.currentNote) {
                await this.apiCall(`notes&id=${this.currentNote.id}`, 'PUT', noteData);
            } else {
                const result = await this.apiCall('notes', 'POST', noteData);
                this.currentNote = { id: result.id };
            }
            
            await this.loadNotes();
            this.showNotification('Note saved successfully!', 'success');
        } catch (error) {
            console.error('Error saving note:', error);
            this.showNotification('Error saving note: ' + error.message, 'error');
        }
    }

    async deleteNote() {
        if (!this.currentNote) {
            this.showNotification('No note selected', 'error');
            return;
        }
        
        if (!confirm('Are you sure you want to delete this note?')) {
            return;
        }
        
        try {
            await this.apiCall(`notes&id=${this.currentNote.id}`, 'DELETE');
            this.currentNote = null;
            this.clearEditor();
            await this.loadNotes();
            this.showNotification('Note deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting note:', error);
            this.showNotification('Error deleting note: ' + error.message, 'error');
        }
    }

    togglePreview() {
        const editorContainer = document.getElementById('editorContainer');
        const previewContainer = document.getElementById('previewContainer');
        const previewToggle = document.getElementById('previewToggle');
        const previewIcon = previewToggle.querySelector('i');
        
        if (editorContainer.style.display === 'none') {
            editorContainer.style.display = 'block';
            previewContainer.style.display = 'none';
            previewIcon.className = 'fas fa-eye';
            previewToggle.innerHTML = '<i class="fas fa-eye"></i> Preview';
        } else {
            editorContainer.style.display = 'none';
            previewContainer.style.display = 'block';
            previewIcon.className = 'fas fa-edit';
            previewToggle.innerHTML = '<i class="fas fa-edit"></i> Edit';
            
            this.renderMarkdownPreview();
        }
    }

    renderMarkdownPreview() {
        const content = this.editor.getValue();
        const previewElement = document.getElementById('markdownPreview');
        
        if (content.trim() === '') {
            previewElement.innerHTML = '<p class="text-muted">No content to preview</p>';
            return;
        }
        
        try {
            marked.setOptions({
                breaks: true,
                gfm: true
            });
            
            const htmlContent = marked.parse(content);
            previewElement.innerHTML = htmlContent;
        } catch (error) {
            console.error('Error rendering markdown:', error);
            previewElement.innerHTML = '<p class="text-danger">Error rendering markdown preview</p>';
        }
    }

    async filterNotes() {
        await this.loadNotes();
    }

    async createLink() {
        if (!this.currentNote) {
            this.showNotification('Please select a note first', 'error');
            return;
        }
        
        const linkNoteId = document.getElementById('linkNoteSelect').value;
        if (!linkNoteId) {
            this.showNotification('Please select a note to link', 'error');
            return;
        }
        
        try {
            await this.apiCall('note-links', 'POST', {
                source_note_id: this.currentNote.id,
                target_note_id: linkNoteId
            });
            
            this.closeModal('linkModal');
            this.loadLinkedNotes(this.currentNote.id);
            this.showNotification('Notes linked successfully!', 'success');
        } catch (error) {
            console.error('Error creating link:', error);
            this.showNotification('Error creating link: ' + error.message, 'error');
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).style.display = 'block';
        
        if (modalId === 'linkModal') {
            this.populateLinkModal();
        }
    }

    closeModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    populateLinkModal() {
        const linkNoteSelect = document.getElementById('linkNoteSelect');
        linkNoteSelect.innerHTML = '<option value="">Select a note...</option>';
        
        this.notes
            .filter(note => note.id !== this.currentNote?.id)
            .forEach(note => {
                linkNoteSelect.innerHTML += `<option value="${note.id}">${note.title}</option>`;
            });
    }

    setupEventListeners() {
        let saveTimeout;
        this.editor.on('change', () => {
            clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => {
                if (this.currentNote) {
                    this.saveNote();
                }
            }, 2000);
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 's':
                        e.preventDefault();
                        this.saveNote();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.createNote();
                        break;
                }
            }
        });
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    logout() {
        fetch('api.php/logout', {
            method: 'POST',
            credentials: 'include'
        }).then(() => {
            window.location.href = '/kanban.html';
        }).catch(error => {
            console.error('Logout failed:', error);
            window.location.href = '/kanban.html';
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            font-size: 14px;
            z-index: 10000;
            background: ${type === 'success' ? 'var(--success-color)' : type === 'error' ? 'var(--danger-color)' : 'var(--primary-color)'};
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    async loadUserPreferences() {
        try {
            const response = await fetch(this.apiBase + 'user-preferences');
            if (response.ok) {
                this.userPreferences = await response.json();
            } else {
                this.userPreferences = {};
            }
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

const notesApp = new NotesApp(); 