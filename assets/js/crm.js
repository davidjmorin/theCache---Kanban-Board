class CRMApp {
    constructor() {
        this.apiBase = 'api.php?endpoint=';
        this.currentClient = null;
        this.clients = [];
        this.currentUser = null;
        this.init();
    }

    async init() {
        await this.checkAuthentication();
        await this.loadClients();
        this.setupEventListeners();
    }

    async checkAuthentication() {
        try {
            const response = await this.apiCall('check-auth');
            if (response.authenticated) {
                this.currentUser = response.user;
            } else {
                window.location.href = 'index.html';
            }
        } catch (error) {
            console.error('Auth check failed:', error);

            if (error.message.includes('Authentication required') || error.message.includes('401')) {
            window.location.href = 'index.html';
            } else {
                this.showNotification('Authentication error: ' + error.message, 'error');
            }
        }
    }

    async apiCall(endpoint, method = 'GET', data = null) {
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

            const url = this.apiBase + endpoint;
            const response = await fetch(url, options);

            if (!response.ok) {
                let errorMessage = 'API request failed';
                try {
                    const errorResult = await response.json();
                    errorMessage = errorResult.error || errorMessage;
                } catch (jsonError) {

                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            return result;
        } catch (error) {
            console.error('API Error:', error);
            this.showNotification('Error: ' + error.message, 'error');
            throw error;
        }
    }

    async loadClients() {
        try {
            const clients = await this.apiCall('crm-clients');
            this.clients = clients;
            this.renderClientTable();
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    }

    renderClientTable() {
        const container = document.getElementById('clientTableContainer');

        if (this.clients.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users"></i>
                    <h3>No Clients Found</h3>
                    <p>Create your first client to get started</p>
                </div>
            `;
            return;
        }

        const table = `
            <table class="client-table">
                <thead>
                    <tr>
                        <th>Company</th>
                        <th>Contact</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Account Manager</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.clients.map(client => this.renderClientRow(client)).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = table;
    }

    renderClientRow(client) {
        const statusClass = `status-${client.status}`;
        const typeClass = `type-${client.company_type}`;
        const initials = this.getInitials(client.name);

        return `
            <tr onclick="crmApp.selectClient(${client.id})" style="cursor: pointer;">
                <td>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 32px; height: 32px; background: #3498db; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.75rem; font-weight: 600;">
                            ${initials}
                        </div>
                        <div>
                            <div style="font-weight: 600; color:rgb(196, 196, 196);">${client.name}</div>
                            <div style="font-size: 0.875rem; color: #6b7280;">${client.email}</div>
                        </div>
                    </div>
                </td>
                <td>
                    ${client.contact_name ? client.contact_name : '-'}
                </td>
                <td>
                    <span class="client-type ${typeClass}">${client.company_type}</span>
                </td>
                <td>
                    <span class="client-status ${statusClass}">${client.status}</span>
                </td>
                <td>
                    ${client.account_manager_name || '-'}
                </td>
                <td>
                    <div class="client-actions">
                        <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); console.log('Edit button clicked for client:', ${client.id}); crmApp.editClient(${client.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); crmApp.viewClient(${client.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getInitials(name) {
        return name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2);
    }

    async selectClient(clientId) {
        try {
            const client = await this.apiCall(`crm-client&id=${clientId}`);
            this.currentClient = client;
            this.showClientDetail(client);
        } catch (error) {
            console.error('Error loading client:', error);
        }
    }

    showClientDetail(client) {
        document.getElementById('clientList').style.display = 'none';
        document.getElementById('clientDetail').classList.add('active');

        const initials = this.getInitials(client.name);
        const fullAddress = this.formatAddress(client);

        document.getElementById('mainTitle').textContent = `Company - ID ${client.id} - ${client.name}`;

        const detailContent = `
            <div class="client-detail-header">
                <div class="client-info">
                    <div class="client-avatar">${initials}</div>
                    <div class="client-details">
                        <h2>${client.name}</h2>
                        <div class="client-meta">
                            <span><i class="fas fa-envelope"></i> ${client.email || 'No email'}</span>
                            <span><i class="fas fa-phone"></i> ${client.contact_number || 'No phone'}</span>
                            <span><i class="fas fa-map-marker-alt"></i> ${fullAddress}</span>
                        </div>
                    </div>
                </div>

                <div style="display: flex; gap: 1rem; align-items: center;">
                    ${client.company_type ? `<span class="client-type type-${client.company_type}">${client.company_type}</span>` : ''}
                    ${client.status ? `<span class="client-status status-${client.status}">${client.status}</span>` : ''}
                    <button class="btn btn-primary" onclick="crmApp.editClient(${client.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                </div>
            </div>

            <div class="client-tabs">
                <button class="client-tab active" onclick="crmApp.switchTab('activity')">Activity</button>
                <button class="client-tab" onclick="crmApp.switchTab('contacts')">Contacts (${client.contacts?.length || 0})</button>
                <button class="client-tab" onclick="crmApp.switchTab('tasks')">Open Tasks (${client.tasks?.length || 0})</button>
                <button class="client-tab" onclick="crmApp.switchTab('todos')">To-Dos (${client.todos?.length || 0})</button>
                <button class="client-tab" onclick="crmApp.switchTab('attachments')">Attachments (${client.attachments?.length || 0})</button>
            </div>

            <div id="activityTab" class="tab-content active">
                ${this.renderActivityTab(client)}
            </div>

            <div id="contactsTab" class="tab-content">
                ${this.renderContactsTab(client)}
            </div>

            <div id="tasksTab" class="tab-content">
                ${this.renderTasksTab(client)}
            </div>

            <div id="todosTab" class="tab-content">
                ${this.renderTodosTab(client)}
            </div>

            <div id="attachmentsTab" class="tab-content">
                ${this.renderAttachmentsTab(client)}
            </div>
        `;

        document.getElementById('clientDetail').innerHTML = detailContent;
    }

    formatAddress(client) {
        const parts = [client.address_1, client.address_2, client.city, client.state, client.zip_code].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'No address';
    }

    switchTab(tabName) {

        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.client-tab').forEach(tab => tab.classList.remove('active'));

        document.getElementById(tabName + 'Tab').classList.add('active');
        event.target.classList.add('active');
    }

    renderActivityTab(client) {
        return `
            <div style="margin-bottom: 1rem;">
                <button class="btn btn-primary" onclick="crmApp.addActivity(${client.id})">
                    <i class="fas fa-plus"></i> Add Activity
                </button>
            </div>
            <div>
                ${client.activities && client.activities.length > 0 ? 
                    client.activities.map(activity => `
                        <div class="card" style="margin-bottom: 1rem; padding: 1rem;">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                                <div style="display: flex; gap: 1rem; align-items: flex-start;">
                                    <div class="activity-avatar">${this.getInitials(activity.user_name)}</div>
                                    <div class="activity-content">
                                        <div class="activity-header">
                                            <h4 style="margin: 0; color: var(--text-primary);">${activity.title}</h4>
                                            <p style="margin: 0.25rem 0 0 0; color: var(--text-secondary);">${activity.description || ''}</p>
                                        </div>
                                    </div>
                                </div>
                                <div style="display: flex; gap: 0.5rem; align-items: center;">
                                    <span style="font-size: 0.875rem; color: var(--text-secondary);">${this.formatDate(activity.activity_date)}</span>
                                    <button class="btn btn-sm btn-secondary" onclick="crmApp.editActivity(${client.id}, ${activity.id})" title="Edit Activity">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="crmApp.deleteActivity(${client.id}, ${activity.id})" title="Delete Activity">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('') : 
                    `<div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <h3>No Activities</h3>
                        <p>No activities recorded for this client yet.</p>
                    </div>`
                }
            </div>
        `;
    }

    renderContactsTab(client) {
        return `
            <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <button class="btn btn-primary" onclick="crmApp.addContact(${client.id})">
                        <i class="fas fa-plus"></i> New
                    </button>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary">
                            <i class="fas fa-download"></i> Export <i class="fas fa-chevron-down"></i>
                        </button>
                        <button class="btn btn-icon" title="Grid View">
                            <i class="fas fa-th"></i>
                        </button>
                        <button class="btn btn-icon" title="Refresh">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>

                <div style="margin: 1rem 0; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <label style="display: inline-block; margin-right: 0.5rem; font-weight: 500;">Status:</label>
                        <select style="padding: 0.25rem 0.5rem; border: 1px solid var(--border-color); border-radius: 4px;">
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    <button class="btn btn-secondary" onclick="crmApp.clearContactSearch()" style="font-size: 0.875rem;">
                        <i class="fas fa-times"></i> Clear Search
                    </button>
                </div>

                <div class="table-container" style="background: var(--card-background); border-radius: var(--border-radius); overflow: hidden; border: 1px solid var(--border-color);">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead style="background: var(--background-color);">
                            <tr>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--border-color); font-weight: 600;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <i class="fas fa-sort"></i> Contact
                                    </div>
                                    <input type="text" id="contactNameSearch" placeholder="Search contacts..." style="width: 100%; margin-top: 0.5rem; padding: 0.25rem; border: 1px solid var(--border-color); border-radius: 3px; font-size: 0.875rem;" onkeyup="crmApp.filterContacts()">
                                </th>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--border-color); font-weight: 600;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <i class="fas fa-sort"></i> Phone
                                    </div>
                                    <input type="text" id="contactPhoneSearch" placeholder="Search phone..." style="width: 100%; margin-top: 0.5rem; padding: 0.25rem; border: 1px solid var(--border-color); border-radius: 3px; font-size: 0.875rem;" onkeyup="crmApp.filterContacts()">
                                </th>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--border-color); font-weight: 600;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <i class="fas fa-sort"></i> Mobile Phone
                                    </div>
                                    <input type="text" id="contactMobileSearch" placeholder="Search mobile..." style="width: 100%; margin-top: 0.5rem; padding: 0.25rem; border: 1px solid var(--border-color); border-radius: 3px; font-size: 0.875rem;" onkeyup="crmApp.filterContacts()">
                                </th>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--border-color); font-weight: 600;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <i class="fas fa-sort"></i> Last Activity
                                    </div>
                                    <input type="text" id="contactActivitySearch" placeholder="Search activity..." style="width: 100%; margin-top: 0.5rem; padding: 0.25rem; border: 1px solid var(--border-color); border-radius: 3px; font-size: 0.875rem;" onkeyup="crmApp.filterContacts()">
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            ${client.contacts && client.contacts.length > 0 ? 
                                client.contacts.map(contact => `
                                    <tr style="border-bottom: 1px solid var(--border-color);">
                                        <td style="padding: 0.75rem;">
                                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                                <div style="position: relative;">
                                                    <button class="btn btn-icon" style="padding: 0.25rem; font-size: 0.75rem;" title="Actions" onclick="crmApp.showContactActions(${client.id}, ${contact.id}, event)">
                                                        <i class="fas fa-ellipsis-v"></i>
                                                    </button>
                                                    <div id="contactActions_${contact.id}" style="display: none; position: fixed; background: var(--card-background); border: 1px solid var(--border-color); border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; min-width: 120px; padding: 0.5rem 0;">
                                                        <button class="btn btn-text" style="width: 100%; text-align: left; padding: 0.5rem 0.75rem; border: none; border-radius: 0;" onclick="crmApp.viewContact(${client.id}, ${contact.id})">
                                                            <i class="fas fa-eye"></i> View
                                                        </button>
                                                        <button class="btn btn-text" style="width: 100%; text-align: left; padding: 0.5rem 0.75rem; border: none; border-radius: 0; border-top: 1px solid var(--border-color);" onclick="crmApp.editContact(${client.id}, ${contact.id})">
                                                            <i class="fas fa-edit"></i> Edit
                                                        </button>
                                                        <button class="btn btn-text" style="width: 100%; text-align: left; padding: 0.5rem 0.75rem; border: none; border-radius: 0; border-top: 1px solid var(--border-color); color: var(--danger-color);" onclick="crmApp.deleteContact(${client.id}, ${contact.id})">
                                                            <i class="fas fa-trash"></i> Delete
                                                        </button>
                                                    </div>
                                                </div>
                                                <span style="color: var(--primary-color); font-weight: 500; cursor: pointer;" onclick="crmApp.viewContact(${client.id}, ${contact.id})">${contact.name}</span>
                                            </div>
                                        </td>
                                        <td style="padding: 0.75rem;">${contact.phone || '-'}</td>
                                        <td style="padding: 0.75rem;">${contact.mobile_phone || '-'}</td>
                                        <td style="padding: 0.75rem;">${contact.last_activity ? this.formatDate(contact.last_activity) : '-'}</td>
                                    </tr>
                                `).join('') : 
                                `<tr><td colspan="4" style="padding: 2rem; text-align: center; color: var(--text-secondary);">No contacts found</td></tr>`
                            }
                        </tbody>
                    </table>
                </div>

                <div style="margin-top: 1rem; font-size: 0.875rem; color: var(--text-secondary);">
                    1 - ${client.contacts ? client.contacts.length : 0} of ${client.contacts ? client.contacts.length : 0}
                </div>
            </div>
        `;
    }

    renderTasksTab(client) {
        if (!client.tasks || client.tasks.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>No Open Tasks</h3>
                    <p>No open tasks for this client.</p>
                </div>
            `;
        }

        return `
            <div style="margin-bottom: 1rem;">
                <button class="btn btn-primary" onclick="crmApp.createTask(${client.id})">
                    <i class="fas fa-plus"></i> Create Task
                </button>
            </div>
            <div>
                ${client.tasks.map(task => `
                    <div class="card" style="margin-bottom: 1rem; padding: 1rem; cursor: pointer;" onclick="window.location.href='index.html?task=${task.id}'">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <div>
                                <h4 style="margin: 0; color: var(--text-primary);">${task.title}</h4>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; color: var(--text-secondary);">
                                    ${task.board_name} • ${task.stage_name}
                                </p>
                            </div>
                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                <span class="task-priority priority-${task.priority}">${task.priority}</span>
                                <button class="btn btn-secondary" onclick="event.stopPropagation(); window.location.href='index.html?task=${task.id}'" title="Open Task">
                                    <i class="fas fa-external-link-alt"></i> Open
                                </button>
                            </div>
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">
                            ${task.due_date ? `<span><i class="fas fa-calendar"></i> ${this.formatDate(task.due_date)}</span>` : ''}
                            ${task.user_name ? `<span style="margin-left: 1rem;"><i class="fas fa-user"></i> ${task.user_name}</span>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderTodosTab(client) {
        return `
            <div style="margin-bottom: 1rem;">
                <button class="btn btn-primary" onclick="crmApp.addTodo(${client.id})">
                    <i class="fas fa-plus"></i> Add To-Do
                </button>
            </div>
            <div>
                ${client.todos && client.todos.length > 0 ? 
                    client.todos.map(todo => `
                        <div class="card" style="margin-bottom: 1rem; padding: 1rem; cursor: pointer;" onclick="crmApp.viewTodo(${client.id}, ${todo.id})">
                            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                                <div style="flex: 1;">
                                    <h4 style="margin: 0; color: var(--text-primary); font-size: 1rem;">${todo.title}</h4>
                                    <div style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);">
                                        ${todo.due_date ? `<span style="margin-right: 1rem;"><i class="fas fa-calendar"></i> ${this.formatDate(todo.due_date)}</span>` : ''}
                                        <span style="margin-right: 1rem;"><i class="fas fa-user"></i> ${todo.user_name || 'Unassigned'}</span>
                                        <span class="task-status status-${todo.status || 'pending'}" style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">${todo.status || 'pending'}</span>
                                        ${todo.status === 'closed' && todo.completed_at ? `<span style="margin-left: 0.5rem; color: var(--success-color);"><i class="fas fa-check-circle"></i> ${this.formatDate(todo.completed_at)}</span>` : ''}
                                    </div>
                                </div>
                                <div style="display: flex; gap: 0.5rem; margin-left: 1rem;">
                                    <button class="btn btn-secondary" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;" onclick="event.stopPropagation(); crmApp.editTodo(${client.id}, ${todo.id})" title="Edit Todo">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="btn btn-danger" style="padding: 0.5rem 0.75rem; font-size: 0.875rem;" onclick="event.stopPropagation(); crmApp.deleteTodo(${client.id}, ${todo.id})" title="Delete Todo">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    `).join('') : 
                    `<div class="empty-state">
                        <i class="fas fa-check-square"></i>
                        <h3>No To-Dos</h3>
                        <p>No to-dos for this client yet.</p>
                    </div>`
                }
            </div>
        `;
    }

    renderAttachmentsTab(client) {
        console.log('Rendering attachments for client:', client);
        console.log('Attachments:', client.attachments);

        if (!client.attachments || client.attachments.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-paperclip"></i>
                    <h3>No Attachments</h3>
                    <p>No attachments for this client yet.</p>
                    <button class="btn btn-primary" onclick="crmApp.uploadAttachment(${client.id})">
                        <i class="fas fa-upload"></i> Upload First Attachment
                    </button>
                </div>
            `;
        }

        return `
            <div style="margin-bottom: 1rem;">
                <button class="btn btn-primary" onclick="crmApp.uploadAttachment(${client.id})">
                    <i class="fas fa-upload"></i> Upload Attachment
                </button>
            </div>
            <div>
                                ${client.attachments.map(attachment => {
                    console.log('Rendering attachment:', attachment);
                    return `
                    <div class="card" style="margin-bottom: 1rem; padding: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <div>
                                <h4 style="margin: 0; color: var(--text-primary);">${attachment.original_name || 'Unknown File'}</h4>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; color: var(--text-secondary);">
                                    ${this.formatFileSize(attachment.file_size)} • ${attachment.mime_type || 'Unknown'}
                                </p>
                            </div>
                            <div style="display: flex; gap: 0.5rem;">
                                <button class="btn btn-secondary" onclick="crmApp.downloadAttachment('${attachment.filename}')" title="Download">
                                    <i class="fas fa-download"></i> Download
                                </button>
                                <button class="btn btn-danger" onclick="crmApp.deleteAttachment(${client.id}, ${attachment.id})" title="Delete">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">
                            <span><i class="fas fa-user"></i> ${attachment.uploaded_by_name || 'Unknown'}</span>
                            <span style="margin-left: 1rem;"><i class="fas fa-calendar"></i> ${this.formatDate(attachment.created_at)}</span>
                            ${attachment.description ? `<span style="margin-left: 1rem;"><i class="fas fa-info-circle"></i> ${attachment.description}</span>` : ''}
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        `;
    }

    formatDate(dateString) {
        if (!dateString) return '';

        let date = new Date(dateString);

        if (dateString.includes('T') && !dateString.includes('Z') && !dateString.includes('+')) {

            date = new Date(dateString + 'Z');
        }

        return date.toLocaleString('en-US', {
            timeZone: 'America/New_York',
            year: 'numeric',
            month: 'numeric',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }

    formatFileSize(bytes) {
        if (!bytes) return '';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    showNewClientModal() {
        document.getElementById('newClientModal').style.display = 'block';
    }

    hideNewClientModal() {
        document.getElementById('newClientModal').style.display = 'none';
        document.getElementById('newClientForm').reset();
    }

    async createClient(event) {
        event.preventDefault();

        try {
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData.entries());

            await this.apiCall('crm-clients', 'POST', data);

            this.hideNewClientModal();
            this.showNotification('Client created successfully!', 'success');
            await this.loadClients();
        } catch (error) {
            console.error('Error creating client:', error);
        }
    }

    async editClient(clientId) {
        try {
            console.log('Edit client called with ID:', clientId);

            const client = await this.apiCall(`crm-client&id=${clientId}`);
            console.log('Client data loaded:', client);

            const modal = document.getElementById('editClientModal');
            if (!modal) {
                console.error('Edit modal not found!');
                this.showNotification('Edit modal not found', 'error');
                return;
            }

            document.getElementById('editClientName').value = client.name || '';
            document.getElementById('editClientEmail').value = client.email || '';
            document.getElementById('editClientType').value = client.company_type || 'lead';
            document.getElementById('editClientStatus').value = client.status || 'active';
            document.getElementById('editClientCategory').value = client.company_category || 'Standard';
            document.getElementById('editClientNumber').value = client.company_number || '';
            document.getElementById('editContactName').value = client.contact_name || '';
            document.getElementById('editContactNumber').value = client.contact_number || '';
            document.getElementById('editAlternatePhone').value = client.alternate_phone || '';
            document.getElementById('editClientUrl').value = client.url || '';
            document.getElementById('editAddress1').value = client.address_1 || '';
            document.getElementById('editAddress2').value = client.address_2 || '';
            document.getElementById('editCity').value = client.city || '';
            document.getElementById('editState').value = client.state || '';
            document.getElementById('editZipCode').value = client.zip_code || '';
            document.getElementById('editCountry').value = client.country || 'United States';
            document.getElementById('editClassification').value = client.classification || '';
            document.getElementById('editClientNotes').value = client.notes || '';

            this.editingClientId = clientId;

            modal.style.display = 'block';
            console.log('Edit modal should now be visible');
        } catch (error) {
            console.error('Error loading client for edit:', error);
            this.showNotification('Error loading client data', 'error');
        }
    }

    async viewClient(clientId) {
        await this.selectClient(clientId);
    }

    async addActivity(clientId) {
        this.currentClientId = clientId;
        this.editingActivityId = null; 

        const titleElement = document.getElementById('activityTitle');
        const descriptionElement = document.getElementById('activityDescription');
        const typeElement = document.getElementById('activityType');

        if (titleElement) titleElement.value = '';
        if (descriptionElement) descriptionElement.value = '';
        if (typeElement) typeElement.value = 'note';

        const modalTitle = document.querySelector('#addActivityModal .modal-header h2');
        const submitButton = document.querySelector('#addActivityForm button[type="submit"]');

        if (modalTitle) modalTitle.textContent = 'Add Activity';
        if (submitButton) submitButton.textContent = 'Add Activity';

        document.getElementById('addActivityModal').style.display = 'block';
    }

    async editActivity(clientId, activityId) {
        try {

            const client = await this.apiCall(`crm-client&id=${clientId}`);
            const activity = client.activities.find(a => a.id == activityId);

            if (!activity) {
                this.showNotification('Activity not found', 'error');
                return;
            }

            const titleElement = document.getElementById('activityTitle');
            const descriptionElement = document.getElementById('activityDescription');
            const typeElement = document.getElementById('activityType');

            if (titleElement) titleElement.value = activity.title || '';
            if (descriptionElement) descriptionElement.value = activity.description || '';
            if (typeElement) typeElement.value = activity.activity_type || 'note';

            this.editingActivityId = activityId;
            this.currentClientId = clientId;

            const modalTitle = document.querySelector('#addActivityModal .modal-header h2');
            const submitButton = document.querySelector('#addActivityForm button[type="submit"]');

            if (modalTitle) modalTitle.textContent = 'Edit Activity';
            if (submitButton) submitButton.textContent = 'Update Activity';

            document.getElementById('addActivityModal').style.display = 'block';
        } catch (error) {
            console.error('Error loading activity for edit:', error);
            this.showNotification('Error loading activity data', 'error');
        }
    }

    async deleteActivity(clientId, activityId) {
        if (!confirm('Are you sure you want to delete this activity?')) {
            return;
        }

        try {
            await this.apiCall(`crm-activities&client_id=${clientId}&activity_id=${activityId}`, 'DELETE');
            this.showNotification('Activity deleted successfully!', 'success');

            if (this.currentClient) {
                await this.selectClient(this.currentClient.id);
            }
        } catch (error) {
            console.error('Error deleting activity:', error);
            this.showNotification('Error deleting activity', 'error');
        }
    }

    async addContact(clientId) {
        this.currentClientId = clientId;
        document.getElementById('addContactModal').style.display = 'block';
    }

    async createTask(clientId) {

        window.location.href = `index.html?client=${clientId}`;
    }

    async addTodo(clientId) {
        this.currentClientId = clientId;
        document.getElementById('addTodoModal').style.display = 'block';
    }

    async uploadAttachment(clientId) {
        this.currentClientId = clientId;
        document.getElementById('uploadAttachmentModal').style.display = 'block';
    }

    async submitAttachment(event) {
        event.preventDefault();

        try {
            const formData = new FormData(event.target);
            const fileInput = document.getElementById('attachmentFile');
            const file = fileInput.files[0];

            if (!file) {
                this.showNotification('Please select a file', 'error');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                this.showNotification('File size must be less than 10MB', 'error');
                return;
            }

            formData.append('file', file);
            formData.append('client_id', this.currentClientId);

            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Uploading...';
            submitBtn.disabled = true;

            const response = await fetch(`api.php?endpoint=crm-attachments&client_id=${this.currentClientId}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                let errorMessage = 'Upload failed';
                try {
                    const errorResult = await response.json();
                    errorMessage = errorResult.error || errorMessage;
                } catch (jsonError) {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();

            this.hideUploadAttachmentModal();
            this.showNotification('Attachment uploaded successfully!', 'success');

            if (this.currentClient) {
                await this.selectClient(this.currentClient.id);
            }

        } catch (error) {
            console.error('Error uploading attachment:', error);
            this.showNotification('Error uploading attachment: ' + error.message, 'error');
        } finally {

            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Upload Attachment';
            submitBtn.disabled = false;
        }
    }

    downloadAttachment(filename) {

        const clientName = this.currentClient ? this.currentClient.name.replace(/[^a-zA-Z0-9]/g, '_') : '';
        const filepath = `uploads/crm/${clientName}/${filename}`;

        const link = document.createElement('a');
        link.href = filepath;
        link.download = '';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async deleteAttachment(clientId, attachmentId) {
        if (!confirm('Are you sure you want to delete this attachment?')) {
            return;
        }

        try {
            await this.apiCall(`crm-attachments&client_id=${clientId}&attachment_id=${attachmentId}`, 'DELETE');
            this.showNotification('Attachment deleted successfully!', 'success');

            if (this.currentClient) {
                await this.selectClient(this.currentClient.id);
            }
        } catch (error) {
            console.error('Error deleting attachment:', error);
            this.showNotification('Error deleting attachment', 'error');
        }
    }

    async editContact(clientId, contactId) {
        try {

            const client = await this.apiCall(`crm-client&id=${clientId}`);
            const contact = client.contacts.find(c => c.id == contactId);

            if (!contact) {
                this.showNotification('Contact not found', 'error');
                return;
            }

            const nameElement = document.getElementById('editContactNameField');
            const emailElement = document.getElementById('editContactEmail');
            const phoneElement = document.getElementById('editContactPhone');
            const mobilePhoneElement = document.getElementById('editContactMobilePhone');
            const positionElement = document.getElementById('editContactPosition');
            const primaryElement = document.getElementById('editContactIsPrimary');
            const billingElement = document.getElementById('editContactIsBilling');

            if (nameElement) nameElement.value = contact.name || '';
            if (emailElement) emailElement.value = contact.email || '';
            if (phoneElement) phoneElement.value = contact.phone || '';
            if (mobilePhoneElement) mobilePhoneElement.value = contact.mobile_phone || '';
            if (positionElement) positionElement.value = contact.position || '';
            if (primaryElement) primaryElement.checked = contact.is_primary;
            if (billingElement) billingElement.checked = contact.is_billing_contact;

            document.getElementById('editContactForm').setAttribute('data-contact-id', contactId);
            document.getElementById('editContactForm').setAttribute('data-client-id', clientId);

            document.getElementById('editContactModal').style.display = 'block';
        } catch (error) {
            console.error('Error loading contact for edit:', error);
            this.showNotification('Error loading contact data', 'error');
        }
    }

    async deleteContact(clientId, contactId) {
        if (!confirm('Are you sure you want to delete this contact?')) {
            return;
        }

        try {
            await this.apiCall(`crm-contacts&client_id=${clientId}&contact_id=${contactId}`, 'DELETE');
            this.showNotification('Contact deleted successfully!', 'success');

            if (this.currentClient) {
                await this.selectClient(this.currentClient.id);
            }
        } catch (error) {
            console.error('Error deleting contact:', error);
            this.showNotification('Error deleting contact', 'error');
        }
    }

    showContactActions(clientId, contactId, event) {
        event.stopPropagation();

        document.querySelectorAll('[id^="contactActions_"]').forEach(menu => {
            menu.style.display = 'none';
        });

        const menu = document.getElementById(`contactActions_${contactId}`);
        if (menu) {
            const isVisible = menu.style.display === 'block';

            if (isVisible) {

                menu.style.display = 'none';
                menu.style.position = 'absolute';
                menu.style.top = '100%';
                menu.style.bottom = 'auto';
                menu.style.left = '0';
                menu.style.right = 'auto';
                menu.style.transform = 'none';
                menu.style.marginTop = '5px';
                menu.style.marginBottom = '0';
            } else {

                menu.style.display = 'block';

                const button = event.target.closest('button');
                const buttonRect = button.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const tableContainer = button.closest('.table-container');
                const tableRect = tableContainer ? tableContainer.getBoundingClientRect() : null;

                const menuHeight = 120;
                const menuWidth = 120;

                let top = buttonRect.bottom + 5;
                let left = buttonRect.left;

                if (top + menuHeight > viewportHeight) {
                    top = buttonRect.top - menuHeight - 5;
                }

                if (left + menuWidth > window.innerWidth) {
                    left = window.innerWidth - menuWidth - 10;
                }

                if (left < 10) {
                    left = 10;
                }

                if (top < 10) {
                    top = 10;
                }

                menu.style.top = top + 'px';
                menu.style.left = left + 'px';

            }
        }

        setTimeout(() => {
            const closeMenu = (e) => {
                if (!menu.contains(e.target) && !event.target.contains(e.target)) {
                    menu.style.display = 'none';
                    document.removeEventListener('click', closeMenu);
                }
            };
            document.addEventListener('click', closeMenu);
        }, 0);
    }

    filterContacts() {
        if (!this.currentClient || !this.currentClient.contacts) {
            return;
        }

        const nameSearch = document.getElementById('contactNameSearch')?.value?.toLowerCase() || '';
        const phoneSearch = document.getElementById('contactPhoneSearch')?.value?.toLowerCase() || '';
        const mobileSearch = document.getElementById('contactMobileSearch')?.value?.toLowerCase() || '';
        const activitySearch = document.getElementById('contactActivitySearch')?.value?.toLowerCase() || '';

        const filteredContacts = this.currentClient.contacts.filter(contact => {
            const name = (contact.name || '').toLowerCase();
            const phone = (contact.phone || '').toLowerCase();
            const mobile = (contact.mobile_phone || '').toLowerCase();
            const activity = contact.last_activity ? this.formatDate(contact.last_activity).toLowerCase() : '';

            return (!nameSearch || name.includes(nameSearch)) &&
                   (!phoneSearch || phone.includes(phoneSearch)) &&
                   (!mobileSearch || mobile.includes(mobileSearch)) &&
                   (!activitySearch || activity.includes(activitySearch));
        });

        const tbody = document.querySelector('#contactsTab .table-container tbody');
        if (tbody) {
            tbody.innerHTML = filteredContacts.length > 0 ? 
                filteredContacts.map(contact => `
                    <tr style="border-bottom: 1px solid var(--border-color);">
                        <td style="padding: 0.75rem;">
                            <div style="display: flex; align-items: center; gap: 0.75rem;">
                                <div style="position: relative;">
                                    <button class="btn btn-icon" style="padding: 0.25rem; font-size: 0.75rem;" title="Actions" onclick="crmApp.showContactActions(${this.currentClient.id}, ${contact.id}, event)">
                                        <i class="fas fa-ellipsis-v"></i>
                                    </button>
                                    <div id="contactActions_${contact.id}" style="display: none; position: fixed; background: var(--card-background); border: 1px solid var(--border-color); border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; min-width: 120px; padding: 0.5rem 0;">
                                        <button class="btn btn-text" style="width: 100%; text-align: left; padding: 0.5rem 0.75rem; border: none; border-radius: 0;" onclick="crmApp.viewContact(${this.currentClient.id}, ${contact.id})">
                                            <i class="fas fa-eye"></i> View
                                        </button>
                                        <button class="btn btn-text" style="width: 100%; text-align: left; padding: 0.5rem 0.75rem; border: none; border-radius: 0; border-top: 1px solid var(--border-color);" onclick="crmApp.editContact(${this.currentClient.id}, ${contact.id})">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        <button class="btn btn-text" style="width: 100%; text-align: left; padding: 0.5rem 0.75rem; border: none; border-radius: 0; border-top: 1px solid var(--border-color); color: var(--danger-color);" onclick="crmApp.deleteContact(${this.currentClient.id}, ${contact.id})">
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                    </div>
                                </div>
                                <span style="color: var(--primary-color); font-weight: 500; cursor: pointer;" onclick="crmApp.viewContact(${this.currentClient.id}, ${contact.id})">${contact.name}</span>
                            </div>
                        </td>
                        <td style="padding: 0.75rem;">${contact.phone || '-'}</td>
                        <td style="padding: 0.75rem;">${contact.mobile_phone || '-'}</td>
                        <td style="padding: 0.75rem;">${contact.last_activity ? this.formatDate(contact.last_activity) : '-'}</td>
                    </tr>
                `).join('') : 
                `<tr><td colspan="4" style="padding: 2rem; text-align: center; color: var(--text-secondary);">No contacts found</td></tr>`;
        }

        const countDisplay = document.querySelector('#contactsTab .table-container + div');
        if (countDisplay) {
            countDisplay.innerHTML = `1 - ${filteredContacts.length} of ${this.currentClient.contacts.length}`;
        }
    }

    clearContactSearch() {

        const searchInputs = [
            'contactNameSearch',
            'contactPhoneSearch', 
            'contactMobileSearch',
            'contactActivitySearch'
        ];

        searchInputs.forEach(id => {
            const input = document.getElementById(id);
            if (input) {
                input.value = '';
            }
        });

        this.filterContacts();
    }

    async editTodo(clientId, todoId) {
        console.log('editTodo called with:', clientId, todoId);
        try {

            const client = await this.apiCall(`crm-client&id=${clientId}`);
            const todo = client.todos.find(t => t.id == todoId);

            console.log('Found todo:', todo);

            if (!todo) {
                this.showNotification('Todo not found', 'error');
                return;
            }

            const setElementValue = (id, value) => {
                const element = document.getElementById(id);
                if (element) {
                    element.value = value;
                }
            };

            setElementValue('editTodoTitle', todo.title);
            setElementValue('editTodoDescription', todo.description || '');
            setElementValue('editTodoDueDate', todo.due_date || '');
            setElementValue('editTodoDueTime', todo.due_time || '');
            setElementValue('editTodoPriority', todo.priority);
            setElementValue('editTodoStatus', todo.status || 'pending');

            const editForm = document.getElementById('editTodoForm');
            if (editForm) {
                editForm.setAttribute('data-todo-id', todoId);
                editForm.setAttribute('data-client-id', clientId);
            }

            const editModal = document.getElementById('editTodoModal');
            console.log('Edit modal element:', editModal);
            if (editModal) {
                editModal.style.display = 'block';
                console.log('Edit modal should now be visible');
                console.log('Modal display style:', editModal.style.display);
                console.log('Modal computed style:', window.getComputedStyle(editModal).display);
            } else {
                console.error('Edit todo modal not found');
                this.showNotification('Edit modal not found', 'error');
            }
        } catch (error) {
            console.error('Error loading todo for edit:', error);
            this.showNotification('Error loading todo data', 'error');
        }
    }

    async deleteTodo(clientId, todoId) {
        if (!confirm('Are you sure you want to delete this todo?')) {
            return;
        }

        try {
            await this.apiCall(`crm-todos&client_id=${clientId}&todo_id=${todoId}`, 'DELETE');
            this.showNotification('Todo deleted successfully!', 'success');

            if (this.currentClient) {
                await this.selectClient(this.currentClient.id);
            }
        } catch (error) {
            console.error('Error deleting todo:', error);
            this.showNotification('Error deleting todo', 'error');
        }
    }

    async viewTodo(clientId, todoId) {
        try {

            const client = await this.apiCall(`crm-client&id=${clientId}`);
            const todo = client.todos.find(t => t.id == todoId);

            if (!todo) {
                this.showNotification('Todo not found', 'error');
                return;
            }

            this.currentViewTodo = { clientId, todoId, todo };

            const setElementText = (id, text) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = text;
                }
            };

            setElementText('viewTodoTitle', todo.title);
            setElementText('viewTodoDescription', todo.description || 'No description provided');
            setElementText('viewTodoDueDate', todo.due_date ? this.formatDate(todo.due_date) : 'No due date');
            setElementText('viewTodoDueTime', todo.due_time || 'No due time');
            setElementText('viewTodoPriority', todo.priority);

            let statusText = (todo.status || 'pending').charAt(0).toUpperCase() + (todo.status || 'pending').slice(1);
            setElementText('viewTodoStatus', statusText);

            const completedStatusDiv = document.getElementById('viewTodoCompletedStatus');
            const completedDateDiv = document.getElementById('viewTodoCompletedDate');

            if (todo.status === 'closed' && todo.completed_at) {
                if (completedDateDiv) {
                    completedDateDiv.textContent = this.formatDate(todo.completed_at);
                }
                if (completedStatusDiv) {
                    completedStatusDiv.style.display = 'block';
                }
            } else {
                if (completedStatusDiv) {
                    completedStatusDiv.style.display = 'none';
                }
            }

            setElementText('viewTodoUser', todo.user_name);
            setElementText('viewTodoCreated', this.formatDate(todo.created_at));

            document.getElementById('viewTodoModal').style.display = 'block';
        } catch (error) {
            console.error('Error loading todo for view:', error);
            this.showNotification('Error loading todo data', 'error');
        }
    }

    async viewContact(clientId, contactId) {
        try {

            const client = await this.apiCall(`crm-client&id=${clientId}`);
            const contact = client.contacts.find(c => c.id == contactId);

            if (!contact) {
                this.showNotification('Contact not found', 'error');
                return;
            }

            document.getElementById('viewContactName').textContent = contact.name;
            document.getElementById('viewContactEmail').textContent = contact.email || 'No email provided';
            document.getElementById('viewContactPhone').textContent = contact.phone || 'No phone provided';
            document.getElementById('viewContactMobilePhone').textContent = contact.mobile_phone || 'No mobile phone provided';
            document.getElementById('viewContactPosition').textContent = contact.position || 'No position specified';
            document.getElementById('viewContactPrimary').textContent = contact.is_primary ? 'Yes' : 'No';
            document.getElementById('viewContactBilling').textContent = contact.is_billing_contact ? 'Yes' : 'No';
            document.getElementById('viewContactCreated').textContent = this.formatDate(contact.created_at);

            document.getElementById('viewContactModal').style.display = 'block';
        } catch (error) {
            console.error('Error loading contact for view:', error);
            this.showNotification('Error loading contact data', 'error');
        }
    }

    filterClients() {
        const searchTerm = document.getElementById('clientSearch').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const typeFilter = document.getElementById('typeFilter').value;

        const filteredClients = this.clients.filter(client => {
            const matchesSearch = !searchTerm || 
                client.name.toLowerCase().includes(searchTerm) ||
                client.email.toLowerCase().includes(searchTerm) ||
                (client.contact_name && client.contact_name.toLowerCase().includes(searchTerm));

            const matchesStatus = !statusFilter || client.status === statusFilter;
            const matchesType = !typeFilter || client.company_type === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });

        this.renderFilteredClients(filteredClients);
    }

    renderFilteredClients(clients) {
        const container = document.getElementById('clientTableContainer');

        if (clients.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <h3>No Clients Found</h3>
                    <p>No clients match your current filters.</p>
                </div>
            `;
            return;
        }

        const table = `
            <table class="client-table">
                <thead>
                    <tr>
                        <th>Company</th>
                        <th>Contact</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Account Manager</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${clients.map(client => this.renderClientRow(client)).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = table;
    }

    goToKanban() {
        window.location.href = 'index.html';
    }

    showNotification(message, type = 'info') {

        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        `;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    setupEventListeners() {

        window.onclick = (event) => {
            const modal = document.getElementById('newClientModal');
            if (event.target === modal) {
                this.hideNewClientModal();
            }

            const activityModal = document.getElementById('addActivityModal');
            if (event.target === activityModal) {
                this.hideAddActivityModal();
            }

            const contactModal = document.getElementById('addContactModal');
            if (event.target === contactModal) {
                this.hideAddContactModal();
            }

            const todoModal = document.getElementById('addTodoModal');
            if (event.target === todoModal) {
                this.hideAddTodoModal();
            }

            const editModal = document.getElementById('editClientModal');
            if (event.target === editModal) {
                this.hideEditClientModal();
            }
        };
    }

    hideAddActivityModal() {
        document.getElementById('addActivityModal').style.display = 'none';
        document.getElementById('addActivityForm').reset();
    }

    hideAddContactModal() {
        document.getElementById('addContactModal').style.display = 'none';
        document.getElementById('addContactForm').reset();
    }

    hideAddTodoModal() {
        document.getElementById('addTodoModal').style.display = 'none';
        document.getElementById('addTodoForm').reset();
    }

    hideEditClientModal() {
        document.getElementById('editClientModal').style.display = 'none';
        document.getElementById('editClientForm').reset();
        this.editingClientId = null;
    }

    hideEditContactModal() {
        document.getElementById('editContactModal').style.display = 'none';
        document.getElementById('editContactForm').reset();
    }

    hideEditTodoModal() {
        document.getElementById('editTodoModal').style.display = 'none';
        document.getElementById('editTodoForm').reset();
    }

    hideViewTodoModal() {
        const modal = document.getElementById('viewTodoModal');
        if (modal) {
            modal.style.display = 'none';
        }

        const fields = [
            'viewTodoTitle', 'viewTodoDescription', 'viewTodoDueDate', 
            'viewTodoDueTime', 'viewTodoPriority', 'viewTodoStatus', 
            'viewTodoUser', 'viewTodoCreated', 'viewTodoCompletedDate'
        ];

        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.textContent = '';
            }
        });

        const completedStatusDiv = document.getElementById('viewTodoCompletedStatus');
        if (completedStatusDiv) {
            completedStatusDiv.style.display = 'none';
        }

        this.currentViewTodo = null;
    }

    hideViewContactModal() {
        document.getElementById('viewContactModal').style.display = 'none';
    }

    hideUploadAttachmentModal() {
        const modal = document.getElementById('uploadAttachmentModal');
        if (modal) {
            modal.style.display = 'none';
        }

        const form = document.getElementById('uploadAttachmentForm');
        if (form) {
            form.reset();
        }
    }

    async updateClient(event) {
        event.preventDefault();

        try {
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData.entries());

            await this.apiCall(`crm-client&id=${this.editingClientId}`, 'PUT', data);

            this.hideEditClientModal();
            this.showNotification('Client updated successfully!', 'success');

            await this.loadClients();

            if (this.currentClient && this.currentClient.id === this.editingClientId) {
                await this.selectClient(this.editingClientId);
            }
        } catch (error) {
            console.error('Error updating client:', error);
            this.showNotification('Error updating client', 'error');
        }
    }

    async submitActivity(event) {
        event.preventDefault();

        try {
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData.entries());

            if (this.editingActivityId) {

                await this.apiCall(`crm-activities&client_id=${this.currentClientId}&activity_id=${this.editingActivityId}`, 'PUT', data);
                this.showNotification('Activity updated successfully!', 'success');
                this.editingActivityId = null;
            } else {

                await this.apiCall(`crm-activities&client_id=${this.currentClientId}`, 'POST', data);
                this.showNotification('Activity added successfully!', 'success');
            }

            this.hideAddActivityModal();

            if (this.currentClient) {
                await this.selectClient(this.currentClient.id);
            }
        } catch (error) {
            console.error('Error saving activity:', error);
            this.showNotification('Error saving activity', 'error');
        }
    }

    async submitContact(event) {
        event.preventDefault();

        try {
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData.entries());

            data.is_primary = formData.get('is_primary') === 'on';
            data.is_billing_contact = formData.get('is_billing_contact') === 'on';

            await this.apiCall(`crm-contacts&client_id=${this.currentClientId}`, 'POST', data);

            this.hideAddContactModal();
            this.showNotification('Contact added successfully!', 'success');

            if (this.currentClient) {
                await this.selectClient(this.currentClient.id);
            }
        } catch (error) {
            console.error('Error adding contact:', error);
        }
    }

    async submitTodo(event) {
        event.preventDefault();

        try {
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData.entries());

            await this.apiCall(`crm-todos&client_id=${this.currentClientId}`, 'POST', data);

            this.hideAddTodoModal();
            this.showNotification('To-do added successfully!', 'success');

            if (this.currentClient) {
                await this.selectClient(this.currentClient.id);
            }
        } catch (error) {
            console.error('Error adding todo:', error);
        }
    }

    async submitEditContact(event) {
        event.preventDefault();

        try {
            const form = event.target;
            const contactId = form.getAttribute('data-contact-id');
            const clientId = form.getAttribute('data-client-id');

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            data.is_primary = formData.get('is_primary') === 'on';
            data.is_billing_contact = formData.get('is_billing_contact') === 'on';

            await this.apiCall(`crm-contacts&client_id=${clientId}&contact_id=${contactId}`, 'PUT', data);

            this.hideEditContactModal();
            this.showNotification('Contact updated successfully!', 'success');

            if (this.currentClient) {
                await this.selectClient(this.currentClient.id);
            }
        } catch (error) {
            console.error('Error updating contact:', error);
        }
    }

    async submitEditTodo(event) {
        event.preventDefault();

        try {
            const form = event.target;
            const todoId = form.getAttribute('data-todo-id');
            const clientId = form.getAttribute('data-client-id');

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            data.is_completed = data.status === 'closed';

            data.status = data.status || 'pending';

            await this.apiCall(`crm-todos&client_id=${clientId}&todo_id=${todoId}`, 'PUT', data);

            this.hideEditTodoModal();
            this.showNotification('Todo updated successfully!', 'success');

            if (this.currentClient) {
                await this.selectClient(this.currentClient.id);
            }
        } catch (error) {
            console.error('Error updating todo:', error);
        }
    }
}

const crmApp = new CRMApp();
console.log('CRM App initialized:', crmApp);

function showNewClientModal() {
    crmApp.showNewClientModal();
}

function hideNewClientModal() {
    crmApp.hideNewClientModal();
}

function hideAddActivityModal() {
    crmApp.hideAddActivityModal();
}

function hideAddContactModal() {
    crmApp.hideAddContactModal();
}

function hideAddTodoModal() {
    crmApp.hideAddTodoModal();
}

function addActivity(event) {
    crmApp.submitActivity(event);
}

function addContact(event) {
    crmApp.submitContact(event);
}

function addTodo(event) {
    crmApp.submitTodo(event);
}

function hideEditClientModal() {
    crmApp.hideEditClientModal();
}

function hideEditContactModal() {
    crmApp.hideEditContactModal();
}

function hideEditTodoModal() {
    crmApp.hideEditTodoModal();
}

function submitEditContact(event) {
    crmApp.submitEditContact(event);
}

function submitEditTodo(event) {
    crmApp.submitEditTodo(event);
}

function hideViewTodoModal() {
    crmApp.hideViewTodoModal();
}

function hideViewContactModal() {
    crmApp.hideViewContactModal();
}

function hideUploadAttachmentModal() {
    crmApp.hideUploadAttachmentModal();
}

function submitAttachment(event) {
    crmApp.submitAttachment(event);
}

function editTodoFromView() {
    console.log('editTodoFromView called');
    if (crmApp.currentViewTodo) {
        console.log('Current view todo:', crmApp.currentViewTodo);

        const todoData = { ...crmApp.currentViewTodo };
        crmApp.hideViewTodoModal();

        setTimeout(() => {
            console.log('Calling editTodo with:', todoData.clientId, todoData.todoId);
            crmApp.editTodo(todoData.clientId, todoData.todoId);
        }, 100);
    } else {
        console.log('No currentViewTodo found');
    }
}

function updateClient(event) {
    console.log('Global updateClient function called');
    crmApp.updateClient(event);
}

function filterClients() {
    crmApp.filterClients();
}

function goToKanban() {
    crmApp.goToKanban();
}

function testEditClient(clientId = 1) {
    console.log('Testing edit client with ID:', clientId);
    crmApp.editClient(clientId);
}