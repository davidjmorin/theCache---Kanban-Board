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
        await this.loadUsers();
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
            console.log('Loading clients...');
            const clients = await this.apiCall('crm-clients');
            console.log('Clients data received:', clients);
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

        const cards = `
            <div class="client-cards">
                ${this.clients.map(client => this.renderClientCard(client)).join('')}
            </div>
        `;

        container.innerHTML = cards;
    }

    renderClientCard(client) {
        const statusClass = `status-${client.status || 'active'}`;
        const typeClass = `type-${client.company_type || 'lead'}`;
        
        return `
            <div class="client-card" onclick="crmApp.selectClient(${client.id})">
                <div class="client-card-header">
                    <div class="client-company-info">
                        <h3 class="client-company-name">${client.name}</h3>
                        <p class="client-email">${client.email || 'No email'}</p>
                        </div>
                        </div>
                <div class="client-card-details">
                    <div class="client-detail-row">
                        <span class="client-detail-label">Type:</span>
                        <span class="client-type ${typeClass}">${client.company_type || 'lead'}</span>
                    </div>
                    <div class="client-detail-row">
                        <span class="client-detail-label">Status:</span>
                        <span class="client-status ${statusClass}">${client.status || 'active'}</span>
                    </div>
                    <div class="client-detail-row">
                        <span class="client-detail-label">Contact:</span>
                        <span class="client-detail-value">${client.contact_name || '-'}</span>
                    </div>
                    <div class="client-detail-row">
                        <span class="client-detail-label">Manager:</span>
                        <span class="client-detail-value">${client.account_manager_name || '-'}</span>
                    </div>
                </div>
                <div class="client-card-actions">
                    <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); crmApp.editClient(${client.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); crmApp.viewClient(${client.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
            </div>
        `;
    }



    async selectClient(clientId) {
        try {
            console.log('Selecting client with ID:', clientId);
            const client = await this.apiCall(`crm-client&id=${clientId}`);
            console.log('Client data received:', client);
            if (client && client.id) {
                this.currentClient = client; // Set the current client
                this.showClientDetail(client);
            } else {
                console.error('Invalid client data:', client);
                this.showNotification('Failed to load client details', 'error');
            }
        } catch (error) {
            console.error('Error loading client details:', error);
            this.showNotification('Error loading client details', 'error');
        }
    }

    showClientDetail(client) {
        document.getElementById('clientList').style.display = 'none';
        document.getElementById('clientDetail').classList.add('active');
        
        const fullAddress = this.formatAddress(client);
        
        // Find primary contact
        const primaryContact = client.contacts ? client.contacts.find(contact => contact.is_primary == 1) : null;
        
        document.getElementById('mainTitle').textContent = client.name;
        
        const detailContent = `
            <div class="client-detail-header">
                <div class="client-header-main">
                    <div class="client-title-section">
                        <h2>${client.name}</h2>
                        <div class="client-badges">
                            ${client.company_type ? `<span class="client-type type-${client.company_type}">${client.company_type}</span>` : ''}
                            ${client.status ? `<span class="client-status status-${client.status}">${client.status}</span>` : ''}
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="crmApp.editClient(${client.id})">
                        <i class="fas fa-edit"></i> Edit Client
                    </button>
                </div>
                
                <div class="client-info-grid">
                    <div class="client-info-card">
                        <div class="info-card-header">
                            <i class="fas fa-info-circle"></i>
                            <span>Contact Information</span>
                        </div>
                        <div class="info-card-content">
                            <div class="info-item">
                                <i class="fas fa-envelope"></i>
                                <span>${client.email || 'No email'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-phone"></i>
                                <span>${client.contact_number || 'No phone'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span>${fullAddress}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="client-info-card">
                        <div class="info-card-header">
                            <i class="fas fa-users"></i>
                            <span>Team</span>
                        </div>
                        <div class="info-card-content">
                            ${client.account_manager_name ? `
                                <div class="info-item">
                                    <i class="fas fa-user-tie"></i>
                                    <span>Account Manager: ${client.account_manager_name}</span>
                                </div>
                            ` : ''}
                            ${primaryContact ? `
                                <div class="info-item">
                                    <i class="fas fa-user"></i>
                                    <span>Primary Contact: ${primaryContact.name}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>

            <div class="client-tabs">
                <button class="client-tab active" onclick="crmApp.switchTab('activity', event)">Activity</button>
                <button class="client-tab" onclick="crmApp.switchTab('contacts', event)">Contacts (${client.contacts?.length || 0})</button>
                <button class="client-tab" onclick="crmApp.switchTab('tasks', event)">Open Tasks (${client.tasks?.length || 0})</button>
                <button class="client-tab" onclick="crmApp.switchTab('todos', event)">To-Dos (${client.todos?.length || 0})</button>
                <button class="client-tab" onclick="crmApp.switchTab('attachments', event)">Attachments (${client.attachments?.length || 0})</button>
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

    switchTab(tabName, event = null) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.client-tab').forEach(tab => tab.classList.remove('active'));
        
        // Add active class to selected tab and content
        const tabContent = document.getElementById(tabName + 'Tab');
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        // Add active class to the clicked tab button
        if (event && event.target) {
            event.target.classList.add('active');
        } else {
            // Fallback: find the tab button by onclick attribute
            const tabButton = document.querySelector(`.client-tab[onclick*="${tabName}"]`);
            if (tabButton) {
                tabButton.classList.add('active');
            }
        }
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
                                    <div class="activity-avatar">${activity.user_name ? activity.user_name.charAt(0).toUpperCase() : 'U'}</div>
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
                        <button class="btn btn-secondary" onclick="crmApp.exportContacts(${client.id})">
                            <i class="fas fa-download"></i> Export <i class="fas fa-chevron-down"></i>
                        </button>
                        <button class="btn btn-icon" title="Grid View" onclick="crmApp.toggleContactView()">
                            <i class="fas fa-th"></i>
                        </button>
                        <button class="btn btn-icon" title="Refresh" onclick="crmApp.refreshContactsTab()">
                            <i class="fas fa-sync-alt"></i>
                </button>
            </div>
                </div>

                <div style="margin: 1rem 0; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <label style="display: inline-block; margin-right: 0.5rem; font-weight: 500;">Status:</label>
                        <select id="contactStatusFilter" style="padding: 0.25rem 0.5rem; border: 1px solid var(--border-color); border-radius: 4px;" onchange="crmApp.filterContactsByStatus()">
                            <option value="all">All</option>
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
                    
                    <!-- Grid view cards (hidden by default) -->
                    <div class="contact-grid" style="display: none;">
                        ${client.contacts && client.contacts.length > 0 ? 
                            client.contacts.map(contact => `
                                <div class="contact-card">
                                    <div class="contact-name" onclick="crmApp.viewContact(${client.id}, ${contact.id})">${contact.name}</div>
                                    <div class="contact-info">
                                        ${contact.email ? `<div><i class="fas fa-envelope"></i> ${contact.email}</div>` : ''}
                                        ${contact.phone ? `<div><i class="fas fa-phone"></i> ${contact.phone}</div>` : ''}
                                        ${contact.mobile_phone ? `<div><i class="fas fa-mobile-alt"></i> ${contact.mobile_phone}</div>` : ''}
                                        ${contact.position ? `<div><i class="fas fa-briefcase"></i> ${contact.position}</div>` : ''}
                                        ${contact.last_activity ? `<div><i class="fas fa-clock"></i> ${this.formatDate(contact.last_activity)}</div>` : ''}
                                    </div>
                                    <div class="contact-actions">
                                        <button class="btn btn-sm btn-secondary" onclick="crmApp.viewContact(${client.id}, ${contact.id})">
                                            <i class="fas fa-eye"></i> View
                                        </button>
                                        <button class="btn btn-sm btn-secondary" onclick="crmApp.editContact(${client.id}, ${contact.id})">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="crmApp.deleteContact(${client.id}, ${contact.id})">
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                    </div>
                                </div>
                            `).join('') : 
                            `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-secondary); padding: 2rem;">No contacts found</div>`
                        }
                    </div>
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
        
        console.log('createClient function called');
        
        try {
            const formData = new FormData(event.target);
            const data = Object.fromEntries(formData.entries());
            
            console.log('Form data:', data);
            
            // Validate required fields
            if (!data.name || !data.email) {
                this.showNotification('Name and email are required', 'error');
                return;
            }
            
            console.log('Making API call to create client...');
            const result = await this.apiCall('crm-clients', 'POST', data);
            console.log('API response:', result);
            
            this.hideNewClientModal();
            this.showNotification('Client created successfully!', 'success');
            
            // Refresh the client list to show the new client
            await this.refreshClientList();
        } catch (error) {
            console.error('Error creating client:', error);
            this.showNotification('Error creating client: ' + error.message, 'error');
        }
    }

    async editClient(clientId) {
        try {
            const client = await this.apiCall(`crm-client&id=${clientId}`);
            
            const modal = document.getElementById('editClientModal');
            if (!modal) {
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
            
            // Ensure account manager dropdown is populated before setting the value
            const editAccountManagerSelect = document.getElementById('editAccountManager');
            if (editAccountManagerSelect) {
                // If users haven't been loaded yet, load them first
                if (!this.users || this.users.length === 0) {
                    await this.loadUsers();
                }
                
                // Populate the dropdown if it's empty
                if (editAccountManagerSelect.options.length <= 1) {
                    this.populateAccountManagerDropdown();
                }
                
                // Now set the account manager value - convert to string for comparison
                const accountManagerId = client.account_manager_id ? String(client.account_manager_id) : '';
                
                // Find the option with the matching value
                let found = false;
                for (let i = 0; i < editAccountManagerSelect.options.length; i++) {
                    const option = editAccountManagerSelect.options[i];
                    if (option.value === accountManagerId) {
                        editAccountManagerSelect.selectedIndex = i;
                        found = true;
                        break;
                    }
                }
                
                if (!found) {
                    editAccountManagerSelect.value = '';
                }
            }

            this.editingClientId = clientId;
            modal.style.display = 'block';
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

        // Set data attributes for the form
        const form = document.getElementById('addActivityForm');
        if (form) {
            form.setAttribute('data-client-id', clientId);
            form.removeAttribute('data-activity-id'); // Clear any existing activity ID
        }

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

            // Set data attributes for the form
            const form = document.getElementById('addActivityForm');
            if (form) {
                form.setAttribute('data-client-id', clientId);
                form.setAttribute('data-activity-id', activityId);
            }

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

            // Refresh only the activities tab
            await this.refreshActivitiesTab();
        } catch (error) {
            console.error('Error deleting activity:', error);
            this.showNotification('Error deleting activity: ' + error.message, 'error');
        }
    }

    async addContact(clientId) {
        this.currentClientId = clientId;
        const form = document.getElementById('addContactForm');
        if (form) {
            form.setAttribute('data-client-id', clientId);
        }
        document.getElementById('addContactModal').style.display = 'block';
    }

    async createTask(clientId) {

        window.location.href = `index.html?client=${clientId}`;
    }

    async addTodo(clientId) {
        this.currentClientId = clientId;
        const form = document.getElementById('addTodoForm');
        if (form) {
            form.setAttribute('data-client-id', clientId);
        }
        document.getElementById('addTodoModal').style.display = 'block';
    }

    async uploadAttachment(clientId) {
        this.currentClientId = clientId;
        const form = document.getElementById('uploadAttachmentForm');
        if (form) {
            form.setAttribute('data-client-id', clientId);
        }
        document.getElementById('uploadAttachmentModal').style.display = 'block';
    }

    async downloadAttachment(filename) {
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

            // Refresh only the attachments tab
            await this.refreshAttachmentsTab();
        } catch (error) {
            console.error('Error deleting attachment:', error);
            this.showNotification('Error deleting attachment: ' + error.message, 'error');
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

            // Refresh only the contacts tab
            await this.refreshContactsTab();
        } catch (error) {
            console.error('Error deleting contact:', error);
            this.showNotification('Error deleting contact: ' + error.message, 'error');
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

            // Refresh only the todos tab
            await this.refreshTodosTab();
        } catch (error) {
            console.error('Error deleting todo:', error);
            this.showNotification('Error deleting todo: ' + error.message, 'error');
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

        const cards = `
            <div class="client-cards">
                ${clients.map(client => this.renderClientCard(client)).join('')}
            </div>
        `;

        container.innerHTML = cards;
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
        // CSV file input event listener
        const csvFileInput = document.getElementById('csvFile');
        if (csvFileInput) {
            csvFileInput.addEventListener('change', (event) => {
                this.handleCsvFileSelect(event);
            });
        }

        // Skip first row checkbox event listener
        const skipFirstRowCheckbox = document.getElementById('skipFirstRow');
        if (skipFirstRowCheckbox) {
            skipFirstRowCheckbox.addEventListener('change', () => {
                const csvFileInput = document.getElementById('csvFile');
                if (csvFileInput.files.length > 0) {
                    this.handleCsvFileSelect({ target: csvFileInput });
                }
            });
        }

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

            const csvModal = document.getElementById('csvUploadModal');
            if (event.target === csvModal) {
                this.hideCsvUploadModal();
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

    // AJAX refresh methods for individual tabs
    async refreshContactsTab() {
        if (!this.currentClient) return;
        
        try {
            // Fetch updated client data
            const client = await this.apiCall(`crm-client&id=${this.currentClient.id}`);
            this.currentClient = client;
            
            // Update only the contacts tab content
            const contactsTab = document.getElementById('contactsTab');
            if (contactsTab) {
                contactsTab.innerHTML = this.renderContactsTab(client);
            }
            
            // Update the contacts count in the tab button
            const contactsTabButton = document.querySelector('.client-tab[onclick*="contacts"]');
            if (contactsTabButton) {
                contactsTabButton.textContent = `Contacts (${client.contacts?.length || 0})`;
            }
        } catch (error) {
            console.error('Error refreshing contacts tab:', error);
        }
    }

    async refreshTodosTab() {
        if (!this.currentClient) return;
        
        try {
            // Fetch updated client data
            const client = await this.apiCall(`crm-client&id=${this.currentClient.id}`);
            this.currentClient = client;
            
            // Update only the todos tab content
            const todosTab = document.getElementById('todosTab');
            if (todosTab) {
                todosTab.innerHTML = this.renderTodosTab(client);
            }
            
            // Update the todos count in the tab button
            const todosTabButton = document.querySelector('.client-tab[onclick*="todos"]');
            if (todosTabButton) {
                todosTabButton.textContent = `To-Dos (${client.todos?.length || 0})`;
            }
        } catch (error) {
            console.error('Error refreshing todos tab:', error);
        }
    }

    async refreshActivitiesTab() {
        if (!this.currentClient) return;
        
        try {
            // Fetch updated client data
            const client = await this.apiCall(`crm-client&id=${this.currentClient.id}`);
            this.currentClient = client;
            
            // Update only the activities tab content
            const activitiesTab = document.getElementById('activityTab');
            if (activitiesTab) {
                activitiesTab.innerHTML = this.renderActivityTab(client);
            }
            
            // Update the activities count in the tab button
            const activitiesTabButton = document.querySelector('.client-tab[onclick*="activity"]');
            if (activitiesTabButton) {
                activitiesTabButton.textContent = `Activities (${client.activities?.length || 0})`;
            }
        } catch (error) {
            console.error('Error refreshing activities tab:', error);
        }
    }

    async refreshTasksTab() {
        if (!this.currentClient) return;
        
        try {
            // Fetch updated client data
            const client = await this.apiCall(`crm-client&id=${this.currentClient.id}`);
            this.currentClient = client;
            
            // Update only the tasks tab content
            const tasksTab = document.getElementById('tasksTab');
            if (tasksTab) {
                tasksTab.innerHTML = this.renderTasksTab(client);
            }
            
            // Update the tasks count in the tab button
            const tasksTabButton = document.querySelector('.client-tab[onclick*="tasks"]');
            if (tasksTabButton) {
                tasksTabButton.textContent = `Open Tasks (${client.tasks?.length || 0})`;
            }
        } catch (error) {
            console.error('Error refreshing tasks tab:', error);
        }
    }

    async refreshAttachmentsTab() {
        if (!this.currentClient) return;
        
        try {
            // Fetch updated client data
            const client = await this.apiCall(`crm-client&id=${this.currentClient.id}`);
            this.currentClient = client;
            
            // Update only the attachments tab content
            const attachmentsTab = document.getElementById('attachmentsTab');
            if (attachmentsTab) {
                attachmentsTab.innerHTML = this.renderAttachmentsTab(client);
            }
            
            // Update the attachments count in the tab button
            const attachmentsTabButton = document.querySelector('.client-tab[onclick*="attachments"]');
            if (attachmentsTabButton) {
                attachmentsTabButton.textContent = `Attachments (${client.attachments?.length || 0})`;
            }
        } catch (error) {
            console.error('Error refreshing attachments tab:', error);
        }
    }

    async refreshClientList() {
        try {
            await this.loadClients();
        } catch (error) {
            console.error('Error refreshing client list:', error);
        }
    }

    // Enhanced submit functions with AJAX refresh
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

            // Refresh only the contacts tab
            await this.refreshContactsTab();
        } catch (error) {
            console.error('Error updating contact:', error);
            this.showNotification('Error updating contact: ' + error.message, 'error');
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

            // Refresh only the todos tab
            await this.refreshTodosTab();
        } catch (error) {
            console.error('Error updating todo:', error);
            this.showNotification('Error updating todo: ' + error.message, 'error');
        }
    }

    async submitContact(event) {
        event.preventDefault();
        
        try {
            const form = event.target;
            const clientId = form.getAttribute('data-client-id');

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            data.is_primary = formData.get('is_primary') === 'on';
            data.is_billing_contact = formData.get('is_billing_contact') === 'on';
            
            await this.apiCall(`crm-contacts&client_id=${clientId}`, 'POST', data);
            
            this.hideAddContactModal();
            this.showNotification('Contact added successfully!', 'success');
            
            // Refresh only the contacts tab
            await this.refreshContactsTab();
        } catch (error) {
            console.error('Error adding contact:', error);
            this.showNotification('Error adding contact: ' + error.message, 'error');
        }
    }

    async submitTodo(event) {
        event.preventDefault();
        
        try {
            const form = event.target;
            const clientId = form.getAttribute('data-client-id');

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            await this.apiCall(`crm-todos&client_id=${clientId}`, 'POST', data);
            
            this.hideAddTodoModal();
            this.showNotification('Todo added successfully!', 'success');

            // Refresh only the todos tab
            await this.refreshTodosTab();
        } catch (error) {
            console.error('Error adding todo:', error);
            this.showNotification('Error adding todo: ' + error.message, 'error');
        }
    }

    async submitActivity(event) {
        event.preventDefault();

        try {
            const form = event.target;
            const clientId = form.getAttribute('data-client-id');
            const activityId = form.getAttribute('data-activity-id');

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            if (activityId) {
                // Update existing activity
                await this.apiCall(`crm-activities&client_id=${clientId}&activity_id=${activityId}`, 'PUT', data);
                this.showNotification('Activity updated successfully!', 'success');
            } else {
                // Add new activity
                await this.apiCall(`crm-activities&client_id=${clientId}`, 'POST', data);
                this.showNotification('Activity added successfully!', 'success');
            }

            this.hideAddActivityModal();
            
            // Refresh only the activities tab
            await this.refreshActivitiesTab();
        } catch (error) {
            console.error('Error saving activity:', error);
            this.showNotification('Error saving activity: ' + error.message, 'error');
        }
    }

    async deleteContact(clientId, contactId) {
        if (!confirm('Are you sure you want to delete this contact?')) {
            return;
        }

        try {
            await this.apiCall(`crm-contacts&client_id=${clientId}&contact_id=${contactId}`, 'DELETE');
            this.showNotification('Contact deleted successfully!', 'success');

            // Refresh only the contacts tab
            await this.refreshContactsTab();
        } catch (error) {
            console.error('Error deleting contact:', error);
            this.showNotification('Error deleting contact: ' + error.message, 'error');
        }
    }

    async deleteTodo(clientId, todoId) {
        if (!confirm('Are you sure you want to delete this todo?')) {
            return;
        }

        try {
            await this.apiCall(`crm-todos&client_id=${clientId}&todo_id=${todoId}`, 'DELETE');
            this.showNotification('Todo deleted successfully!', 'success');

            // Refresh only the todos tab
            await this.refreshTodosTab();
        } catch (error) {
            console.error('Error deleting todo:', error);
            this.showNotification('Error deleting todo: ' + error.message, 'error');
        }
    }

    async deleteActivity(clientId, activityId) {
        if (!confirm('Are you sure you want to delete this activity?')) {
            return;
        }

        try {
            await this.apiCall(`crm-activities&client_id=${clientId}&activity_id=${activityId}`, 'DELETE');
            this.showNotification('Activity deleted successfully!', 'success');

            // Refresh only the activities tab
            await this.refreshActivitiesTab();
        } catch (error) {
            console.error('Error deleting activity:', error);
            this.showNotification('Error deleting activity: ' + error.message, 'error');
        }
    }

    async deleteAttachment(clientId, attachmentId) {
        if (!confirm('Are you sure you want to delete this attachment?')) {
            return;
        }

        try {
            await this.apiCall(`crm-attachments&client_id=${clientId}&attachment_id=${attachmentId}`, 'DELETE');
            this.showNotification('Attachment deleted successfully!', 'success');

            // Refresh only the attachments tab
            await this.refreshAttachmentsTab();
        } catch (error) {
            console.error('Error deleting attachment:', error);
            this.showNotification('Error deleting attachment: ' + error.message, 'error');
        }
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

            // Refresh only the attachments tab
            await this.refreshAttachmentsTab();

        } catch (error) {
            console.error('Error uploading attachment:', error);
            this.showNotification('Error uploading attachment: ' + error.message, 'error');
        } finally {
            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Upload Attachment';
            submitBtn.disabled = false;
        }
    }

    async updateClient(event) {
        event.preventDefault();

        try {
            const form = event.target;
            const clientId = this.editingClientId;

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            await this.apiCall(`crm-client&id=${clientId}`, 'PUT', data);

            this.hideEditClientModal();
            this.showNotification('Client updated successfully!', 'success');

            // Refresh the client list to show updated client
            await this.refreshClientList();
            
            // If this is the currently selected client, refresh the detail view
            if (this.currentClient && this.currentClient.id == clientId) {
                await this.refreshAllTabs();
            }
        } catch (error) {
            console.error('Error updating client:', error);
            this.showNotification('Error updating client: ' + error.message, 'error');
        }
    }

    // CSV Upload functionality
    showCsvUploadModal() {
        document.getElementById('csvUploadModal').style.display = 'block';
        this.resetCsvUploadForm();
    }

    hideCsvUploadModal() {
        document.getElementById('csvUploadModal').style.display = 'none';
        this.resetCsvUploadForm();
    }

    resetCsvUploadForm() {
        document.getElementById('csvUploadForm').reset();
        document.getElementById('csvMappingContainer').style.display = 'none';
        document.getElementById('csvPreview').innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Upload a CSV file to see preview</p>';
    }

    async handleCsvFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            this.showNotification('File size must be less than 10MB', 'error');
            return;
        }

        try {
            const text = await file.text();
            const csvData = this.parseCsv(text);
            
            if (csvData.length === 0) {
                this.showNotification('CSV file is empty or invalid', 'error');
                return;
            }

            this.displayCsvPreview(csvData);
            this.setupColumnMapping(csvData[0]);
        } catch (error) {
            console.error('Error reading CSV file:', error);
            this.showNotification('Error reading CSV file', 'error');
        }
    }

    parseCsv(text) {
        const lines = text.split('\n').filter(line => line.trim());
        return lines.map(line => {
            // Handle quoted fields and commas within quotes
            const result = [];
            let current = '';
            let inQuotes = false;
            
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            
            result.push(current.trim());
            return result;
        });
    }

    displayCsvPreview(csvData) {
        const preview = document.getElementById('csvPreview');
        const skipFirstRow = document.getElementById('skipFirstRow').checked;
        const dataToShow = skipFirstRow ? csvData.slice(1, 6) : csvData.slice(0, 5);

        if (dataToShow.length === 0) {
            preview.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No data to preview</p>';
            return;
        }

        const headers = skipFirstRow ? csvData[0] : dataToShow[0];
        const rows = skipFirstRow ? dataToShow : dataToShow.slice(1);

        let tableHtml = '<table><thead><tr>';
        headers.forEach(header => {
            tableHtml += `<th>${this.escapeHtml(header)}</th>`;
        });
        tableHtml += '</tr></thead><tbody>';

        rows.forEach(row => {
            tableHtml += '<tr>';
            row.forEach(cell => {
                tableHtml += `<td>${this.escapeHtml(cell)}</td>`;
            });
            tableHtml += '</tr>';
        });

        tableHtml += '</tbody></table>';
        preview.innerHTML = tableHtml;
    }

    setupColumnMapping(headers) {
        const mappingContainer = document.getElementById('csvMappingContainer');
        mappingContainer.style.display = 'block';

        // Clear existing options
        const selects = mappingContainer.querySelectorAll('select');
        selects.forEach(select => {
            select.innerHTML = '<option value="">Select column...</option>';
        });

        // Add header options to each select
        headers.forEach((header, index) => {
            selects.forEach(select => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = header;
                select.appendChild(option);
            });
        });

        // Auto-map common column names
        this.autoMapColumns(headers);
    }

    autoMapColumns(headers) {
        console.log('Auto-mapping headers:', headers);
        
        const mappings = {
            'company': 'mapCompanyName',
            'company name': 'mapCompanyName',
            'name': 'mapCompanyName',
            'email': 'mapEmail',
            'phone': 'mapPhone',
            'telephone': 'mapPhone',
            'web': 'mapWebsite',
            'website': 'mapWebsite',
            'url': 'mapWebsite',
            'address': 'mapAddress',
            'address 1': 'mapAddress',
            'street': 'mapAddress',
            'city': 'mapCity',
            'state': 'mapState',
            'zip': 'mapZipCode',
            'zip code': 'mapZipCode',
            'postal code': 'mapZipCode',
            'classification': 'mapClassification',
            'company type': 'mapCompanyType',
            'type': 'mapCompanyType'
        };

        headers.forEach((header, index) => {
            const headerLower = header.toLowerCase().trim();
            console.log(`Checking header: "${header}" -> "${headerLower}"`);
            
            if (mappings[headerLower]) {
                const select = document.getElementById(mappings[headerLower]);
                if (select) {
                    select.value = index;
                    console.log(`Auto-mapped "${header}" to ${mappings[headerLower]} (index ${index})`);
                } else {
                    console.log(`Select element not found for ${mappings[headerLower]}`);
                }
            } else {
                console.log(`No mapping found for "${headerLower}"`);
            }
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    async submitCsvUpload(event) {
        event.preventDefault();

        const fileInput = document.getElementById('csvFile');
        const file = fileInput.files[0];

        if (!file) {
            this.showNotification('Please select a CSV file', 'error');
            return;
        }

        // Validate required mappings
        const requiredMappings = ['mapCompanyName'];
        const missingMappings = requiredMappings.filter(id => {
            const select = document.getElementById(id);
            const hasValue = select && select.value !== '';
            console.log(`Checking ${id}: ${hasValue ? 'has value' : 'missing value'}`);
            return !hasValue;
        });

        if (missingMappings.length > 0) {
            console.log('Missing mappings:', missingMappings);
            this.showNotification('Please map the Company Name column', 'error');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('csv_file', file);
            
            // Add mapping data - use the exact field names from the HTML
            const mappingFields = [
                { id: 'mapCompanyName', field: 'map_company_name' },
                { id: 'mapEmail', field: 'map_email' },
                { id: 'mapPhone', field: 'map_phone' },
                { id: 'mapWebsite', field: 'map_website' },
                { id: 'mapAddress', field: 'map_address' },
                { id: 'mapCity', field: 'map_city' },
                { id: 'mapState', field: 'map_state' },
                { id: 'mapZipCode', field: 'map_zip_code' },
                { id: 'mapClassification', field: 'map_classification' },
                { id: 'mapCompanyType', field: 'map_company_type' }
            ];

            console.log('Sending mappings:');
            mappingFields.forEach(mapping => {
                const select = document.getElementById(mapping.id);
                if (select && select.value !== '') {
                    formData.append(mapping.field, select.value);
                    console.log(`${mapping.field}: ${select.value}`);
                }
            });

            // Add other form data
            formData.append('skip_first_row', document.getElementById('skipFirstRow').checked ? '1' : '0');

            const submitBtn = event.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Importing...';
            submitBtn.disabled = true;

            const response = await fetch('api.php?endpoint=crm-csv-import', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                let errorMessage = 'Import failed';
                try {
                    const errorResult = await response.json();
                    errorMessage = errorResult.error || errorMessage;
                } catch (jsonError) {
                    errorMessage = response.statusText || errorMessage;
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            
            this.hideCsvUploadModal();
            this.showNotification(`Successfully imported ${result.imported_count} clients!`, 'success');
            
            // Refresh the client list
            await this.refreshClientList();

        } catch (error) {
            console.error('Error importing CSV:', error);
            this.showNotification('Error importing CSV: ' + error.message, 'error');
        } finally {
            const submitBtn = event.target.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Import Clients';
            submitBtn.disabled = false;
        }
    }

    async loadUsers() {
        try {
            const users = await this.apiCall('crm-users');
            this.users = users;
            this.populateAccountManagerDropdown();
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }

    populateAccountManagerDropdown() {
        const accountManagerSelect = document.getElementById('accountManager');
        const editAccountManagerSelect = document.getElementById('editAccountManager');
        
        if (this.users) {
            // Populate new client modal
            if (accountManagerSelect) {
                accountManagerSelect.innerHTML = '<option value="">Select Account Manager...</option>';
                this.users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.name;
                    accountManagerSelect.appendChild(option);
                });
            }
            
            // Populate edit client modal
            if (editAccountManagerSelect) {
                // Store the current value before repopulating
                const currentValue = editAccountManagerSelect.value;
                
                editAccountManagerSelect.innerHTML = '<option value="">Select Account Manager...</option>';
                this.users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id;
                    option.textContent = user.name;
                    editAccountManagerSelect.appendChild(option);
                });
                
                // Restore the value if it was set
                if (currentValue) {
                    editAccountManagerSelect.value = currentValue;
                }
            }
        }
    }

    // New method to refresh all tabs for the current client
    async refreshAllTabs() {
        if (!this.currentClient) return;
        
        try {
            // Fetch updated client data
            const client = await this.apiCall(`crm-client&id=${this.currentClient.id}`);
            this.currentClient = client;
            
            // Update all tab contents
            const contactsTab = document.getElementById('contactsTab');
            if (contactsTab) {
                contactsTab.innerHTML = this.renderContactsTab(client);
            }
            
            const todosTab = document.getElementById('todosTab');
            if (todosTab) {
                todosTab.innerHTML = this.renderTodosTab(client);
            }
            
            const activitiesTab = document.getElementById('activityTab');
            if (activitiesTab) {
                activitiesTab.innerHTML = this.renderActivityTab(client);
            }
            
            const tasksTab = document.getElementById('tasksTab');
            if (tasksTab) {
                tasksTab.innerHTML = this.renderTasksTab(client);
            }
            
            const attachmentsTab = document.getElementById('attachmentsTab');
            if (attachmentsTab) {
                attachmentsTab.innerHTML = this.renderAttachmentsTab(client);
            }
            
            // Update all tab button counts
            this.updateTabCounts(client);
        } catch (error) {
            console.error('Error refreshing all tabs:', error);
        }
    }

    // New method to update tab counts
    updateTabCounts(client) {
        const contactsTabButton = document.querySelector('.client-tab[onclick*="contacts"]');
        if (contactsTabButton) {
            contactsTabButton.textContent = `Contacts (${client.contacts?.length || 0})`;
        }
        
        const todosTabButton = document.querySelector('.client-tab[onclick*="todos"]');
        if (todosTabButton) {
            todosTabButton.textContent = `To-Dos (${client.todos?.length || 0})`;
        }
        
        const activitiesTabButton = document.querySelector('.client-tab[onclick*="activity"]');
        if (activitiesTabButton) {
            activitiesTabButton.textContent = `Activities (${client.activities?.length || 0})`;
        }
        
        const tasksTabButton = document.querySelector('.client-tab[onclick*="tasks"]');
        if (tasksTabButton) {
            tasksTabButton.textContent = `Open Tasks (${client.tasks?.length || 0})`;
        }
        
        const attachmentsTabButton = document.querySelector('.client-tab[onclick*="attachments"]');
        if (attachmentsTabButton) {
            attachmentsTabButton.textContent = `Attachments (${client.attachments?.length || 0})`;
        }
    }

    // Contact filtering and export functionality
    filterContactsByStatus() {
        const statusFilter = document.getElementById('contactStatusFilter');
        const status = statusFilter ? statusFilter.value : 'all';
        
        // Filter table rows
        const contactRows = document.querySelectorAll('#contactsTab tbody tr');
        let visibleCount = 0;
        
        contactRows.forEach(row => {
            const contactName = row.querySelector('span')?.textContent || '';
            const isActive = contactName.includes('(Active)') || !contactName.includes('(Inactive)');
            
            let shouldShow = true;
            
            if (status === 'active') {
                shouldShow = isActive;
            } else if (status === 'inactive') {
                shouldShow = !isActive;
            }
            // 'all' shows everything
            
            row.style.display = shouldShow ? '' : 'none';
            if (shouldShow) visibleCount++;
        });
        
        // Filter grid cards
        const contactCards = document.querySelectorAll('#contactsTab .contact-card');
        contactCards.forEach(card => {
            const contactName = card.querySelector('.contact-name')?.textContent || '';
            const isActive = contactName.includes('(Active)') || !contactName.includes('(Inactive)');
            
            let shouldShow = true;
            
            if (status === 'active') {
                shouldShow = isActive;
            } else if (status === 'inactive') {
                shouldShow = !isActive;
            }
            // 'all' shows everything
            
            card.style.display = shouldShow ? '' : 'none';
        });
        
        // Update the count display
        const countDisplay = document.querySelector('#contactsTab .table-container + div');
        if (countDisplay) {
            countDisplay.textContent = `1 - ${visibleCount} of ${visibleCount}`;
        }
    }

    async exportContacts(clientId) {
        try {
            const client = await this.apiCall(`crm-client&id=${clientId}`);
            if (!client.contacts || client.contacts.length === 0) {
                this.showNotification('No contacts to export', 'info');
                return;
            }

            // Create CSV content
            const headers = ['Name', 'Email', 'Phone', 'Mobile Phone', 'Position', 'Primary Contact', 'Billing Contact', 'Last Activity'];
            const csvContent = [
                headers.join(','),
                ...client.contacts.map(contact => [
                    `"${contact.name || ''}"`,
                    `"${contact.email || ''}"`,
                    `"${contact.phone || ''}"`,
                    `"${contact.mobile_phone || ''}"`,
                    `"${contact.position || ''}"`,
                    contact.is_primary ? 'Yes' : 'No',
                    contact.is_billing_contact ? 'Yes' : 'No',
                    `"${contact.last_activity ? this.formatDate(contact.last_activity) : ''}"`
                ].join(','))
            ].join('\n');

            // Create and download file
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${client.name}_contacts.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.showNotification('Contacts exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting contacts:', error);
            this.showNotification('Error exporting contacts: ' + error.message, 'error');
        }
    }

    toggleContactView() {
        const tableContainer = document.querySelector('#contactsTab .table-container');
        if (!tableContainer) return;

        const table = tableContainer.querySelector('table');
        const grid = tableContainer.querySelector('.contact-grid');
        
        if (table && grid) {
            if (table.style.display === 'none') {
                // Switch to table view
                table.style.display = '';
                grid.style.display = 'none';
                this.showNotification('Switched to table view', 'info');
            } else {
                // Switch to grid view
                table.style.display = 'none';
                grid.style.display = 'grid';
                this.showNotification('Switched to grid view', 'info');
            }
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