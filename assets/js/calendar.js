class CalendarApp {
    constructor() {
        this.currentDate = new Date();
        this.tasks = [];
        this.stages = [];
        this.users = [];
        this.clients = [];
        this.init();
    }

    async init() {
        await this.checkAuthentication();
        await this.loadData();
        this.renderCalendar();
        this.setupEventListeners();
    }

    async checkAuthentication() {
        try {
            const response = await fetch('api.php?endpoint=check-auth');
            const data = await response.json();
            
            if (!data.authenticated) {
                window.location.href = '/kanban.html';
                return;
            }
            
            document.getElementById('currentUser').textContent = data.user.name;
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = '/kanban.html';
        }
    }

    async loadData() {
        try {
            const boardsResponse = await fetch('api.php?endpoint=boards');
            const boards = await boardsResponse.json();
            
            this.tasks = [];
            for (const board of boards) {
                try {
                    const boardResponse = await fetch(`api.php?endpoint=board&board_id=${board.id}`);
                    const boardData = await boardResponse.json();
                    if (boardData.tasks) {
                        this.tasks = this.tasks.concat(boardData.tasks);
                    }
                } catch (error) {
                    console.error(`Failed to load tasks for board ${board.id}:`, error);
                }
            }
            
            this.stages = [];
            for (const board of boards) {
                try {
                    const stagesResponse = await fetch(`api.php?endpoint=stages&board_id=${board.id}`);
                    const stages = await stagesResponse.json();
                    this.stages = this.stages.concat(stages);
                } catch (error) {
                    console.error(`Failed to load stages for board ${board.id}:`, error);
                }
            }
            
            const usersResponse = await fetch('api.php?endpoint=users');
            this.users = await usersResponse.json();
            
            const clientsResponse = await fetch('api.php?endpoint=clients');
            this.clients = await clientsResponse.json();
        } catch (error) {
            console.error('Failed to load data:', error);
        }
    }

    renderCalendar() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                           'July', 'August', 'September', 'October', 'November', 'December'];
        document.getElementById('monthYear').textContent = `${monthNames[month]} ${year}`;
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const calendarDays = document.getElementById('calendarDays');
        calendarDays.innerHTML = '';
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const endDate = new Date(lastDay);
        endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
        const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
        
        for (let i = 0; i < totalDays; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            
            if (currentDate.getTime() === today.getTime()) {
                dayDiv.classList.add('today');
            }
            
            if (currentDate.getMonth() !== month) {
                dayDiv.classList.add('other-month');
            }
            
            const dayNumber = document.createElement('div');
            dayNumber.className = 'calendar-day-number';
            dayNumber.textContent = currentDate.getDate();
            dayDiv.appendChild(dayNumber);
            
            const tasksContainer = document.createElement('div');
            tasksContainer.className = 'calendar-tasks';
            
            const tasksForDay = this.getTasksForDate(currentDate);
            if (tasksForDay.length > 0) {
                const tasksToShow = tasksForDay.slice(0, 3);
                tasksToShow.forEach(task => {
                    const taskElement = this.createTaskElement(task);
                    tasksContainer.appendChild(taskElement);
                });
                
                if (tasksForDay.length > 3) {
                    const moreTasks = document.createElement('div');
                    moreTasks.className = 'calendar-task calendar-task-multiple';
                    moreTasks.textContent = `+${tasksForDay.length - 3} more`;
                    moreTasks.onclick = () => this.showDayTasks(currentDate, tasksForDay);
                    tasksContainer.appendChild(moreTasks);
                }
            }
            
            dayDiv.appendChild(tasksContainer);
            calendarDays.appendChild(dayDiv);
        }
    }

    getTasksForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.tasks.filter(task => {
            if (!task.due_date) return false;
            const taskDate = new Date(task.due_date);
            return taskDate.toISOString().split('T')[0] === dateStr;
        });
    }

    createTaskElement(task) {
        const taskDiv = document.createElement('div');
        taskDiv.className = 'calendar-task';
        
        let taskContent = task.title;
        if (task.due_time) {
            taskContent += ` (${task.due_time})`;
        }
        
        taskDiv.textContent = taskContent;
        taskDiv.onclick = () => this.showTaskDetails(task);
        
        const dueDate = new Date(task.due_date);
        const today = new Date();
        const timeDiff = dueDate.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        
        if (daysDiff < 0) {
            taskDiv.classList.add('overdue');
        } else if (daysDiff <= 1) {
            taskDiv.classList.add('due-soon');
        }
        
        return taskDiv;
    }

    async showTaskDetails(task) {
        try {
            const response = await fetch(`api.php?endpoint=tasks&id=${task.id}`);
            const fullTask = await response.json();
            
            let clientInfo = '';
            if (fullTask.client_id) {
                try {
                    const clientResponse = await fetch(`api.php?endpoint=clients&id=${fullTask.client_id}`);
                    const client = await clientResponse.json();
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
            
            const modal = document.createElement('div');
            modal.className = 'modal show';
            modal.innerHTML = `
                <div class="modal-content large">
                    <div class="modal-header">
                        <div class="modal-header-content">
                            <div class="modal-title-section">
                                <h2>${fullTask.title}</h2>
                                ${clientInfo}
                            </div>
                            <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                        </div>
                    </div>
                    <div class="modal-body">
                        <form id="calendarTaskForm">
                            <input type="hidden" id="calendarTaskId" name="taskId" value="${fullTask.id}">
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="calendarTaskTitle">Task Title</label>
                                    <input type="text" id="calendarTaskTitle" name="taskTitle" value="${fullTask.title}" required>
                                </div>
                                <div class="form-group">
                                    <label for="calendarTaskStage">Stage</label>
                                    <select id="calendarTaskStage" name="taskStage" required>
                                        ${this.stages.map(stage => 
                                            `<option value="${stage.id}" ${stage.id == fullTask.stage_id ? 'selected' : ''}>${stage.name}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="calendarTaskAssignee">Assignee</label>
                                    <select id="calendarTaskAssignee" name="taskAssignee">
                                        <option value="">Unassigned</option>
                                        ${this.users.map(user => 
                                            `<option value="${user.id}" ${user.id == fullTask.user_id ? 'selected' : ''}>${user.name}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="calendarTaskClient">Client</label>
                                    <select id="calendarTaskClient" name="taskClient">
                                        <option value="">No Client</option>
                                        ${this.clients.map(client => 
                                            `<option value="${client.id}" ${client.id == fullTask.client_id ? 'selected' : ''}>${client.name}</option>`
                                        ).join('')}
                                    </select>
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label for="calendarTaskStartDate">Start Date</label>
                                    <input type="date" id="calendarTaskStartDate" name="taskStartDate" value="${fullTask.start_date || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="calendarTaskDueDate">Due Date</label>
                                    <input type="date" id="calendarTaskDueDate" name="taskDueDate" value="${fullTask.due_date || ''}">
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="calendarTaskDescription">Description</label>
                                <textarea id="calendarTaskDescription" name="taskDescription" rows="3">${fullTask.description || ''}</textarea>
                            </div>
                            
                            <!-- Attachments Section -->
                            <div class="form-group">
                                <label>Attachments</label>
                                <div id="calendarAttachmentsList" class="attachments-list">
                                    <!-- Attachments will be loaded here -->
                                </div>
                                <input type="file" id="calendarTaskAttachments" name="taskAttachments" multiple>
                            </div>
                            
                            <!-- Checklist Section -->
                            <div class="form-group">
                                <label>Checklist</label>
                                <div id="calendarChecklistContainer" class="checklist-container">
                                    <!-- Checklist items will be loaded here -->
                                </div>
                                <button type="button" class="btn btn-small" onclick="calendarApp.addChecklistItem()">
                                    <i class="fas fa-plus"></i> Add Item
                                </button>
                            </div>
                            
                            <!-- Notes Section -->
                            <div class="form-group">
                                <label>Collaborative Notes</label>
                                <div id="calendarNotesContainer" class="notes-container">
                                    <div class="notes-list" id="calendarNotesList"></div>
                                    <div class="add-note-section">
                                        <div class="note-type-selector">
                                            <label class="note-type-label">
                                                <input type="radio" name="calendarNoteType" value="call" checked>
                                                <span class="note-type-btn note-type-call">
                                                    <i class="fas fa-phone"></i> Call
                                                </span>
                                            </label>
                                            <label class="note-type-label">
                                                <input type="radio" name="calendarNoteType" value="email">
                                                <span class="note-type-btn note-type-email">
                                                    <i class="fas fa-envelope"></i> Email
                                                </span>
                                            </label>
                                            <label class="note-type-label">
                                                <input type="radio" name="calendarNoteType" value="inperson">
                                                <span class="note-type-btn note-type-inperson">
                                                    <i class="fas fa-user"></i> In-Person
                                                </span>
                                            </label>
                                        </div>
                                        <textarea id="calendarNewNoteText" placeholder="Add a note..." rows="2"></textarea>
                                        <button type="button" id="calendarAddNoteBtn" class="btn btn-small">
                                            <i class="fas fa-plus"></i> Add Note
                                        </button>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="form-actions">
                                <button type="button" class="btn btn-danger" onclick="calendarApp.deleteTask(${fullTask.id})">Delete Task</button>
                                <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                                <button type="submit" class="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            this.displayAttachments(fullTask.attachments || []);
            this.displayChecklist(fullTask.checklist || []);
            await this.loadNotes(fullTask.id);
            
            this.setupCalendarTaskEventListeners(fullTask.id);
            
        } catch (error) {
            console.error('Failed to load task details:', error);
        }
    }

    showDayTasks(date, tasks) {
        const dateStr = date.toLocaleDateString();
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Tasks for ${dateStr}</h2>
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    <div class="task-list">
                        ${tasks.map(task => `
                            <div class="task-item" onclick="calendarApp.showTaskDetails(${JSON.stringify(task).replace(/"/g, '&quot;')})">
                                <div class="task-title">${task.title}</div>
                                <div class="task-meta">
                                    <span class="task-stage">${this.getStageName(task.stage_id)}</span>
                                    <span class="task-assignee">${this.getUserName(task.user_id) || 'Unassigned'}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    getStageName(stageId) {
        const stage = this.stages.find(s => s.id == stageId);
        return stage ? stage.name : 'Unknown';
    }

    getUserName(userId) {
        const user = this.users.find(u => u.id == userId);
        return user ? user.name : null;
    }

    getClientName(clientId) {
        const client = this.clients.find(c => c.id == clientId);
        return client ? client.name : null;
    }

    previousMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        this.renderCalendar();
    }

    nextMonth() {
        this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        this.renderCalendar();
    }

    showTaskModal() {
        this.populateSelectOptions();
        document.getElementById('taskModalTitle').textContent = 'Add Task';
        document.getElementById('taskForm').reset();
        document.getElementById('taskId').value = '';
        this.showModal('taskModal');
    }

    async editTask(taskId) {
        try {
            const response = await fetch(`api.php?endpoint=tasks&id=${taskId}`);
            const task = await response.json();
            
            document.getElementById('taskModalTitle').textContent = 'Edit Task';
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskStage').value = task.stage_id;
            document.getElementById('taskAssignee').value = task.user_id || '';
            document.getElementById('taskClient').value = task.client_id || '';
            document.getElementById('taskStartDate').value = task.start_date || '';
            document.getElementById('taskDueDate').value = task.due_date || '';
            
            this.showModal('taskModal');
        } catch (error) {
            console.error('Failed to load task:', error);
        }
    }

    populateSelectOptions() {
        const stageSelect = document.getElementById('taskStage');
        stageSelect.innerHTML = '<option value="">Select Stage</option>';
        this.stages.forEach(stage => {
            const option = document.createElement('option');
            option.value = stage.id;
            option.textContent = stage.name;
            stageSelect.appendChild(option);
        });
        
        const userSelect = document.getElementById('taskAssignee');
        userSelect.innerHTML = '<option value="">Unassigned</option>';
        this.users.forEach(user => {
            const option = document.createElement('option');
            option.value = user.id;
            option.textContent = user.name;
            userSelect.appendChild(option);
        });
        
        const clientSelect = document.getElementById('taskClient');
        clientSelect.innerHTML = '<option value="">No Client</option>';
        this.clients.forEach(client => {
            const option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            clientSelect.appendChild(option);
        });
    }

    setupEventListeners() {
        document.getElementById('taskForm').addEventListener('submit', (e) => this.handleTaskSubmit(e));
        
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
    }

    async handleTaskSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const taskId = formData.get('taskId');
        
        const boardsResponse = await fetch('api.php?endpoint=boards');
        const boards = await boardsResponse.json();
        const defaultBoardId = boards.length > 0 ? boards[0].id : 1;
        
        const data = {
            title: formData.get('taskTitle'),
            description: formData.get('taskDescription'),
            stage_id: formData.get('taskStage'),
            board_id: defaultBoardId,
            user_id: formData.get('taskAssignee') || null,
            client_id: formData.get('taskClient') || null,
            start_date: formData.get('taskStartDate') || null,
            due_date: formData.get('taskDueDate') || null
        };
        
        try {
            const method = taskId ? 'PUT' : 'POST';
            const endpoint = taskId ? `tasks&id=${taskId}` : 'tasks';
            
            await fetch(`api.php?endpoint=${endpoint}`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            this.hideModal('taskModal');
            await this.loadData();
            this.renderCalendar();
        } catch (error) {
            console.error('Failed to save task:', error);
        }
    }

    showModal(modalId) {
        document.getElementById(modalId).classList.add('show');
    }

    hideModal(modalId) {
        document.getElementById(modalId).classList.remove('show');
    }

    async handleLogout() {
        try {
            await fetch('api.php?endpoint=logout', { method: 'POST' });
            window.location.href = '/kanban.html';
        } catch (error) {
            console.error('Logout failed:', error);
        }
    }

    displayAttachments(attachments) {
        const container = document.getElementById('calendarAttachmentsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (attachments.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: var(--text-secondary); padding: 1rem;">No attachments</div>';
            return;
        }
        
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
                <button type="button" class="btn-icon" onclick="calendarApp.deleteAttachment(${attachment.id})">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            container.appendChild(div);
        });
    }

    displayChecklist(checklist) {
        const container = document.getElementById('calendarChecklistContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        checklist.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = item.is_completed ? 'checklist-completed completed' : 'checklist-item';
            div.innerHTML = `
                <input type="checkbox" ${item.is_completed ? 'checked' : ''} onchange="calendarApp.handleChecklistToggle(this)">
                <span>${item.text}</span>
                <button type="button" class="remove-checklist" onclick="calendarApp.removeChecklistItem(this)">
                    <i class="fas fa-times"></i>
                </button>
            `;
            container.appendChild(div);
        });
        
        const newItemDiv = document.createElement('div');
        newItemDiv.className = 'checklist-item';
        newItemDiv.innerHTML = `
            <input type="text" class="checklist-input" placeholder="Add checklist item..." onkeypress="calendarApp.handleChecklistInput(event)">
            <button type="button" class="remove-checklist" onclick="calendarApp.removeChecklistItem(this)">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(newItemDiv);
    }

    async loadNotes(taskId) {
        try {
            const response = await fetch(`api.php?endpoint=notes&id=${taskId}`);
            const notes = await response.json();
            this.displayNotes(notes);
        } catch (error) {
            console.error('Failed to load notes:', error);
        }
    }

    displayNotes(notes) {
        const container = document.getElementById('calendarNotesList');
        if (!container) return;
        
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
                    <div class="note-text">${note.note_text}</div>
                    <div class="note-footer">
                        <span class="note-user">${note.user_name}</span>
                    </div>
                </div>
                <div class="note-actions">
                    <button type="button" class="btn-icon" onclick="calendarApp.deleteNote(${note.id})" title="Delete Note">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            container.appendChild(div);
        });
    }

    setupCalendarTaskEventListeners(taskId) {
        document.getElementById('calendarTaskForm').addEventListener('submit', (e) => this.handleCalendarTaskSubmit(e));
        
        document.getElementById('calendarAddNoteBtn').addEventListener('click', (e) => {
            e.preventDefault();
            this.addNote(taskId);
        });
    }

    async handleCalendarTaskSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const taskId = formData.get('taskId');
        
        const data = {
            title: formData.get('taskTitle'),
            description: formData.get('taskDescription'),
            stage_id: formData.get('taskStage'),
            user_id: formData.get('taskAssignee') || null,
            client_id: formData.get('taskClient') || null,
            start_date: formData.get('taskStartDate') || null,
            due_date: formData.get('taskDueDate') || null
        };
        
        try {
            await fetch(`api.php?endpoint=tasks&id=${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            e.target.closest('.modal').remove();
            await this.loadData();
            this.renderCalendar();
        } catch (error) {
            console.error('Failed to update task:', error);
        }
    }

    async addNote(taskId) {
        const noteText = document.getElementById('calendarNewNoteText').value.trim();
        if (!noteText) return;
        
        const noteType = document.querySelector('input[name="calendarNoteType"]:checked').value;
        
        try {
            const data = {
                task_id: taskId,
                note_text: noteText,
                note_type: noteType
            };
            
            await fetch('api.php?endpoint=notes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            document.getElementById('calendarNewNoteText').value = '';
            await this.loadNotes(taskId);
        } catch (error) {
            console.error('Failed to add note:', error);
        }
    }

    async deleteNote(noteId) {
        try {
            await fetch(`api.php?endpoint=notes&id=${noteId}`, { method: 'DELETE' });
            const taskId = document.getElementById('calendarTaskId').value;
            await this.loadNotes(taskId);
        } catch (error) {
            console.error('Failed to delete note:', error);
        }
    }

    async deleteTask(taskId) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        try {
            await fetch(`api.php?endpoint=tasks&id=${taskId}`, { method: 'DELETE' });
            document.querySelector('.modal.show').remove();
            await this.loadData();
            this.renderCalendar();
        } catch (error) {
            console.error('Failed to delete task:', error);
        }
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

    formatNoteTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    }

    addChecklistItem() {
        const container = document.getElementById('calendarChecklistContainer');
        if (!container) return;
        
        const newItemDiv = document.createElement('div');
        newItemDiv.className = 'checklist-item';
        newItemDiv.innerHTML = `
            <input type="text" class="checklist-input" placeholder="Add checklist item..." onkeypress="calendarApp.handleChecklistInput(event)">
            <button type="button" class="remove-checklist" onclick="calendarApp.removeChecklistItem(this)">
                <i class="fas fa-times"></i>
            </button>
        `;
        container.appendChild(newItemDiv);
    }

    handleChecklistInput(event) {
        if (event.key === 'Enter') {
            const input = event.target;
            const text = input.value.trim();
            if (text) {
                this.addChecklistItemToTask(text);
                input.value = '';
            }
        }
    }

    async addChecklistItemToTask(text) {
        const taskId = document.getElementById('calendarTaskId').value;
        try {
            await fetch(`api.php?endpoint=checklist`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    task_id: taskId,
                    text: text
                })
            });
            
            const response = await fetch(`api.php?endpoint=tasks&id=${taskId}`);
            const task = await response.json();
            this.displayChecklist(task.checklist || []);
        } catch (error) {
            console.error('Failed to add checklist item:', error);
        }
    }

    handleChecklistToggle(checkbox) {
        const taskId = document.getElementById('calendarTaskId').value;
        const isCompleted = checkbox.checked;
        const itemElement = checkbox.closest('.checklist-item, .checklist-completed');
        
        if (isCompleted) {
            itemElement.classList.add('completed');
            itemElement.classList.remove('checklist-item');
            itemElement.classList.add('checklist-completed');
        } else {
            itemElement.classList.remove('completed');
            itemElement.classList.remove('checklist-completed');
            itemElement.classList.add('checklist-item');
        }
        
        const span = itemElement.querySelector('span');
        if (span) {
            span.style.textDecoration = isCompleted ? 'line-through' : 'none';
            span.style.opacity = isCompleted ? '0.6' : '1';
        }
    }

    removeChecklistItem(button) {
        const itemElement = button.closest('.checklist-item, .checklist-completed');
        if (itemElement) {
            itemElement.remove();
        }
    }

    async deleteAttachment(attachmentId) {
        try {
            await fetch(`api.php?endpoint=attachments&id=${attachmentId}`, { method: 'DELETE' });
            
            const taskId = document.getElementById('calendarTaskId').value;
            const response = await fetch(`api.php?endpoint=tasks&id=${taskId}`);
            const task = await response.json();
            this.displayAttachments(task.attachments || []);
        } catch (error) {
            console.error('Failed to delete attachment:', error);
        }
    }
}

const calendarApp = new CalendarApp(); 