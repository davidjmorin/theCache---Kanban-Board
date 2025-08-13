class CRMApp {
    constructor() {
        this.apiBase = 'api.php?endpoint=';
        this.currentClient = null;
        this.clients = [];
        this.currentUser = null;
        this.userPreferences = {};
        this.init();
    }

    async init() {
        await this.checkAuthentication();
        await this.loadUserPreferences();
        this.updateNavigationVisibility();
        await this.loadClients();
        await this.loadUsers();
        this.setupEventListeners();
        this.setupDropdowns();
        
        const urlParams = new URLSearchParams(window.location.search);
        const clientId = urlParams.get('client');
        const tabName = urlParams.get('tab');
        
        if (clientId) {
            const client = this.clients.find(c => c.id == clientId);
            if (client) {
                await this.selectClient(clientId);
                if (tabName) {
                    setTimeout(() => {
                        this.switchTab(tabName);
                    }, 100);
                }
            } else {
                try {
                    await this.selectClient(clientId);
                    if (tabName) {
                        setTimeout(() => {
                            this.switchTab(tabName);
                        }, 100);
                    }
                } catch (error) {
                    console.error('Failed to load client:', error);
                    this.showNotification('Client not found', 'error');
                }
            }
        }
    }

    async checkAuthentication() {
        try {
            const response = await this.apiCall('check-auth');
            if (response.authenticated) {
                this.currentUser = response.user;
                this.updateUserDisplay();
            } else {
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Auth check failed:', error);

            if (error.message.includes('Authentication required') || error.message.includes('401')) {
                window.location.href = '/';
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
                },
                credentials: 'include' // Include cookies for session management
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

    async apiCallFormData(endpoint, method = 'POST', formData = null) {
        try {
            const options = {
                method,
                credentials: 'include' // Include cookies for session management
            };

            if (formData && method !== 'GET') {
                options.body = formData;
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
            this.clients = clients || [];
            
            // Wait for DOM to be ready
            this.waitForElement('clientTableContainer', () => {
                this.renderClientTable();
                this.updateCRMStats();
            });
        } catch (error) {
            console.error('Error loading clients:', error);
        }
    }

    waitForElement(elementId, callback, maxAttempts = 50) {
        let attempts = 0;
        const checkElement = () => {
            attempts++;
            const element = document.getElementById(elementId);
            if (element) {
                console.log(`Element ${elementId} found after ${attempts} attempts`);
                console.log('Element details:', {
                    id: element.id,
                    className: element.className,
                    style: element.style.cssText,
                    display: window.getComputedStyle(element).display,
                    visibility: window.getComputedStyle(element).visibility,
                    offsetHeight: element.offsetHeight,
                    offsetWidth: element.offsetWidth
                });
                callback();
            } else if (attempts < maxAttempts) {
                console.log(`Element ${elementId} not found, attempt ${attempts}/${maxAttempts}`);
                // Log what elements are available
                if (attempts === 1) {
                    console.log('Available elements with similar IDs:');
                    document.querySelectorAll('[id*="client"]').forEach(el => {
                        console.log('Found element:', el.id, el);
                    });
                }
                setTimeout(checkElement, 50);
            } else {
                console.error(`Element ${elementId} not found after ${maxAttempts} attempts`);
            }
        };
        checkElement();
    }

    updateCRMStats() {
        const totalClients = this.clients.length;
        const activeClients = this.clients.filter(client => client.status === 'active').length;
        const prospectClients = this.clients.filter(client => client.status === 'prospect').length;
        
        // Update the stats in the sidebar
        const totalClientsElement = document.getElementById('totalClients');
        const activeClientsElement = document.getElementById('activeClients');
        const prospectClientsElement = document.getElementById('prospectClients');
        
        if (totalClientsElement) totalClientsElement.textContent = totalClients;
        if (activeClientsElement) activeClientsElement.textContent = activeClients;
        if (prospectClientsElement) prospectClientsElement.textContent = prospectClients;
        
        console.log('CRM stats updated:', { totalClients, activeClients, prospectClients });
    }

    renderClientTable() {
        console.log('renderClientTable called');
        const container = document.getElementById('clientTableContainer');
        console.log('Looking for clientTableContainer element:', container);
        
        if (!container) {
            console.error('Client table container not found');
            console.log('Available elements with similar IDs:');
            document.querySelectorAll('[id*="client"]').forEach(el => {
                console.log('Found element:', el.id, el);
            });
            return;
        }
        
        console.log('Container found, rendering clients:', this.clients.length);
        
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
        console.log('Client table rendered successfully');
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
                console.log('Setting current client and showing detail');
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
        console.log('showClientDetail called with client:', client);
        
        // Update the main content area instead of showing a modal
        const clientDetailElement = document.getElementById('clientDetail');
        const clientListElement = document.getElementById('clientList');
        
        if (!clientDetailElement) {
            console.error('Client detail element not found');
            return;
        }
        
        // Hide the "No Clients Selected" message
        if (clientListElement) {
            clientListElement.style.display = 'none';
        }
        
        // Show the client detail area
        clientDetailElement.style.display = 'block';
        
        const fullAddress = this.formatAddress(client);
        const primaryContact = client.contacts ? client.contacts.find(contact => contact.is_primary == 1) : null;
        
        // Create the detailed client view in the right panel
        const detailContent = `
            <div class="client-detail-header">
                <div class="client-detail-title">
                    <h2>${client.name}</h2>
                    <div class="client-badges">
                        <span class="client-type type-${client.company_type || 'lead'}">${client.company_type || 'lead'}</span>
                        <span class="client-status status-${client.status || 'active'}">${client.status || 'active'}</span>
                    </div>
                </div>
                <div class="client-detail-actions">
                    <button class="btn btn-primary" onclick="crmApp.editClient(${client.id})">
                        <i class="fas fa-edit"></i> Edit Client
                    </button>
                    <button class="btn btn-secondary" onclick="crmApp.viewClient(${client.id})">
                        <i class="fas fa-eye"></i> View Full Details
                    </button>
                </div>
            </div>
            
            <div class="client-detail-content">
                <div class="client-info-grid">
                    <div class="client-info-card">
                        <div class="info-card-header">
                            <i class="fas fa-info-circle"></i>
                            <span>Company Information</span>
                        </div>
                        <div class="info-card-content">
                            <div class="info-item">
                                <i class="fas fa-building"></i>
                                <span><strong>Type:</strong> ${client.company_type || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-toggle-on"></i>
                                <span><strong>Status:</strong> ${client.status || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-envelope"></i>
                                <span><strong>Email:</strong> ${client.email || 'No email'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-phone"></i>
                                <span><strong>Phone:</strong> ${client.company_number || 'No phone'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-globe"></i>
                                <span><strong>Website:</strong> ${client.url ? `<a href="${client.url}" target="_blank">${client.url}</a>` : 'No website'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-map-marker-alt"></i>
                                <span><strong>Address:</strong> ${fullAddress || 'No address'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="client-info-card">
                        <div class="info-card-header">
                            <i class="fas fa-users"></i>
                            <span>Team & Contacts</span>
                        </div>
                        <div class="info-card-content">
                            ${client.account_manager_name ? `
                                <div class="info-item">
                                    <i class="fas fa-user-tie"></i>
                                    <span><strong>Account Manager:</strong> ${client.account_manager_name}</span>
                                </div>
                            ` : ''}
                            ${primaryContact ? `
                                <div class="info-item">
                                    <i class="fas fa-user"></i>
                                    <span><strong>Primary Contact:</strong> ${primaryContact.name}</span>
                                </div>
                                <div class="info-item">
                                    <i class="fas fa-phone"></i>
                                    <span><strong>Contact Phone:</strong> ${primaryContact.phone || 'No phone'}</span>
                                </div>
                            ` : ''}
                            ${client.contact_name ? `
                                <div class="info-item">
                                    <i class="fas fa-user"></i>
                                    <span><strong>Main Contact:</strong> ${client.contact_name}</span>
                                </div>
                                <div class="info-item">
                                    <i class="fas fa-phone"></i>
                                    <span><strong>Contact Phone:</strong> ${client.contact_number || 'No phone'}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                
                <div class="client-tabs">
                    <button class="tab-button active" onclick="crmApp.switchTab('activity', event)">
                        <i class="fas fa-calendar"></i> Activity
                    </button>
                    <button class="tab-button" onclick="crmApp.switchTab('overview', event)">
                        <i class="fas fa-info-circle"></i> Overview
                    </button>
                    <button class="tab-button" onclick="crmApp.switchTab('contacts', event)">
                        <i class="fas fa-users"></i> Contacts <span class="tab-count">(${client.contacts ? client.contacts.length : 0})</span>
                    </button>
                    <button class="tab-button" onclick="crmApp.switchTab('tasks', event)">
                        <i class="fas fa-tasks"></i> Open Tasks <span class="tab-count">(${client.tasks ? client.tasks.filter(t => t.status !== 'closed').length : 0})</span>
                    </button>
                    <button class="tab-button" onclick="crmApp.switchTab('todos', event)">
                        <i class="fas fa-check-square"></i> To-Dos <span class="tab-count">(${client.todos ? client.todos.filter(t => t.status !== 'closed').length : 0})</span>
                    </button>
                    <button class="tab-button" onclick="crmApp.switchTab('opportunities', event)">
                        <i class="fas fa-chart-line"></i> Opportunities <span class="tab-count">(${client.opportunities ? client.opportunities.length : 0})</span>
                    </button>
                    <button class="tab-button" onclick="crmApp.switchTab('tbr', event)">
                        <i class="fas fa-handshake"></i> TBR Meetings <span class="tab-count">(${client.tbr_meetings ? client.tbr_meetings.length : 0})</span>
                    </button>
                    <button class="tab-button" onclick="crmApp.switchTab('attachments', event)">
                        <i class="fas fa-paperclip"></i> Attachments <span class="tab-count">(${client.attachments ? client.attachments.length : 0})</span>
                    </button>
                    <button class="tab-button" onclick="crmApp.switchTab('assets', event)">
                        <i class="fas fa-server"></i> Assets <span class="tab-count">(${client.assets ? client.assets.length : 0})</span>
                    </button>
                </div>
                
                <div class="tab-content active" id="activityTab">
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading activities...</p>
                    </div>
                </div>
                
                <div class="tab-content" id="overviewTab">
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading overview...</p>
                    </div>
                </div>
                
                <div class="tab-content" id="contactsTab">
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading contacts...</p>
                    </div>
                </div>
                
                <div class="tab-content" id="tasksTab">
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading tasks...</p>
                    </div>
                </div>
                
                <div class="tab-content" id="todosTab">
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading to-dos...</p>
                    </div>
                </div>
                
                <div class="tab-content" id="opportunitiesTab">
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading opportunities...</p>
                    </div>
                </div>
                
                <div class="tab-content" id="tbrTab">
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading TBR meetings...</p>
                    </div>
                </div>
                
                <div class="tab-content" id="attachmentsTab">
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading attachments...</p>
                    </div>
                </div>
                
                <div class="tab-content" id="assetsTab">
                    <div class="loading">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Loading assets...</p>
                    </div>
                </div>
            </div>
        `;
        
        clientDetailElement.innerHTML = detailContent;
        
        // Update the main title
        const mainTitle = document.getElementById('mainTitle');
        if (mainTitle) {
            mainTitle.textContent = `Client: ${client.name}`;
        }
        
        // Render the initial activity tab content since it's the default active tab
        setTimeout(() => {
            const activitiesTab = document.getElementById('activityTab');
            if (activitiesTab) {
                console.log('Rendering activity tab for client:', client);
                console.log('Client activities:', client.activities);
                activitiesTab.innerHTML = this.renderActivityTab(client);
            }
            
            // Also render the overview tab content
            const overviewTab = document.getElementById('overviewTab');
            if (overviewTab) {
                overviewTab.innerHTML = this.renderOverviewTab(client);
            }
        }, 100);
    }

    formatAddress(client) {
        const parts = [client.address_1, client.address_2, client.city, client.state, client.zip_code].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : 'No address';
    }

    switchTab(tabName, event = null) {
        // Remove active class from all tab contents and buttons
        document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
        document.querySelectorAll('.tab-button').forEach(tab => tab.classList.remove('active'));
        
        // Show the selected tab content
        const tabContent = document.getElementById(tabName + 'Tab');
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        // Update the active tab button
        if (event && event.target) {
            event.target.classList.add('active');
        } else {
            const tabButton = document.querySelector(`.tab-button[onclick*="${tabName}"]`);
            if (tabButton) {
                tabButton.classList.add('active');
            }
        }
        
        // Load tab-specific content if needed
        if (this.currentClient) {
            const tabContent = document.getElementById(tabName + 'Tab');
            if (tabContent) {
                switch (tabName) {
                    case 'activity':
                        tabContent.innerHTML = this.renderActivityTab(this.currentClient);
                        break;
                    case 'overview':
                        tabContent.innerHTML = this.renderOverviewTab(this.currentClient);
                        break;
                    case 'contacts':
                        tabContent.innerHTML = this.renderContactsTab(this.currentClient);
                        break;
                    case 'tasks':
                        tabContent.innerHTML = this.renderTasksTab(this.currentClient);
                        break;
                    case 'todos':
                        tabContent.innerHTML = this.renderTodosTab(this.currentClient);
                        break;
                    case 'opportunities':
                        tabContent.innerHTML = this.renderOpportunitiesTab(this.currentClient);
                        break;
                    case 'tbr':
                        tabContent.innerHTML = this.renderTbrTab(this.currentClient);
                        break;
                    case 'attachments':
                        tabContent.innerHTML = this.renderAttachmentsTab(this.currentClient);
                        break;
                    case 'assets':
                        tabContent.innerHTML = this.renderAssetsTab(this.currentClient);
                        break;
                }
            }
        }
    }

    renderActivityTab(client) {
        console.log('renderActivityTab called with client:', client);
        console.log('Activities count:', client.activities ? client.activities.length : 'undefined');
        
        return `
            <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: var(--text-primary);">History</h2>
                    <div style="display: flex; align-items: center; gap: 1rem;">
                        <label style="display: inline-block; margin-right: 0.5rem; font-weight: 500;">Filter:</label>
                        <select id="activityFilter" style="padding: 0.25rem 0.5rem; border: 1px solid var(--border-color); border-radius: 4px;" onchange="crmApp.filterActivities()">
                            <option value="all">All</option>
                            <option value="note">Notes</option>
                            <option value="call">Calls</option>
                            <option value="email">Emails</option>
                            <option value="meeting">Meetings</option>
                            <option value="task">Tasks</option>
                            <option value="tbr_created">TBR Created</option>
                            <option value="tbr_updated">TBR Updated</option>
                            <option value="asset_added">Assets Added</option>
                            <option value="asset_updated">Assets Updated</option>
                            <option value="asset_removed">Assets Removed</option>
                            <option value="contact_added">Contacts Added</option>
                            <option value="contact_updated">Contacts Updated</option>
                            <option value="contact_removed">Contacts Removed</option>
                            <option value="client_created">Client Created</option>
                            <option value="client_updated">Client Updated</option>
                        </select>
                        <button class="btn btn-primary" onclick="crmApp.addActivity(${client.id})">
                            <i class="fas fa-plus"></i> Add Activity
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="activity-timeline">
                ${client.activities && client.activities.length > 0 ? 
                    this.renderActivityTimeline(client.activities) : 
                    `<div class="empty-state">
                        <i class="fas fa-clipboard-list"></i>
                        <h3>No Activities</h3>
                        <p>No activities recorded for this client yet. Activities will appear here automatically when you:</p>
                        <ul style="text-align: left; margin: 1rem 0; padding-left: 2rem;">
                            <li>Add or update assets</li>
                            <li>Add or modify contacts</li>
                            <li>Create TBR meetings</li>
                            <li>Link tasks to this client</li>
                            <li>Update client information</li>
                            <li>Add manual notes or activities</li>
                        </ul>
                        <p><strong>Tip:</strong> Click "Add Activity" above to manually log an activity.</p>
                    </div>`
                }
            </div>
        `;
    }

    renderActivityTimeline(activities) {
        // Group activities by date
        const groupedActivities = this.groupActivitiesByDate(activities);
        
        return Object.keys(groupedActivities).map(date => {
            const dayActivities = groupedActivities[date];
            const isToday = date === 'Today';
            
            return `
                <div class="timeline-day">
                    <div class="timeline-date-header">
                        <div class="timeline-date-dot ${isToday ? 'today' : ''}"></div>
                        <h3 class="timeline-date-label">${date}</h3>
                    </div>
                    <div class="timeline-activities">
                        ${dayActivities.map(activity => this.renderActivityItem(activity)).join('')}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderOverviewTab(client) {
        const opportunities = client.opportunities || [];
        const tasks = client.tasks || [];
        const todos = client.todos || [];
        const contacts = client.contacts || [];
        const assets = client.assets || [];
        
        // Calculate totals
        const totalRevenue = opportunities.reduce((sum, opp) => sum + (opp.revenue || 0), 0);
        const totalMRR = opportunities.reduce((sum, opp) => sum + (opp.mrr || 0), 0);
        const wonOpportunities = opportunities.filter(opp => opp.status === 'won');
        const wonMRR = wonOpportunities.reduce((sum, opp) => sum + (opp.mrr || 0), 0);
        const activeTasks = tasks.filter(task => task.status !== 'closed' && task.status !== 'completed');
        const completedTasks = tasks.filter(task => task.status === 'closed' || task.status === 'completed');
        
        return `
            <div class="overview-container">
                <div class="overview-header">
                    <h2 style="margin: 0; font-size: 1.5rem; font-weight: 600; color: var(--text-primary);">Client Overview</h2>
                </div>
                
                <div class="overview-stats-grid">
                    <div class="overview-stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Opportunities</h3>
                            <div class="stat-value">${opportunities.length}</div>
                            <div class="stat-details">
                                <span>Total Revenue: $${totalRevenue.toLocaleString()}</span>
                                <span>Total MRR: $${totalMRR.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="overview-stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-dollar-sign"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Monthly Recurring Revenue</h3>
                            <div class="stat-value">$${wonMRR.toLocaleString()}</div>
                            <div class="stat-details">
                                <span>From ${wonOpportunities.length} won opportunities</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="overview-stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-tasks"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Tasks</h3>
                            <div class="stat-value">${tasks.length}</div>
                            <div class="stat-details">
                                <span>${activeTasks.length} active</span>
                                <span>${completedTasks.length} completed</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="overview-stat-card">
                        <div class="stat-icon">
                            <i class="fas fa-users"></i>
                        </div>
                        <div class="stat-content">
                            <h3>Contacts</h3>
                            <div class="stat-value">${contacts.length}</div>
                            <div class="stat-details">
                                <span>${contacts.filter(c => c.is_primary).length} primary</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="overview-recent-section">
                    <h3>Recent Opportunities</h3>
                    <div class="recent-opportunities">
                        ${opportunities.slice(0, 5).map(opp => `
                            <div class="recent-opportunity-item">
                                <div class="opportunity-title">${opp.title}</div>
                                <div class="opportunity-meta">
                                    <span class="status-badge status-${opp.status}">${opp.status}</span>
                                    <span class="revenue">$${opp.revenue ? opp.revenue.toLocaleString() : '0'}</span>
                                    ${opp.mrr ? `<span class="mrr-value">MRR: $${opp.mrr.toLocaleString()}</span>` : ''}
                                </div>
                            </div>
                        `).join('') || '<p>No opportunities yet</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    renderActivityItem(activity) {
        // Convert UTC time to EST and format it
        const utcDate = new Date(activity.activity_date);
        const estDate = new Date(utcDate.toLocaleString("en-US", {timeZone: "America/New_York"}));
        
        const time = estDate.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true,
            timeZone: 'America/New_York'
        });
        
        return `
            <div class="timeline-activity" data-activity-type="${activity.activity_type}">
                <div class="timeline-time">${time}</div>
                <div class="timeline-line">
                    <div class="timeline-dot"></div>
                </div>
                <div class="timeline-content">
                    <div class="activity-icon" style="background-color: ${activity.icon_color || '#95a5a6'};">
                        <i class="${activity.icon || 'fas fa-info-circle'}"></i>
                    </div>
                    <div class="activity-details">
                        <h4 class="activity-title">${activity.title}</h4>
                        ${activity.description ? `<p class="activity-description">${activity.description}</p>` : ''}
                        <div class="activity-meta">
                            <span class="activity-user">by ${activity.user_name || 'Unknown'}</span>
                            <span class="activity-time-ago">${activity.time_ago || ''}</span>
                        </div>
                    </div>
                    <div class="activity-actions">
                        ${activity.activity_type === 'note' || activity.activity_type === 'call' || activity.activity_type === 'email' || activity.activity_type === 'meeting' ? `
                            <button class="btn btn-sm btn-secondary" onclick="crmApp.editActivity(${this.currentClient ? this.currentClient.id : 'null'}, ${activity.id})" title="Edit Activity">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-danger" onclick="crmApp.deleteActivity(${this.currentClient ? this.currentClient.id : 'null'}, ${activity.id})" title="Delete Activity">
                                <i class="fas fa-trash"></i>
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    groupActivitiesByDate(activities) {
        const grouped = {};
        
        activities.forEach(activity => {
            const date = new Date(activity.activity_date);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            let dateLabel;
            if (diffDays === 1) {
                dateLabel = 'Today';
            } else if (diffDays === 2) {
                dateLabel = 'Yesterday';
            } else if (diffDays <= 7) {
                dateLabel = date.toLocaleDateString('en-US', { weekday: 'long' });
            } else {
                dateLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            
            if (!grouped[dateLabel]) {
                grouped[dateLabel] = [];
            }
            grouped[dateLabel].push(activity);
        });
        
        // Sort activities within each day by time (newest first)
        Object.keys(grouped).forEach(date => {
            grouped[date].sort((a, b) => new Date(b.activity_date) - new Date(a.activity_date));
        });
        
        return grouped;
    }

    filterActivities() {
        const filterValue = document.getElementById('activityFilter').value;
        const activities = document.querySelectorAll('.timeline-activity');
        
        activities.forEach(activity => {
            const activityType = activity.dataset.activityType;
            if (filterValue === 'all' || activityType === filterValue) {
                activity.style.display = 'block';
            } else {
                activity.style.display = 'none';
            }
        });
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
                                        <i class="fas fa-sort"></i> Email
                                    </div>
                                    <input type="text" id="contactEmailSearch" placeholder="Search email..." style="width: 100%; margin-top: 0.5rem; padding: 0.25rem; border: 1px solid var(--border-color); border-radius: 3px; font-size: 0.875rem;" onkeyup="crmApp.filterContacts()">
                                </th>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--border-color); font-weight: 600;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <i class="fas fa-sort"></i> Phone
                                    </div>
                                    <input type="text" id="contactPhoneSearch" placeholder="Search phone..." style="width: 100%; margin-top: 0.5rem; padding: 0.25rem; border: 1px solid var(--border-color); border-radius: 3px; font-size: 0.875rem;" onkeyup="crmApp.filterContacts()">
                                </th>
                                <th style="padding: 0.75rem; text-align: left; border-bottom: 1px solid var(--border-color); font-weight: 600;">
                                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                                        <i class="fas fa-sort"></i> Position
                                    </div>
                                    <input type="text" id="contactPositionSearch" placeholder="Search position..." style="width: 100%; margin-top: 0.5rem; padding: 0.25rem; border: 1px solid var(--border-color); border-radius: 3px; font-size: 0.875rem;" onkeyup="crmApp.filterContacts()">
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
                                        <td style="padding: 0.75rem;">${contact.email || '-'}</td>
                                        <td style="padding: 0.75rem;">${contact.phone || '-'}</td>
                                        <td style="padding: 0.75rem;">${contact.position || '-'}</td>
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
                                        ${contact.position ? `<div><i class="fas fa-briefcase"></i> ${contact.position}</div>` : ''}
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
                    <div class="card" style="margin-bottom: 1rem; padding: 1rem; cursor: pointer;" onclick="window.location.href='/kanban.php?task=${task.id}'">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <div>
                                <h4 style="margin: 0; color: var(--text-primary);">${task.title}</h4>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; color: var(--text-secondary);">
                                    ${task.board_name} • ${task.stage_name}
                                </p>
                            </div>
                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <span class="task-priority priority-${task.priority}">${task.priority}</span>
                                <button class="btn btn-secondary" onclick="event.stopPropagation(); window.location.href='/kanban.php?task=${task.id}'" title="Open Task">
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

    renderOpportunitiesTab(client) {
        const opportunities = client.opportunities || [];
        
        if (opportunities.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-lightbulb"></i>
                    <h3>No Opportunities</h3>
                    <p>No opportunities recorded for this client yet.</p>
                    <button class="btn btn-primary" onclick="crmApp.addOpportunity(${client.id})">
                        <i class="fas fa-plus"></i> Add Opportunity
                    </button>
                </div>
            `;
        }

        return `
            <div class="opportunities-header">
                <h3>Opportunities for ${client.name}</h3>
                <div class="opportunities-actions">
                    <button class="btn btn-primary" onclick="crmApp.addOpportunity(${client.id})">
                        <i class="fas fa-plus"></i> Add Opportunity
                    </button>
                    <button class="btn btn-secondary" onclick="crmApp.exportOpportunities(${client.id})">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button class="btn btn-secondary" onclick="crmApp.refreshOpportunitiesTab()">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
            </div>

            <div class="opportunities-container">
                ${opportunities.map(opportunity => `
                    <div class="opportunity-card" onclick="crmApp.viewOpportunity(${client.id}, ${opportunity.id})">
                        <div class="opportunity-content">
                            <div class="opportunity-row-1">
                                <div class="opportunity-title">
                                    <h4>${opportunity.title || 'Untitled Opportunity'}</h4>
                                </div>
                                <div class="opportunity-info">
                                    <span><strong>Owner:</strong> ${opportunity.owner_name || 'Unassigned'}</span>
                                    <span><strong>Close Date:</strong> ${opportunity.close_date ? this.formatDate(opportunity.close_date) : 'Not set'}</span>
                                    <span><strong>Created:</strong> ${this.formatDate(opportunity.created_at)}</span>
                                </div>
                                <div class="forecast-section">
                                    <div class="probability-bar">
                                        <div class="probability-label">
                                            <span>${opportunity.probability || 0}%</span>
                                        </div>
                                        <div class="probability-progress">
                                            <div class="probability-fill" style="width: ${opportunity.probability || 0}%"></div>
                                        </div>
                                    </div>
                                    <div class="revenue-info">
                                        <span class="revenue-value">$${opportunity.revenue ? opportunity.revenue.toLocaleString() : '0'}</span>
                                        ${opportunity.mrr ? `<span class="mrr-value">MRR: $${opportunity.mrr.toLocaleString()}</span>` : ''}
                                    </div>
                                </div>
                            </div>
                            

                        </div>
                    </div>
                `).join('')}
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
            
            if (!data.name || !data.email) {
                this.showNotification('Name and email are required', 'error');
                return;
            }
            
            console.log('Making API call to create client...');
            const result = await this.apiCall('crm-clients', 'POST', data);
            console.log('API response:', result);
            
            this.hideNewClientModal();
            this.showNotification('Client created successfully!', 'success');
            
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
            
            // Debug: Log the client data being loaded
            console.log('Loading client data for edit:', client);
            
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
            
            const editAccountManagerSelect = document.getElementById('editAccountManager');
            if (editAccountManagerSelect) {
                if (!this.users || this.users.length === 0) {
                    await this.loadUsers();
                }
                
                if (editAccountManagerSelect.options.length <= 1) {
                    this.populateAccountManagerDropdown();
                }
                
                const accountManagerId = client.account_manager_id ? String(client.account_manager_id) : '';
                
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

        window.location.href = `/kanban.php?client=${clientId}`;
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
            await this.apiCall(`attachments&id=${attachmentId}`, 'DELETE');
            this.showNotification('Attachment deleted successfully', 'success');
            await this.refreshAttachmentsTab();
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
        window.location.href = '/kanban.php';
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
        const csvFileInput = document.getElementById('csvFile');
        if (csvFileInput) {
            csvFileInput.addEventListener('change', (event) => {
                this.handleCsvFileSelect(event);
            });
        }

        const skipFirstRowCheckbox = document.getElementById('skipFirstRow');
        if (skipFirstRowCheckbox) {
            skipFirstRowCheckbox.addEventListener('change', () => {
                const csvFileInput = document.getElementById('csvFile');
                if (csvFileInput.files.length > 0) {
                    this.handleCsvFileSelect({ target: csvFileInput });
                }
            });
        }

        // Assets CSV file input
        const assetsCsvFileInput = document.getElementById('assetsCsvFile');
        if (assetsCsvFileInput) {
            assetsCsvFileInput.addEventListener('change', (event) => {
                this.handleAssetsCsvFileSelect(event);
            });
        }

        // Assets CSV skip first row checkbox
        const assetsSkipFirstRowCheckbox = document.getElementById('assetsSkipFirstRow');
        if (assetsSkipFirstRowCheckbox) {
            assetsSkipFirstRowCheckbox.addEventListener('change', () => {
                const assetsCsvFileInput = document.getElementById('assetsCsvFile');
                if (assetsCsvFileInput.files.length > 0) {
                    this.handleAssetsCsvFileSelect({ target: assetsCsvFileInput });
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

            const assetsCsvModal = document.getElementById('assetsCsvUploadModal');
            if (event.target === assetsCsvModal) {
                this.hideAssetsCsvUploadModal();
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

    async refreshContactsTab() {
        if (!this.currentClient) return;
        
        try {
            const client = await this.apiCall(`crm-client&id=${this.currentClient.id}`);
            this.currentClient = client;
            
            const contactsTab = document.getElementById('contactsTab');
            if (contactsTab) {
                contactsTab.innerHTML = this.renderContactsTab(client);
            }
            
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
            const client = await this.apiCall(`crm-client&id=${this.currentClient.id}`);
            this.currentClient = client;
            
            const todosTab = document.getElementById('todosTab');
            if (todosTab) {
                todosTab.innerHTML = this.renderTodosTab(client);
            }
            
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
            const client = await this.apiCall(`crm-client&id=${this.currentClient.id}`);
            this.currentClient = client;
            
            const activitiesTab = document.getElementById('activityTab');
            if (activitiesTab) {
                activitiesTab.innerHTML = this.renderActivityTab(client);
            }
            
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
            const client = await this.apiCall(`crm-client&id=${this.currentClient.id}`);
            this.currentClient = client;
            
            const tasksTab = document.getElementById('tasksTab');
            if (tasksTab) {
                tasksTab.innerHTML = this.renderTasksTab(client);
            }
            
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
            const client = await this.apiCall(`crm-client&id=${this.currentClient.id}`);
            this.currentClient = client;
            
            const attachmentsTab = document.getElementById('attachmentsTab');
            if (attachmentsTab) {
                attachmentsTab.innerHTML = this.renderAttachmentsTab(client);
            }
            
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
                await this.apiCall(`crm-activities&client_id=${clientId}&activity_id=${activityId}`, 'PUT', data);
                this.showNotification('Activity updated successfully!', 'success');
            } else {
                await this.apiCall(`crm-activities&client_id=${clientId}`, 'POST', data);
                this.showNotification('Activity added successfully!', 'success');
            }

            this.hideAddActivityModal();
            
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
            await this.apiCall(`attachments&id=${attachmentId}`, 'DELETE');
            this.showNotification('Attachment deleted successfully', 'success');
            await this.refreshAttachmentsTab();
        } catch (error) {
            console.error('Error deleting attachment:', error);
            this.showNotification('Error deleting attachment', 'error');
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
            
            // Debug: Log the form data being sent
            console.log('Updating client with data:', data);

            await this.apiCall(`crm-client&id=${clientId}`, 'PUT', data);

            this.hideEditClientModal();
            this.showNotification('Client updated successfully!', 'success');

            await this.refreshClientList();
            
            if (this.currentClient && this.currentClient.id == clientId) {
                await this.refreshAllTabs();
            }
        } catch (error) {
            console.error('Error updating client:', error);
            this.showNotification('Error updating client: ' + error.message, 'error');
        }
    }

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

        const selects = mappingContainer.querySelectorAll('select');
        selects.forEach(select => {
            select.innerHTML = '<option value="">Select column...</option>';
        });

        headers.forEach((header, index) => {
            selects.forEach(select => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = header;
                select.appendChild(option);
            });
        });

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
            if (accountManagerSelect) {
                accountManagerSelect.innerHTML = '<option value="">Select Account Manager...</option>';
                this.users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id.toString();
                    option.textContent = user.name;
                    accountManagerSelect.appendChild(option);
                });
            }
            
            if (editAccountManagerSelect) {
                const currentValue = editAccountManagerSelect.value;
                
                editAccountManagerSelect.innerHTML = '<option value="">Select Account Manager...</option>';
                this.users.forEach(user => {
                    const option = document.createElement('option');
                    option.value = user.id.toString();
                    option.textContent = user.name;
                    editAccountManagerSelect.appendChild(option);
                });
                
                if (currentValue) {
                    editAccountManagerSelect.value = currentValue;
                }
            }
        }
    }

    async refreshAllTabs() {
        if (!this.currentClient) return;
        
        try {
            const client = await this.apiCall(`crm-client&id=${this.currentClient.id}`);
            this.currentClient = client;
            
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
            
            this.updateTabCounts(client);
        } catch (error) {
            console.error('Error refreshing all tabs:', error);
        }
    }

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

    filterContactsByStatus() {
        const statusFilter = document.getElementById('contactStatusFilter');
        const status = statusFilter ? statusFilter.value : 'all';
        
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
            
            row.style.display = shouldShow ? '' : 'none';
            if (shouldShow) visibleCount++;
        });
        
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
            
            card.style.display = shouldShow ? '' : 'none';
        });
        
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
                table.style.display = '';
                grid.style.display = 'none';
                this.showNotification('Switched to table view', 'info');
            } else {
                table.style.display = 'none';
                grid.style.display = 'grid';
                this.showNotification('Switched to grid view', 'info');
            }
        }
    }

    renderAssetsTab(client) {
        console.log('Rendering assets for client:', client);
        console.log('Assets:', client.assets);

        if (!client.assets || client.assets.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-server"></i>
                    <h3>No Assets</h3>
                    <p>No IT assets for this client yet.</p>
                    <div style="display: flex; gap: 0.5rem; justify-content: center; margin-top: 1rem;">
                        <button class="btn btn-primary" onclick="crmApp.addAsset(${client.id})">
                            <i class="fas fa-plus"></i> Add First Asset
                        </button>
                        <button class="btn btn-secondary" onclick="crmApp.showAssetsCsvUploadModal(${client.id})">
                            <i class="fas fa-upload"></i> Import CSV
                        </button>
                    </div>
                </div>
            `;
        }

        return `
            <div style="margin-bottom: 1rem;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <button class="btn btn-primary" onclick="crmApp.addAsset(${client.id})">
                        <i class="fas fa-plus"></i> Add Asset
                    </button>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn btn-secondary" onclick="crmApp.showAssetsCsvUploadModal(${client.id})">
                            <i class="fas fa-upload"></i> Import CSV
                        </button>
                        <button class="btn btn-secondary" onclick="crmApp.exportAssets(${client.id})">
                            <i class="fas fa-download"></i> Export Assets
                        </button>
                        <button class="btn btn-icon" title="Refresh" onclick="crmApp.refreshAssetsTab()">
                            <i class="fas fa-sync-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div>
                ${client.assets.map(asset => `
                    <div class="card" style="margin-bottom: 1rem; padding: 1rem;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                            <div style="flex: 1;">
                                <h4 style="margin: 0; color: var(--text-primary);">${asset.name}</h4>
                                <p style="margin: 0.25rem 0 0 0; font-size: 0.875rem; color: var(--text-secondary);">
                                    ${asset.type} • ${asset.model || 'No model'} • ${asset.serial_number || 'No serial'}
                                </p>
                            </div>
                            <div style="display: flex; gap: 0.5rem; align-items: center;">
                                <span class="asset-status status-${asset.status || 'active'}" style="padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.75rem; font-weight: 500;">
                                    ${asset.status || 'active'}
                                </span>
                                <button class="btn btn-secondary" onclick="crmApp.editAsset(${client.id}, ${asset.id})" title="Edit Asset">
                                    <i class="fas fa-edit"></i> Edit
                                </button>
                                <button class="btn btn-danger" onclick="crmApp.deleteAsset(${client.id}, ${asset.id})" title="Delete Asset">
                                    <i class="fas fa-trash"></i> Delete
                                </button>
                            </div>
                        </div>
                        <div style="font-size: 0.875rem; color: var(--text-secondary);">
                            ${asset.location ? `<span><i class="fas fa-map-marker-alt"></i> ${asset.location}</span>` : ''}
                            ${asset.ip_address ? `<span style="margin-left: 1rem;"><i class="fas fa-network-wired"></i> ${asset.ip_address}</span>` : ''}
                            ${asset.purchase_date ? `<span style="margin-left: 1rem;"><i class="fas fa-calendar"></i> Purchased: ${this.formatDate(asset.purchase_date)}</span>` : ''}
                            ${asset.warranty_expiry ? `<span style="margin-left: 1rem;"><i class="fas fa-shield-alt"></i> Warranty: ${this.formatDate(asset.warranty_expiry)}</span>` : ''}
                        </div>
                        ${asset.notes ? `<div style="margin-top: 0.5rem; font-size: 0.875rem; color: var(--text-secondary);"><i class="fas fa-sticky-note"></i> ${asset.notes}</div>` : ''}
                    </div>
                `).join('')}
            </div>
        `;
    }

    async addAsset(clientId) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.style.zIndex = '10000';
        
        modal.innerHTML = `
            <div class="modal-content large">
                <div class="modal-header">
                    <h2>Add Asset</h2>
                    <button class="btn btn-icon" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <form id="addAssetForm" onsubmit="crmApp.submitAsset(event)" data-client-id="${clientId}" data-asset-id="">
                    <div class="modal-body">
                        <div class="form-grid">
                            <div class="form-group">
                                <label for="assetName">Asset Name <span class="required">*</span></label>
                                <input type="text" id="assetName" name="name" required>
                            </div>
                            <div class="form-group">
                                <label for="assetType">Asset Type <span class="required">*</span></label>
                                <select id="assetType" name="type" required>
                                    <option value="">Select Type</option>
                                    <option value="Desktop">Desktop</option>
                                    <option value="Laptop">Laptop</option>
                                    <option value="Server">Server</option>
                                    <option value="Router">Router</option>
                                    <option value="Switch">Switch</option>
                                    <option value="Firewall">Firewall</option>
                                    <option value="Access Point">Access Point</option>
                                    <option value="Printer">Printer</option>
                                    <option value="Scanner">Scanner</option>
                                    <option value="UPS">UPS</option>
                                    <option value="NAS">NAS</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="assetModel">Model</label>
                                <input type="text" id="assetModel" name="model">
                            </div>
                            <div class="form-group">
                                <label for="assetSerial">Serial Number</label>
                                <input type="text" id="assetSerial" name="serial_number">
                            </div>
                            <div class="form-group">
                                <label for="assetStatus">Status</label>
                                <select id="assetStatus" name="status">
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="maintenance">Maintenance</option>
                                    <option value="retired">Retired</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label for="assetLocation">Location</label>
                                <input type="text" id="assetLocation" name="location">
                            </div>
                            <div class="form-group">
                                <label for="assetIpAddress">IP Address</label>
                                <input type="text" id="assetIpAddress" name="ip_address">
                            </div>
                            <div class="form-group">
                                <label for="assetPurchaseDate">Purchase Date</label>
                                <input type="date" id="assetPurchaseDate" name="purchase_date">
                            </div>
                            <div class="form-group">
                                <label for="assetWarrantyExpiry">Warranty Expiry</label>
                                <input type="date" id="assetWarrantyExpiry" name="warranty_expiry">
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="assetNotes">Notes</label>
                            <textarea id="assetNotes" name="notes" rows="3"></textarea>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                        <button type="submit" class="btn btn-primary">Add Asset</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    async editAsset(clientId, assetId) {
        try {
            const asset = await this.apiCall(`assets&id=${assetId}`);
            
            const modal = document.createElement('div');
            modal.className = 'modal show';
            modal.style.zIndex = '10000';
            
            modal.innerHTML = `
                <div class="modal-content large">
                    <div class="modal-header">
                        <h2>Edit Asset</h2>
                        <button class="btn btn-icon" onclick="this.closest('.modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form id="editAssetForm" onsubmit="crmApp.submitAsset(event)" data-client-id="${clientId}" data-asset-id="${assetId}">
                        <div class="modal-body">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="assetName">Asset Name <span class="required">*</span></label>
                                    <input type="text" id="assetName" name="name" value="${asset.name || ''}" required>
                                </div>
                                <div class="form-group">
                                    <label for="assetType">Asset Type <span class="required">*</span></label>
                                    <select id="assetType" name="type" required>
                                        <option value="">Select Type</option>
                                        <option value="Desktop" ${asset.type === 'Desktop' ? 'selected' : ''}>Desktop</option>
                                        <option value="Laptop" ${asset.type === 'Laptop' ? 'selected' : ''}>Laptop</option>
                                        <option value="Server" ${asset.type === 'Server' ? 'selected' : ''}>Server</option>
                                        <option value="Router" ${asset.type === 'Router' ? 'selected' : ''}>Router</option>
                                        <option value="Switch" ${asset.type === 'Switch' ? 'selected' : ''}>Switch</option>
                                        <option value="Firewall" ${asset.type === 'Firewall' ? 'selected' : ''}>Firewall</option>
                                        <option value="Access Point" ${asset.type === 'Access Point' ? 'selected' : ''}>Access Point</option>
                                        <option value="Printer" ${asset.type === 'Printer' ? 'selected' : ''}>Printer</option>
                                        <option value="Scanner" ${asset.type === 'Scanner' ? 'selected' : ''}>Scanner</option>
                                        <option value="UPS" ${asset.type === 'UPS' ? 'selected' : ''}>UPS</option>
                                        <option value="NAS" ${asset.type === 'NAS' ? 'selected' : ''}>NAS</option>
                                        <option value="Other" ${asset.type === 'Other' ? 'selected' : ''}>Other</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="assetModel">Model</label>
                                    <input type="text" id="assetModel" name="model" value="${asset.model || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="assetSerial">Serial Number</label>
                                    <input type="text" id="assetSerial" name="serial_number" value="${asset.serial_number || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="assetStatus">Status</label>
                                    <select id="assetStatus" name="status">
                                        <option value="active" ${asset.status === 'active' ? 'selected' : ''}>Active</option>
                                        <option value="inactive" ${asset.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                                        <option value="maintenance" ${asset.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                                        <option value="retired" ${asset.status === 'retired' ? 'selected' : ''}>Retired</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="assetLocation">Location</label>
                                    <input type="text" id="assetLocation" name="location" value="${asset.location || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="assetIpAddress">IP Address</label>
                                    <input type="text" id="assetIpAddress" name="ip_address" value="${asset.ip_address || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="assetPurchaseDate">Purchase Date</label>
                                    <input type="date" id="assetPurchaseDate" name="purchase_date" value="${asset.purchase_date || ''}">
                                </div>
                                <div class="form-group">
                                    <label for="assetWarrantyExpiry">Warranty Expiry</label>
                                    <input type="date" id="assetWarrantyExpiry" name="warranty_expiry" value="${asset.warranty_expiry || ''}">
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="assetNotes">Notes</label>
                                <textarea id="assetNotes" name="notes" rows="3">${asset.notes || ''}</textarea>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Cancel</button>
                            <button type="submit" class="btn btn-primary">Update Asset</button>
                        </div>
                    </form>
                </div>
            `;
            
            document.body.appendChild(modal);
        } catch (error) {
            console.error('Error loading asset:', error);
            this.showNotification('Error loading asset details', 'error');
        }
    }

    async deleteAsset(clientId, assetId) {
        if (!confirm('Are you sure you want to delete this asset?')) {
            return;
        }

        try {
            await this.apiCall(`assets&id=${assetId}`, 'DELETE');
            this.showNotification('Asset deleted successfully', 'success');
            await this.refreshAssetsTab();
        } catch (error) {
            console.error('Error deleting asset:', error);
            this.showNotification('Error deleting asset', 'error');
        }
    }

    async submitAsset(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const clientId = event.target.dataset.clientId;
        const assetId = event.target.dataset.assetId;
        
        const data = {
            client_id: clientId,
            name: formData.get('name'),
            type: formData.get('type'),
            model: formData.get('model') || null,
            serial_number: formData.get('serial_number') || null,
            status: formData.get('status') || 'active',
            location: formData.get('location') || null,
            ip_address: formData.get('ip_address') || null,
            purchase_date: formData.get('purchase_date') || null,
            warranty_expiry: formData.get('warranty_expiry') || null,
            notes: formData.get('notes') || null
        };
        
        try {
            if (assetId) {
                await this.apiCall(`assets&id=${assetId}`, 'PUT', data);
                this.showNotification('Asset updated successfully', 'success');
            } else {
                await this.apiCall('assets', 'POST', data);
                this.showNotification('Asset added successfully', 'success');
            }
            
            event.target.closest('.modal').remove();
            await this.refreshAssetsTab();
        } catch (error) {
            console.error('Error saving asset:', error);
            this.showNotification('Error saving asset', 'error');
        }
    }

    async refreshAssetsTab() {
        if (this.currentClient) {
            try {
                const client = await this.apiCall(`crm-client&id=${this.currentClient.id}`);
                this.currentClient = client;
                this.showClientDetail(client);
            } catch (error) {
                console.error('Error refreshing assets tab:', error);
            }
        }
    }

    async exportAssets(clientId) {
        try {
            const response = await fetch(`api.php?endpoint=assets&client_id=${clientId}&export=1`);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `assets-${clientId}.csv`;
            document.body.appendChild(a);
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            this.showNotification('Assets exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting assets:', error);
            this.showNotification('Error exporting assets: ' + error.message, 'error');
        }
    }

    showAssetsCsvUploadModal(clientId) {
        this.currentClientId = clientId;
        this.resetAssetsCsvUploadForm();
        document.getElementById('assetsCsvUploadModal').style.display = 'block';
    }

    hideAssetsCsvUploadModal() {
        document.getElementById('assetsCsvUploadModal').style.display = 'none';
        this.resetAssetsCsvUploadForm();
    }

    resetAssetsCsvUploadForm() {
        document.getElementById('assetsCsvUploadForm').reset();
        document.getElementById('assetsCsvMappingContainer').style.display = 'none';
        document.getElementById('assetsCsvPreview').innerHTML = '<p style="color: var(--text-secondary); text-align: center;">Upload a CSV file to see preview</p>';
    }

    async handleAssetsCsvFileSelect(event) {
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

            this.displayAssetsCsvPreview(csvData);
            this.setupAssetsColumnMapping(csvData[0]);
        } catch (error) {
            console.error('Error reading CSV file:', error);
            this.showNotification('Error reading CSV file', 'error');
        }
    }

    displayAssetsCsvPreview(csvData) {
        const preview = document.getElementById('assetsCsvPreview');
        const skipFirstRow = document.getElementById('assetsSkipFirstRow').checked;
        const dataToShow = skipFirstRow ? csvData.slice(1, 6) : csvData.slice(0, 5);

        if (dataToShow.length === 0) {
            preview.innerHTML = '<p style="color: var(--text-secondary); text-align: center;">No data to preview</p>';
            return;
        }

        let previewHtml = '<div style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse; font-size: 0.875rem;">';
        
        // Headers
        previewHtml += '<thead><tr>';
        csvData[0].forEach((header, index) => {
            previewHtml += `<th style="border: 1px solid var(--border-color); padding: 0.5rem; text-align: left; background: var(--bg-secondary);">${this.escapeHtml(header)}</th>`;
        });
        previewHtml += '</tr></thead>';
        
        // Data rows
        previewHtml += '<tbody>';
        dataToShow.forEach(row => {
            previewHtml += '<tr>';
            row.forEach(cell => {
                previewHtml += `<td style="border: 1px solid var(--border-color); padding: 0.5rem;">${this.escapeHtml(cell)}</td>`;
            });
            previewHtml += '</tr>';
        });
        previewHtml += '</tbody></table></div>';
        
        if (csvData.length > dataToShow.length) {
            previewHtml += `<p style="text-align: center; color: var(--text-secondary); margin-top: 0.5rem;">Showing ${dataToShow.length} of ${csvData.length} rows</p>`;
        }
        
        preview.innerHTML = previewHtml;
    }

    setupAssetsColumnMapping(headers) {
        const container = document.getElementById('assetsCsvMappingContainer');
        container.style.display = 'block';
        
        // Populate all mapping dropdowns with available columns
        const mappingFields = [
            'mapAssetName', 'mapAssetType', 'mapAssetModel', 'mapAssetSerialNumber',
            'mapAssetStatus', 'mapAssetLocation', 'mapAssetIpAddress', 'mapAssetPurchaseDate',
            'mapAssetWarrantyExpiry', 'mapAssetNotes', 'mapAssetItGlueId'
        ];
        
        mappingFields.forEach(fieldId => {
            const select = document.getElementById(fieldId);
            if (select) {
                select.innerHTML = '<option value="">Select column...</option>';
                headers.forEach((header, index) => {
                    const option = document.createElement('option');
                    option.value = index;
                    option.textContent = header;
                    select.appendChild(option);
                });
            }
        });
        
        // Auto-map columns based on header names
        this.autoMapAssetsColumns(headers);
    }

    autoMapAssetsColumns(headers) {
        const mapping = {};
        
        headers.forEach((header, index) => {
            const lowerHeader = header.toLowerCase();
            
            if (lowerHeader.includes('name') || lowerHeader.includes('asset')) {
                mapping['mapAssetName'] = index;
            } else if (lowerHeader.includes('type') || lowerHeader.includes('category')) {
                mapping['mapAssetType'] = index;
            } else if (lowerHeader.includes('model')) {
                mapping['mapAssetModel'] = index;
            } else if (lowerHeader.includes('serial') || lowerHeader.includes('s/n')) {
                mapping['mapAssetSerialNumber'] = index;
            } else if (lowerHeader.includes('status')) {
                mapping['mapAssetStatus'] = index;
            } else if (lowerHeader.includes('location') || lowerHeader.includes('site')) {
                mapping['mapAssetLocation'] = index;
            } else if (lowerHeader.includes('ip') || lowerHeader.includes('address')) {
                mapping['mapAssetIpAddress'] = index;
            } else if (lowerHeader.includes('purchase') || lowerHeader.includes('buy')) {
                mapping['mapAssetPurchaseDate'] = index;
            } else if (lowerHeader.includes('warranty')) {
                mapping['mapAssetWarrantyExpiry'] = index;
            } else if (lowerHeader.includes('note') || lowerHeader.includes('comment')) {
                mapping['mapAssetNotes'] = index;
            } else if (lowerHeader.includes('itglue') || lowerHeader.includes('glue')) {
                mapping['mapAssetItGlueId'] = index;
            }
        });
        
        // Apply the auto-mapping
        Object.entries(mapping).forEach(([fieldId, columnIndex]) => {
            const select = document.getElementById(fieldId);
            if (select) {
                select.value = columnIndex;
            }
        });
    }

    async submitAssetsCsvUpload(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        // Get column mapping
        const mapping = {
            asset_name: document.getElementById('mapAssetName').value,
            asset_type: document.getElementById('mapAssetType').value,
            asset_model: document.getElementById('mapAssetModel').value,
            asset_serial_number: document.getElementById('mapAssetSerialNumber').value,
            asset_status: document.getElementById('mapAssetStatus').value,
            asset_location: document.getElementById('mapAssetLocation').value,
            asset_ip_address: document.getElementById('mapAssetIpAddress').value,
            asset_purchase_date: document.getElementById('mapAssetPurchaseDate').value,
            asset_warranty_expiry: document.getElementById('mapAssetWarrantyExpiry').value,
            asset_notes: document.getElementById('mapAssetNotes').value,
            asset_it_glue_id: document.getElementById('mapAssetItGlueId').value
        };
        
        // Validate required mappings - only asset name is required
        if (mapping.asset_name === '') {
            this.showNotification('Asset Name mapping is required', 'error');
            return;
        }
        
        formData.append('client_id', this.currentClientId);
        formData.append('mapping', JSON.stringify(mapping));
        formData.append('skip_first_row', document.getElementById('assetsSkipFirstRow').checked);
        
        try {
            const response = await this.apiCallFormData('assets&method=CSV_IMPORT', 'POST', formData);
            
            if (response.success) {
                this.showNotification(response.message, 'success');
                this.hideAssetsCsvUploadModal();
                
                // Refresh the assets tab
                if (this.currentClient) {
                    await this.refreshAssetsTab();
                }
            } else {
                this.showNotification(response.error || 'Import failed', 'error');
            }
        } catch (error) {
            console.error('Error importing assets CSV:', error);
            this.showNotification('Error importing assets: ' + error.message, 'error');
        }
    }

    async searchCompany() {
        const searchTerm = document.getElementById('clientName').value.trim();
        if (!searchTerm) {
            this.showNotification('Please enter a company name or phone number to search.', 'error');
            return;
        }
        
        const resultsContainer = document.getElementById('companySearchResults');
        resultsContainer.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-secondary);"><i class="fas fa-spinner fa-spin"></i> Searching...</div>';
        resultsContainer.style.display = 'block';
        
        try {
            const response = await fetch(`api.php?endpoint=company-lookup&q=${encodeURIComponent(searchTerm)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.displayCompanyResults(data.results || []);
        } catch (error) {
            this.showNotification('Error searching for company: ' + error.message, 'error');
            resultsContainer.style.display = 'none';
        }
    }

    displayCompanyResults(results) {
        const container = document.getElementById('companySearchResults');
        
        this.companySearchResults = results;
        
        if (results.length === 0) {
            container.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-secondary);">No companies found.</div>';
            return;
        }
        
        container.innerHTML = results.map((company, index) => `
            <div class="company-result" onclick="crmApp.selectCompany(${index})">
                <div class="company-name">
                    ${company.name}
                    ${company.confidence ? `<span style="color: var(--success-color); font-size: 0.75rem; margin-left: 0.5rem;">(${Math.round(company.confidence * 100)}% match)</span>` : ''}
                    ${company.source ? `<span style="color: var(--info-color); font-size: 0.75rem; margin-left: 0.5rem;">[${company.source}]</span>` : ''}
                    ${company.rating ? `<span style="color: var(--warning-color); font-size: 0.75rem; margin-left: 0.5rem;">⭐ ${company.rating}/5</span>` : ''}
                </div>
                <div class="company-details">
                    <div><i class="fas fa-phone"></i> ${company.phone || 'N/A'}</div>
                    <div><i class="fas fa-envelope"></i> ${company.email || 'N/A'}</div>
                    <div><i class="fas fa-globe"></i> ${company.website || 'N/A'}</div>
                    <div><i class="fas fa-map-marker-alt"></i> ${company.address || 'N/A'}</div>
                    ${company.description ? `<div><i class="fas fa-info-circle"></i> ${company.description}</div>` : ''}
                    ${company.user_ratings_total ? `<div><i class="fas fa-users"></i> ${company.user_ratings_total} reviews</div>` : ''}
                </div>
            </div>
        `).join('');
    }

    selectCompany(index) {
        const company = this.companySearchResults[index];
        
        if (!company) {
            this.showNotification('Company data not found', 'error');
            return;
        }
        
        document.getElementById('clientName').value = company.name;
        document.getElementById('clientEmail').value = company.email !== 'N/A' ? company.email : '';
        document.getElementById('clientNumber').value = company.phone !== 'N/A' ? company.phone : '';
        document.getElementById('clientUrl').value = company.website !== 'N/A' ? company.website : '';
        
        if (company.address && company.address !== 'N/A') {
            this.parseAddress(company.address);
        }
        
        document.getElementById('companySearchResults').style.display = 'none';
        
        this.showNotification('Company information filled successfully!', 'success');
    }

    parseAddress(address) {
        const addressParts = address.split(',').map(part => part.trim());
        
        if (addressParts.length >= 3) {
            document.getElementById('address1').value = addressParts[0] || '';
            document.getElementById('city').value = addressParts[1] || '';
            
            const stateZip = addressParts[2] || '';
            const stateZipParts = stateZip.split(' ');
            if (stateZipParts.length >= 2) {
                document.getElementById('state').value = stateZipParts[0] || '';
                document.getElementById('zipCode').value = stateZipParts[1] || '';
            }
        }
    }

    renderTbrTab(client) {
        const meetings = client.tbrMeetings || [];
        
        if (meetings.length === 0) {
            return `
                <div class="empty-state">
                    <i class="fas fa-calendar-alt"></i>
                    <h3>No TBR Meetings</h3>
                    <p>No Technology Business Review meetings scheduled</p>
                    <button class="btn btn-primary" onclick="crmApp.showTbrMeetingModal(${client.id})">
                        <i class="fas fa-plus"></i> Schedule TBR Meeting
                    </button>
                </div>
            `;
        }

        return `
            <div class="tbr-header">
                <h3>Business Review Meetings for ${client.name}</h3>
                <div class="tbr-actions">
                    <button class="btn btn-primary" onclick="crmApp.showTbrMeetingModal(${client.id})">
                        <i class="fas fa-plus"></i> Add New Meeting
                    </button>
                    <button class="btn btn-secondary" onclick="crmApp.exportTbrMeetings(${client.id})">
                        <i class="fas fa-download"></i> Export
                    </button>
                    <button class="btn btn-secondary" onclick="crmApp.refreshTbrTab()">
                        <i class="fas fa-sync"></i> Refresh
                    </button>
                </div>
            </div>

            <div class="tbr-table-container">
                <table class="tbr-table">
                    <thead>
                        <tr>
                            <th>Meeting Date</th>
                            <th>Meeting Time</th>
                            <th>Meeting Type</th>
                            <th>Primary Contact</th>
                            <th>Account Manager</th>
                            <th>Status</th>
                            <th>Notes</th>
                            <th>Recommendations</th>
                            <th>Reports / Artifacts</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${meetings.map(meeting => `
                            <tr class="meeting-row ${meeting.status}" onclick="crmApp.showTbrMeetingDetail(${meeting.id})">
                                <td class="meeting-date">${this.formatDate(meeting.meeting_date)}</td>
                                <td class="meeting-time">${meeting.meeting_time ? this.formatTime(meeting.meeting_time) : '-'}</td>
                                <td class="meeting-type">${meeting.meeting_type}</td>
                                <td class="primary-contact">${meeting.primary_contact || ''}</td>
                                <td class="account-manager">${meeting.account_manager_name || ''}</td>
                                <td class="status">
                                    <span class="status-badge status-${meeting.status}">${meeting.status}</span>
                                </td>
                                <td class="notes-preview">${this.truncateText(meeting.notes || '', 100)}</td>
                                <td class="recommendations-preview">${this.truncateText(meeting.recommendations || '', 100)}</td>
                                <td class="attachments">
                                    ${meeting.attachments && meeting.attachments.length > 0 ? 
                                        `<a href="#" onclick="crmApp.showTbrAttachments(${meeting.id}); event.stopPropagation();">
                                            ${meeting.attachments.length} file(s)
                                        </a>` : 
                                        'No files'
                                    }
                                </td>
                                <td class="actions">
                                    <button class="btn btn-sm btn-secondary" onclick="crmApp.editTbrMeeting(${meeting.id}); event.stopPropagation();">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="crmApp.deleteTbrMeeting(${meeting.id}); event.stopPropagation();">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async showTbrMeetingModal(clientId, meetingId = null) {
        if (!this.users || this.users.length === 0) {
            await this.loadUsers();
        }
        
        let meetingData = null;
        if (meetingId) {
            try {
                meetingData = await this.apiCall(`tbr-meetings&id=${meetingId}`);
            } catch (error) {
                console.error('Failed to load meeting data:', error);
            }
        }
        
        const modalHtml = `
            <div id="tbrMeetingModal" class="modal">
                <div class="modal-content large">
                    <div class="modal-header">
                        <h2>${meetingId ? 'Edit' : 'New'} TBR Meeting</h2>
                        <button class="btn btn-icon" onclick="crmApp.hideTbrMeetingModal()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <form id="tbrMeetingForm" onsubmit="crmApp.saveTbrMeeting(event, ${clientId}, ${meetingId})">
                        <div class="modal-body">
                            <div class="form-grid">
                                <div class="form-group">
                                    <label for="meetingDate">Meeting Date <span class="required">*</span></label>
                                    <input type="date" id="meetingDate" name="meeting_date" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="meetingTime">Meeting Time</label>
                                    <input type="time" id="meetingTime" name="meeting_time">
                                </div>
                                
                                <div class="form-group">
                                    <label for="meetingType">Meeting Type</label>
                                    <select id="meetingType" name="meeting_type">
                                        <option value="Business Review">Business Review</option>
                                        <option value="Technical Review">Technical Review</option>
                                        <option value="Quarterly Review">Quarterly Review</option>
                                        <option value="Annual Review">Annual Review</option>
                                        <option value="Security Review">Security Review</option>
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="primaryContact">Primary Contact</label>
                                    <input type="text" id="primaryContact" name="primary_contact">
                                </div>
                                
                                <div class="form-group">
                                    <label for="accountManager">Account Manager</label>
                                    <select id="accountManager" name="account_manager_id">
                                        <option value="">Select Account Manager</option>
                                        ${this.users ? this.users.map(user => `
                                            <option value="${user.id.toString()}" ${meetingData && meetingData.account_manager_id == user.id ? 'selected' : ''}>${user.name}</option>
                                        `).join('') : ''}
                                    </select>
                                </div>
                                
                                <div class="form-group">
                                    <label for="meetingStatus">Status</label>
                                    <select id="meetingStatus" name="status">
                                        <option value="scheduled">Scheduled</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="meetingNotes">Meeting Notes</label>
                                <textarea id="meetingNotes" name="notes" rows="8" 
                                    placeholder="• Budget & Lifecycle Replacement Review.&#10;• Review Asset List&#10;• 8 computers and 1 server are on plan&#10;  • Managed cloud backups are on the server&#10;• 1 computer MUST to be replaced (or retired) because it will not upgrade to Windows 11."></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="recommendations">Recommendations</label>
                                <textarea id="recommendations" name="recommendations" rows="6" 
                                    placeholder="• Upgrade ABA-DT-07 (Charlene-PC) - 10.5 yrs old&#10;• Permission to Quote&#10;• 7 Computers will need to be upgraded to Windows 11 (or replaced) by 2025"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label>Meeting Attendees</label>
                                <div id="attendeesContainer">
                                    <div class="attendee-row">
                                        <input type="text" placeholder="Name" name="attendee_name[]">
                                        <input type="email" placeholder="Email" name="attendee_email[]">
                                        <button type="button" class="btn btn-primary" onclick="crmApp.addAttendeeRow()">
                                            <i class="fas fa-plus"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="crmApp.hideTbrMeetingModal()">Cancel</button>
                            <button type="submit" class="btn btn-primary">
                                <i class="fas fa-save"></i> Save Meeting
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
        
        const existingModal = document.getElementById('tbrMeetingModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        document.getElementById('tbrMeetingModal').style.display = 'block';
        
        if (meetingId && meetingData) {
            document.getElementById('meetingDate').value = meetingData.meeting_date;
            document.getElementById('meetingTime').value = meetingData.meeting_time || '';
            document.getElementById('meetingType').value = meetingData.meeting_type;
            document.getElementById('primaryContact').value = meetingData.primary_contact || '';
            document.getElementById('meetingStatus').value = meetingData.status;
            document.getElementById('meetingNotes').value = meetingData.notes || '';
            document.getElementById('recommendations').value = meetingData.recommendations || '';
            
            const attendeesContainer = document.getElementById('attendeesContainer');
            attendeesContainer.innerHTML = '';
            
            if (meetingData.attendees && meetingData.attendees.length > 0) {
                meetingData.attendees.forEach(attendee => {
                    const attendeeRow = document.createElement('div');
                    attendeeRow.className = 'attendee-row';
                    attendeeRow.innerHTML = `
                        <input type="text" placeholder="Name" name="attendee_name[]" value="${attendee.name || ''}">
                        <input type="email" placeholder="Email" name="attendee_email[]" value="${attendee.email || ''}">
                        <button type="button" class="btn btn-secondary" onclick="this.parentElement.remove()">
                            <i class="fas fa-trash"></i>
                        </button>
                    `;
                    attendeesContainer.appendChild(attendeeRow);
                });
            }
            
            const addRow = document.createElement('div');
            addRow.className = 'attendee-row';
            addRow.innerHTML = `
                <input type="text" placeholder="Name" name="attendee_name[]">
                <input type="email" placeholder="Email" name="attendee_email[]">
                <button type="button" class="btn btn-primary" onclick="crmApp.addAttendeeRow()">
                    <i class="fas fa-plus"></i>
                </button>
            `;
            attendeesContainer.appendChild(addRow);
        }
    }

    hideTbrMeetingModal() {
        const modal = document.getElementById('tbrMeetingModal');
        if (modal) {
            modal.remove();
        }
    }

    addAttendeeRow() {
        const container = document.getElementById('attendeesContainer');
        const newRow = document.createElement('div');
        newRow.className = 'attendee-row';
        newRow.innerHTML = `
            <input type="text" placeholder="Name" name="attendee_name[]">
            <input type="email" placeholder="Email" name="attendee_email[]">
            <button type="button" class="btn btn-secondary" onclick="this.parentElement.remove()">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(newRow);
    }

    async saveTbrMeeting(event, clientId, meetingId = null) {
        event.preventDefault();
        
        try {
            const formData = new FormData(event.target);
            const data = {
                client_id: clientId,
                            meeting_date: formData.get('meeting_date'),
            meeting_time: formData.get('meeting_time') || null,
            meeting_type: formData.get('meeting_type'),
                primary_contact: formData.get('primary_contact'),
                account_manager_id: formData.get('account_manager_id'),
                status: formData.get('status'),
                notes: formData.get('notes'),
                recommendations: formData.get('recommendations'),
                attendees: []
            };
            
            const names = formData.getAll('attendee_name[]');
            const emails = formData.getAll('attendee_email[]');
            for (let i = 0; i < names.length; i++) {
                if (names[i] && names[i].trim() && emails[i] && emails[i].trim()) {
                    data.attendees.push({
                        name: names[i].trim(),
                        email: emails[i].trim()
                    });
                }
            }
            
            const method = meetingId ? 'PUT' : 'POST';
            const endpoint = meetingId ? `tbr-meetings&id=${meetingId}` : 'tbr-meetings';
            
            await this.apiCall(endpoint, method, data);
            
            this.hideTbrMeetingModal();
            this.showNotification(`TBR meeting ${meetingId ? 'updated' : 'created'} successfully!`, 'success');
            
            if (this.currentClient) {
                const updatedClient = await this.apiCall(`crm-client&id=${this.currentClient.id}`);
                this.showClientDetail(updatedClient);
            }
            
        } catch (error) {
            console.error('Failed to save TBR meeting:', error);
            this.showNotification('Failed to save TBR meeting: ' + error.message, 'error');
        }
    }

    async showTbrMeetingDetail(meetingId) {
        try {
            const meeting = await this.apiCall(`tbr-meetings&id=${meetingId}`);
            
            const modalHtml = `
                <div id="tbrMeetingDetailModal" class="modal">
                    <div class="modal-content large">
                        <div class="modal-header">
                            <h2>TBR Meeting Details</h2>
                            <button class="btn btn-icon" onclick="crmApp.hideTbrMeetingDetailModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="meeting-details">
                                <div class="detail-row">
                                    <label>Meeting Date:</label>
                                    <span>${this.formatDate(meeting.meeting_date)}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Meeting Time:</label>
                                    <span>${meeting.meeting_time ? this.formatTime(meeting.meeting_time) : 'Not specified'}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Meeting Type:</label>
                                    <span>${meeting.meeting_type}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Primary Contact:</label>
                                    <span>${meeting.primary_contact || 'Not specified'}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Account Manager:</label>
                                    <span>${meeting.account_manager_name || 'Not assigned'}</span>
                                </div>
                                <div class="detail-row">
                                    <label>Status:</label>
                                    <span class="status-badge status-${meeting.status}">${meeting.status}</span>
                                </div>
                                
                                ${meeting.notes ? `
                                    <div class="detail-section">
                                        <h3>Meeting Notes</h3>
                                        <div class="notes-content">${meeting.notes.replace(/\n/g, '<br>')}</div>
                                    </div>
                                ` : ''}
                                
                                ${meeting.recommendations ? `
                                    <div class="detail-section">
                                        <h3>Recommendations</h3>
                                        <div class="recommendations-content">${meeting.recommendations.replace(/\n/g, '<br>')}</div>
                                    </div>
                                ` : ''}
                                
                                ${meeting.attendees && meeting.attendees.length > 0 ? `
                                    <div class="detail-section">
                                        <h3>Attendees</h3>
                                        <div class="attendees-list">
                                            ${meeting.attendees.map(attendee => `
                                                <div class="attendee-item">
                                                    <strong>${attendee.name}</strong>
                                                    ${attendee.email ? `<br><small>${attendee.email}</small>` : ''}
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                                
                                ${meeting.attachments && meeting.attachments.length > 0 ? `
                                    <div class="detail-section">
                                        <h3>Attachments</h3>
                                        <div class="attachments-list">
                                            ${meeting.attachments.map(attachment => `
                                                <div class="attachment-item">
                                                    <a href="api.php?endpoint=attachments&id=${attachment.id}" target="_blank">
                                                        <i class="fas fa-file"></i> ${attachment.original_name}
                                                    </a>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="crmApp.hideTbrMeetingDetailModal()">Close</button>
                            <button type="button" class="btn btn-primary" onclick="crmApp.editTbrMeeting(${meeting.id})">Edit Meeting</button>
                        </div>
                    </div>
                </div>
            `;
            
            const existingModal = document.getElementById('tbrMeetingDetailModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            document.getElementById('tbrMeetingDetailModal').style.display = 'block';
            
        } catch (error) {
            console.error('Failed to load TBR meeting details:', error);
            this.showNotification('Failed to load meeting details: ' + error.message, 'error');
        }
    }

    hideTbrMeetingDetailModal() {
        const modal = document.getElementById('tbrMeetingDetailModal');
        if (modal) {
            modal.remove();
        }
    }

    async editTbrMeeting(meetingId) {
        try {
            const meeting = await this.apiCall(`tbr-meetings&id=${meetingId}`);
            const clientId = meeting.client_id;
            
            this.hideTbrMeetingDetailModal();
            
            await this.showTbrMeetingModal(clientId, meetingId);
            
        } catch (error) {
            console.error('Failed to load TBR meeting for edit:', error);
            this.showNotification('Failed to load meeting for edit: ' + error.message, 'error');
        }
    }

    async deleteTbrMeeting(meetingId) {
        if (confirm('Are you sure you want to delete this TBR meeting?')) {
            try {
                await this.apiCall(`tbr-meetings&id=${meetingId}`, 'DELETE');
                this.showNotification('TBR meeting deleted successfully', 'success');
                this.refreshTbrTab();
                this.hideTbrMeetingDetailModal();
            } catch (error) {
                console.error('Failed to delete TBR meeting:', error);
                this.showNotification('Failed to delete meeting: ' + error.message, 'error');
            }
        }
    }



    async showTbrAttachments(meetingId) {
        try {
            const meeting = await this.apiCall(`tbr-meetings&id=${meetingId}`);
            
            if (!meeting.attachments || meeting.attachments.length === 0) {
                this.showNotification('No attachments found for this meeting.', 'info');
                return;
            }
            
            const modalHtml = `
                <div id="tbrAttachmentsModal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Meeting Attachments</h2>
                            <button class="btn btn-icon" onclick="crmApp.hideTbrAttachmentsModal()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="modal-body">
                            <div class="attachments-list">
                                ${meeting.attachments.map(attachment => `
                                    <div class="attachment-item">
                                        <a href="api.php?endpoint=attachments&id=${attachment.id}" target="_blank" class="attachment-link">
                                            <i class="fas fa-file"></i> ${attachment.original_name}
                                        </a>
                                        <small>${this.formatFileSize(attachment.file_size || 0)}</small>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" onclick="crmApp.hideTbrAttachmentsModal()">Close</button>
                        </div>
                    </div>
                </div>
            `;
            
            const existingModal = document.getElementById('tbrAttachmentsModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            document.getElementById('tbrAttachmentsModal').style.display = 'block';
            
        } catch (error) {
            console.error('Failed to load TBR attachments:', error);
            this.showNotification('Failed to load attachments: ' + error.message, 'error');
        }
    }

    hideTbrAttachmentsModal() {
        const modal = document.getElementById('tbrAttachmentsModal');
        if (modal) {
            modal.remove();
        }
    }

    async exportTbrMeetings(clientId) {
        try {
            const response = await fetch(`api.php?endpoint=tbr-meetings&client_id=${clientId}&export=true`);
            const blob = await response.blob();
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tbr-meetings-${clientId}-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showNotification('TBR meetings exported successfully!', 'success');
        } catch (error) {
            console.error('Failed to export TBR meetings:', error);
            this.showNotification('Failed to export TBR meetings: ' + error.message, 'error');
        }
    }

    async refreshTbrTab() {
        if (this.currentClient) {
            try {
                const updatedClient = await this.apiCall(`crm-client&id=${this.currentClient.id}`);
                this.showClientDetail(updatedClient);
                this.showNotification('TBR tab refreshed successfully!', 'success');
            } catch (error) {
                console.error('Failed to refresh TBR tab:', error);
                this.showNotification('Failed to refresh TBR tab: ' + error.message, 'error');
            }
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: '2-digit', 
            day: '2-digit'
        });
    }

    formatTime(timeString) {
        if (!timeString) return '';
        // Convert time string (HH:MM:SS) to readable format
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    truncateText(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    calculateDaysInPipeline(createdAt) {
        if (!createdAt) return 0;
        const created = new Date(createdAt);
        const now = new Date();
        const diffTime = Math.abs(now - created);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    async addOpportunity(clientId) {
        try {
            if (!this.users || this.users.length === 0) {
                await this.loadUsers();
            }
            
            if (!this.users || this.users.length === 0) {
                console.warn('No users loaded, attempting to load again...');
                await this.loadUsers();
            }
            
            const modalHtml = `
                <div class="modal" id="addOpportunityModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Add New Opportunity</h2>
                            <span class="close" onclick="crmApp.hideAddOpportunityModal()">&times;</span>
                        </div>
                        <div class="modal-body">
                            <form id="opportunityForm" onsubmit="crmApp.submitOpportunity(event)">
                                <input type="hidden" id="opportunityClientId" name="clientId" value="${clientId}">
                                <input type="hidden" id="opportunityId" name="opportunityId">
                                
                                <div class="form-group">
                                    <label for="opportunityTitle">Opportunity Title</label>
                                    <input type="text" id="opportunityTitle" name="title" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="opportunityDescription">Description</label>
                                    <textarea id="opportunityDescription" name="description" rows="3"></textarea>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="opportunityRevenue">Revenue ($)</label>
                                        <input type="number" id="opportunityRevenue" name="revenue" min="0" step="0.01">
                                    </div>
                                    <div class="form-group">
                                        <label for="opportunityProbability">Probability (%)</label>
                                        <input type="number" id="opportunityProbability" name="probability" min="0" max="100" value="0">
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="opportunityMRR">Monthly Recurring Revenue ($)</label>
                                        <input type="number" id="opportunityMRR" name="mrr" min="0" step="0.01" placeholder="Monthly subscription amount">
                                    </div>
                                    <div class="form-group">
                                        <label for="opportunityCloseDate">Close Date</label>
                                        <input type="date" id="opportunityCloseDate" name="close_date">
                                    </div>
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="opportunityStatus">Status</label>
                                        <select id="opportunityStatus" name="status" required>
                                            <option value="new">New</option>
                                            <option value="qualified">Qualified</option>
                                            <option value="proposal">Proposal</option>
                                            <option value="negotiation">Negotiation</option>
                                            <option value="won">Won</option>
                                            <option value="lost">Lost</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="opportunityCloseDate">Close Date</label>
                                        <input type="date" id="opportunityCloseDate" name="close_date">
                                    </div>
                                </div>
                                
                                <div class="form-group">
                                    <label for="opportunityOwner">Owner</label>
                                    <select id="opportunityOwner" name="owner_id">
                                        <option value="">Select Owner</option>
                                        ${this.users && this.users.length > 0 ? this.users.map(user => `
                                            <option value="${user.id}">${user.name || user.full_name || 'Unknown User'}</option>
                                        `).join('') : '<option value="">Loading users...</option>'}
                                    </select>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">Save Opportunity</button>
                                    <button type="button" class="btn btn-secondary" onclick="crmApp.hideAddOpportunityModal()">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            
            const existingModal = document.getElementById('addOpportunityModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            document.getElementById('addOpportunityModal').style.display = 'flex';
            
            if (!this.users || this.users.length === 0) {
                setTimeout(async () => {
                    await this.loadUsers();
                    const ownerSelect = document.getElementById('opportunityOwner');
                    if (ownerSelect && this.users && this.users.length > 0) {
                        ownerSelect.innerHTML = '<option value="">Select Owner</option>' + 
                            this.users.map(user => `
                                <option value="${user.id}">${user.name || user.full_name || 'Unknown User'}</option>
                            `).join('');
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Error creating opportunity modal:', error);
            this.showNotification('Failed to load opportunity form', 'error');
        }
    }

    hideAddOpportunityModal() {
        const modal = document.getElementById('addOpportunityModal');
        if (modal) {
            modal.remove();
        }
    }

    async editOpportunity(clientId, opportunityId) {
        try {
            const opportunity = await this.apiCall(`opportunities&id=${opportunityId}`);
            if (opportunity) {
                if (!this.users || this.users.length === 0) {
                    await this.loadUsers();
                }
                
                if (!document.getElementById('addOpportunityModal')) {
                    await this.addOpportunity(clientId);
                }
                
                document.getElementById('opportunityId').value = opportunity.id;
                document.getElementById('opportunityTitle').value = opportunity.title || '';
                document.getElementById('opportunityDescription').value = opportunity.description || '';
                document.getElementById('opportunityRevenue').value = opportunity.revenue || '';
                document.getElementById('opportunityMRR').value = opportunity.mrr || '';
                document.getElementById('opportunityProbability').value = opportunity.probability || 0;
                document.getElementById('opportunityStatus').value = opportunity.status || 'new';
                document.getElementById('opportunityCloseDate').value = opportunity.close_date || '';
                
                const ownerSelect = document.getElementById('opportunityOwner');
                if (ownerSelect) {
                    ownerSelect.innerHTML = '<option value="">Select Owner</option>';
                    if (this.users) {
                        this.users.forEach(user => {
                            const option = document.createElement('option');
                            option.value = user.id;
                            option.textContent = user.name || user.full_name || 'Unknown User';
                            if (user.id == opportunity.owner_id) {
                                option.selected = true;
                            }
                            ownerSelect.appendChild(option);
                        });
                    }
                }
                
                document.querySelector('#addOpportunityModal .modal-header h2').textContent = 'Edit Opportunity';
                
                document.getElementById('addOpportunityModal').style.display = 'flex';
            }
        } catch (error) {
            console.error('Failed to load opportunity:', error);
            this.showNotification('Failed to load opportunity details', 'error');
        }
    }

    async viewOpportunity(clientId, opportunityId) {
        try {
            const opportunity = await this.apiCall(`opportunities&id=${opportunityId}`);
            if (opportunity) {
                let notes = [];
                try {
                    notes = await this.apiCall(`opportunity-notes&opportunity_id=${opportunityId}`);
                } catch (error) {
                    console.warn('Failed to load notes:', error);
                    notes = [];
                }
                
                let attachments = [];
                try {
                    attachments = await this.apiCall(`opportunity-attachments&opportunity_id=${opportunityId}`);
                } catch (error) {
                    console.warn('Failed to load attachments:', error);
                    attachments = [];
                }
                
                opportunity.notes = notes;
                opportunity.attachments = attachments;
                
                const modalHtml = `
                    <div class="modal" id="viewOpportunityModal">
                        <div class="modal-content opportunity-modal-large">
                            <div class="modal-header">
                                <div class="opportunity-header-main">
                                    <div class="opportunity-title-section">
                                        <h2>Opportunity - ID ${opportunity.id} - ${opportunity.title || 'Untitled Opportunity'}</h2>
                                        <div class="opportunity-meta">
                                            <span class="opportunity-id">ID ${opportunity.id}</span>
                                            <span class="status-badge status-${opportunity.status || 'new'}">${opportunity.status || 'New'}</span>
                                        </div>
                                    </div>
                                    <div class="opportunity-header-actions">
                                        <button class="btn btn-secondary" onclick="crmApp.editOpportunity(${clientId}, ${opportunity.id})">
                                            <i class="fas fa-edit"></i> Edit
                                        </button>
                                        <button class="btn btn-danger" onclick="crmApp.deleteOpportunity(${clientId}, ${opportunity.id})">
                                            <i class="fas fa-trash"></i> Delete
                                        </button>
                                    </div>
                                </div>
                                <span class="close" onclick="crmApp.hideViewOpportunityModal()">&times;</span>
                            </div>
                            <div class="modal-body">
                                <div class="opportunity-detail-container">
                                    <!-- Left Column - Actions and Timeline -->
                                    <div class="opportunity-left-column">
                                        <div class="opportunity-actions-section">
                                            <h3>Actions</h3>
                                            <div class="action-buttons">
                                                <button class="btn btn-primary" onclick="crmApp.editOpportunity(${clientId}, ${opportunity.id})">
                                                    <i class="fas fa-edit"></i> Edit Opportunity
                                                </button>
                                                <button class="btn btn-secondary" onclick="crmApp.addOpportunityNote(${opportunity.id})">
                                                    <i class="fas fa-sticky-note"></i> Add Note
                                                </button>
                                                <button class="btn btn-secondary" onclick="crmApp.addOpportunityAttachment(${opportunity.id})">
                                                    <i class="fas fa-paperclip"></i> Add Attachment
                                                </button>
                                            </div>
                                        </div>

                                         <div class="forecast-section">
                                            <h3>Forecast</h3>
                                            <div class="probability-bar">
                                                <div class="probability-label">
                                                    <span>${opportunity.probability || 0}% Probability</span>
                                                </div>
                                                <div class="probability-progress">
                                                    <div class="probability-fill" style="width: ${opportunity.probability || 0}%"></div>
                                                </div>
                                            </div>
                                            <div class="revenue-info">
                                                <div class="revenue-item">
                                                    <span class="revenue-label">Revenue:</span>
                                                    <span class="revenue-value">$${opportunity.revenue ? opportunity.revenue.toLocaleString() : '0'}</span>
                                                </div>
                                                ${opportunity.mrr ? `
                                                <div class="revenue-item">
                                                    <span class="revenue-label">MRR:</span>
                                                    <span class="revenue-value mrr-value">$${opportunity.mrr.toLocaleString()}</span>
                                                </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                        
                                        <div class="opportunity-stats-section">
                                            <h3>Statistics</h3>
                                            <div class="stats-grid">
                                                <div class="stat-item">
                                                    <div class="stat-label">Days in Pipeline</div>
                                                    <div class="stat-value">${this.calculateDaysInPipeline(opportunity.created_at)}</div>
                                                </div>
                                                <div class="stat-item">
                                                    <div class="stat-label">Notes Count</div>
                                                    <div class="stat-value">${opportunity.notes ? opportunity.notes.length : 0}</div>
                                                </div>
                                                <div class="stat-item">
                                                    <div class="stat-label">Attachments</div>
                                                    <div class="stat-value">${opportunity.attachments ? opportunity.attachments.length : 0}</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div class="opportunity-timeline-section">
                                            <h3>Timeline</h3>
                                            <div class="timeline-container">
                                                <div class="timeline-item">
                                                    <div class="timeline-marker"></div>
                                                    <div class="timeline-content">
                                                        <div class="timeline-title">Opportunity Created</div>
                                                        <div class="timeline-time">${this.formatDate(opportunity.created_at)}</div>
                                                        <div class="timeline-user">by ${opportunity.created_by_name || 'Unknown User'}</div>
                                                    </div>
                                                </div>
                                                ${opportunity.updated_at && opportunity.updated_at !== opportunity.created_at ? `
                                                    <div class="timeline-item">
                                                        <div class="timeline-marker"></div>
                                                        <div class="timeline-content">
                                                            <div class="timeline-title">Last Updated</div>
                                                            <div class="timeline-time">${this.formatDate(opportunity.updated_at)}</div>
                                                        </div>
                                                    </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                        
                                    </div>
                                    
                                    <!-- Center Column - Main Content -->
                                    <div class="opportunity-center-column">
                                        <div class="opportunity-info-section">
                                            <h3>Opportunity Information</h3>
                                            <div class="info-grid">
                                                <div class="info-item">
                                                    <label>Owner:</label>
                                                    <span>${opportunity.owner_name || 'Unassigned'}</span>
                                                </div>
                                                <div class="info-item">
                                                    <label>Close Date:</label>
                                                    <span>${opportunity.close_date ? this.formatDate(opportunity.close_date) : 'Not set'}</span>
                                                </div>
                                                <div class="info-item">
                                                    <label>Created:</label>
                                                    <span>${this.formatDate(opportunity.created_at)}</span>
                                                </div>
                                                <div class="info-item">
                                                    <label>Status:</label>
                                                    <span class="status-badge status-${opportunity.status || 'new'}">${opportunity.status || 'New'}</span>
                                                </div>
                                                ${opportunity.mrr ? `
                                                <div class="info-item">
                                                    <label>MRR:</label>
                                                    <span class="mrr-value">$${opportunity.mrr.toLocaleString()}</span>
                                                </div>
                                                ` : ''}
                                            </div>
                                        </div>
                                        
                                        ${opportunity.description ? `
                                            <div class="opportunity-description-section">
                                                <h3>Description</h3>
                                                <div class="description-content">
                                                    <p>${opportunity.description}</p>
                                                </div>
                                            </div>
                                        ` : ''}
                                        
                                        <div class="opportunity-notes-section">
                                            <div class="notes-header">
                                                <h3>Notes</h3>
                                                <button class="btn btn-primary btn-sm" onclick="crmApp.addOpportunityNote(${opportunity.id})">
                                                    <i class="fas fa-plus"></i> Add Note
                                                </button>
                                            </div>
                                            <div class="notes-list">
                                                ${opportunity.notes && opportunity.notes.length > 0 ? 
                                                    opportunity.notes.map(note => `
                                                        <div class="note-item">
                                                            <div class="note-header">
                                                                <div class="note-user">
                                                                    <span class="user-avatar">${note.user_name ? note.user_name.charAt(0).toUpperCase() : 'U'}</span>
                                                                    <span class="user-name">${note.user_name || 'Unknown User'}</span>
                                                                </div>
                                                                <span class="note-time">${this.formatDate(note.created_at)}</span>
                                                            </div>
                                                            <div class="note-content">
                                                                <p>${note.note_text}</p>
                                                            </div>
                                                        </div>
                                                    `).join('') : 
                                                    '<div class="no-notes">No notes yet. Add the first note!</div>'
                                                }
                                            </div>
                                        </div>
                                        
                                        <div class="opportunity-attachments-section">
                                            <div class="attachments-header">
                                                <h3>Attachments</h3>
                                                <button class="btn btn-primary btn-sm" onclick="crmApp.addOpportunityAttachment(${opportunity.id})">
                                                    <i class="fas fa-plus"></i> Add Attachment
                                                </button>
                                            </div>
                                            <div class="attachments-container">
                                                <div class="attachments-list">
                                                    ${opportunity.attachments && opportunity.attachments.length > 0 ? 
                                                        opportunity.attachments.map(attachment => `
                                                            <div class="attachment-item">
                                                                <div class="attachment-header">
                                                                    <div class="attachment-icon">
                                                                        <i class="fas fa-file"></i>
                                                                    </div>
                                                                    <div class="attachment-info">
                                                                        <div class="attachment-title">${attachment.title}</div>
                                                                        <div class="attachment-meta">
                                                                            <span class="attachment-size">${this.formatFileSize(attachment.filesize)}</span>
                                                                            <span class="attachment-date">${this.formatDate(attachment.created_at)}</span>
                                                                            <span class="attachment-user">by ${attachment.user_name || 'Unknown User'}</span>
                                                                        </div>
                                                                    </div>
                                                                    <div class="attachment-actions">
                                                                        <button class="btn btn-sm btn-secondary" onclick="crmApp.downloadOpportunityAttachment('${attachment.filename}')" title="Download">
                                                                            <i class="fas fa-download"></i>
                                                                        </button>
                                                                        <button class="btn btn-sm btn-danger" onclick="crmApp.deleteOpportunityAttachment(${opportunity.id}, ${attachment.id})" title="Delete">
                                                                            <i class="fas fa-trash"></i>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                ${attachment.description ? `
                                                                    <div class="attachment-description">
                                                                        <p>${attachment.description}</p>
                                                                    </div>
                                                                ` : ''}
                                                            </div>
                                                        `).join('') : 
                                                        '<div class="no-attachments">No attachments yet. Add the first attachment!</div>'
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                const existingModal = document.getElementById('viewOpportunityModal');
                if (existingModal) {
                    existingModal.remove();
                }
                
                document.body.insertAdjacentHTML('beforeend', modalHtml);
                
                document.getElementById('viewOpportunityModal').style.display = 'flex';
            }
        } catch (error) {
            console.error('Failed to load opportunity:', error);
            this.showNotification('Failed to load opportunity details', 'error');
        }
    }

    hideViewOpportunityModal() {
        const modal = document.getElementById('viewOpportunityModal');
        if (modal) {
            modal.remove();
        }
    }

    async deleteOpportunity(clientId, opportunityId) {
        if (confirm('Are you sure you want to delete this opportunity?')) {
            try {
                await this.apiCall(`opportunities&id=${opportunityId}`, 'DELETE');
                this.showNotification('Opportunity deleted successfully', 'success');
                await this.refreshOpportunitiesTab();
            } catch (error) {
                console.error('Failed to delete opportunity:', error);
                this.showNotification('Failed to delete opportunity', 'error');
            }
        }
    }

    async submitOpportunity(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const opportunityId = formData.get('opportunityId');
        
        const opportunityData = {
            client_id: formData.get('clientId'),
            title: formData.get('title'),
            description: formData.get('description'),
            revenue: parseFloat(formData.get('revenue')) || 0,
            mrr: parseFloat(formData.get('mrr')) || 0,
            probability: parseInt(formData.get('probability')) || 0,
            status: formData.get('status'),
            close_date: formData.get('close_date'),
            owner_id: formData.get('owner_id') || null
        };
        
        try {
            if (opportunityId) {
                await this.apiCall(`opportunities&id=${opportunityId}`, 'PUT', opportunityData);
                this.showNotification('Opportunity updated successfully', 'success');
            } else {
                await this.apiCall('opportunities', 'POST', opportunityData);
                this.showNotification('Opportunity created successfully', 'success');
            }
            
            this.hideAddOpportunityModal();
            await this.refreshOpportunitiesTab();
        } catch (error) {
            console.error('Failed to save opportunity:', error);
            this.showNotification('Failed to save opportunity', 'error');
        }
    }

    async exportOpportunities(clientId) {
        try {
            const response = await this.apiCall(`opportunities&client_id=${clientId}&export=1`);
            if (response.download_url) {
                window.open(response.download_url, '_blank');
            } else {
                this.showNotification('Export feature not available', 'warning');
            }
        } catch (error) {
            console.error('Failed to export opportunities:', error);
            this.showNotification('Failed to export opportunities', 'error');
        }
    }

    async refreshOpportunitiesTab() {
        try {
            const currentClient = this.clients.find(c => c.id == this.currentClient?.id);
            if (currentClient) {
                const opportunities = await this.apiCall(`opportunities&client_id=${currentClient.id}`);
                currentClient.opportunities = opportunities;
                this.renderOpportunitiesTab(currentClient);
                
                const opportunitiesTab = document.getElementById('opportunitiesTab');
                if (opportunitiesTab) {
                    opportunitiesTab.innerHTML = this.renderOpportunitiesTab(currentClient);
                }
            }
        } catch (error) {
            console.error('Failed to refresh opportunities:', error);
            this.showNotification('Failed to refresh opportunities', 'error');
        }
    }

    async addOpportunityNote(opportunityId) {
        try {
            const modalHtml = `
                <div class="modal" id="addOpportunityNoteModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Add Note to Opportunity</h2>
                            <span class="close" onclick="crmApp.hideAddOpportunityNoteModal()">&times;</span>
                        </div>
                        <div class="modal-body">
                            <form id="opportunityNoteForm" onsubmit="crmApp.submitOpportunityNote(event)">
                                <input type="hidden" id="opportunityNoteId" name="opportunityId" value="${opportunityId}">
                                
                                <div class="form-group">
                                    <label for="opportunityNoteText">Note</label>
                                    <textarea id="opportunityNoteText" name="note_text" rows="4" required placeholder="Enter your note here..."></textarea>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">Add Note</button>
                                    <button type="button" class="btn btn-secondary" onclick="crmApp.hideAddOpportunityNoteModal()">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            
            const existingModal = document.getElementById('addOpportunityNoteModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            document.getElementById('addOpportunityNoteModal').style.display = 'flex';
        } catch (error) {
            console.error('Failed to show add note modal:', error);
            this.showNotification('Failed to show add note modal', 'error');
        }
    }

    async addOpportunityAttachment(opportunityId) {
        try {
            const modalHtml = `
                <div class="modal" id="addOpportunityAttachmentModal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h2>Add Attachment to Opportunity</h2>
                            <span class="close" onclick="crmApp.hideAddOpportunityAttachmentModal()">&times;</span>
                        </div>
                        <div class="modal-body">
                            <form id="opportunityAttachmentForm" onsubmit="crmApp.submitOpportunityAttachment(event)">
                                <input type="hidden" id="opportunityAttachmentId" name="opportunityId" value="${opportunityId}">
                                
                                <div class="form-group">
                                    <label for="opportunityAttachmentFile">File</label>
                                    <input type="file" id="opportunityAttachmentFile" name="file" required>
                                </div>
                                
                                <div class="form-group">
                                    <label for="opportunityAttachmentTitle">Title</label>
                                    <input type="text" id="opportunityAttachmentTitle" name="title" required placeholder="Enter attachment title...">
                                </div>
                                
                                <div class="form-group">
                                    <label for="opportunityAttachmentDescription">Description</label>
                                    <textarea id="opportunityAttachmentDescription" name="description" rows="3" placeholder="Enter attachment description..."></textarea>
                                </div>
                                
                                <div class="form-actions">
                                    <button type="submit" class="btn btn-primary">Upload Attachment</button>
                                    <button type="button" class="btn btn-secondary" onclick="crmApp.hideAddOpportunityAttachmentModal()">Cancel</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            `;
            
            const existingModal = document.getElementById('addOpportunityAttachmentModal');
            if (existingModal) {
                existingModal.remove();
            }
            
            document.body.insertAdjacentHTML('beforeend', modalHtml);
            
            document.getElementById('addOpportunityAttachmentModal').style.display = 'flex';
        } catch (error) {
            console.error('Failed to show add attachment modal:', error);
            this.showNotification('Failed to show add attachment modal', 'error');
        }
    }

    hideAddOpportunityNoteModal() {
        const modal = document.getElementById('addOpportunityNoteModal');
        if (modal) {
            modal.remove();
        }
    }

    hideAddOpportunityAttachmentModal() {
        const modal = document.getElementById('addOpportunityAttachmentModal');
        if (modal) {
            modal.remove();
        }
    }

    async submitOpportunityNote(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const opportunityId = formData.get('opportunityId');
        const noteText = formData.get('note_text');
        
        if (!noteText.trim()) {
            this.showNotification('Please enter a note', 'error');
            return;
        }
        
        try {
            const response = await this.apiCall(`opportunity-notes`, 'POST', {
                opportunity_id: opportunityId,
                note_text: noteText
            });
            
            this.showNotification('Note added successfully', 'success');
            this.hideAddOpportunityNoteModal();
            
            const notes = await this.apiCall(`opportunity-notes&opportunity_id=${opportunityId}`);
            
            const notesContainer = document.querySelector('.notes-list');
            if (notesContainer) {
                if (notes && notes.length > 0) {
                    notesContainer.innerHTML = notes.map(note => `
                        <div class="note-item">
                            <div class="note-header">
                                <div class="note-user">
                                    <span class="user-avatar">${note.user_name ? note.user_name.charAt(0).toUpperCase() : 'U'}</span>
                                    <span class="user-name">${note.user_name || 'Unknown User'}</span>
                                </div>
                                <span class="note-time">${this.formatDate(note.created_at)}</span>
                            </div>
                            <div class="note-content">
                                <p>${note.note_text}</p>
                            </div>
                        </div>
                    `).join('');
                } else {
                    notesContainer.innerHTML = '<div class="no-notes">No notes yet. Add the first note!</div>';
                }
            }
            
            const notesCountStat = document.querySelector('.stat-item:nth-child(2) .stat-value');
            if (notesCountStat) {
                notesCountStat.textContent = notes ? notes.length : 0;
            }
            
        } catch (error) {
            console.error('Failed to add note:', error);
            this.showNotification('Failed to add note: ' + error.message, 'error');
        }
    }

    async submitOpportunityAttachment(event) {
        event.preventDefault();
        const formData = new FormData(event.target);
        const opportunityId = formData.get('opportunityId');
        const file = document.getElementById('opportunityAttachmentFile').files[0];
        const title = formData.get('title');
        const description = formData.get('description');
        
        if (!file) {
            this.showNotification('Please select a file', 'error');
            return;
        }
        
        if (!title.trim()) {
            this.showNotification('Please enter a title', 'error');
            return;
        }
        
        try {
            const attachmentData = new FormData();
            attachmentData.append('opportunity_id', opportunityId);
            attachmentData.append('file', file);
            attachmentData.append('title', title);
            attachmentData.append('description', description || '');
            
            const response = await this.apiCallFormData(`opportunity-attachments`, 'POST', attachmentData);
            
            this.showNotification('Attachment uploaded successfully', 'success');
            this.hideAddOpportunityAttachmentModal();
            
            const attachments = await this.apiCall(`opportunity-attachments&opportunity_id=${opportunityId}`);
            
            const attachmentsContainer = document.querySelector('.attachments-list');
            if (attachmentsContainer) {
                if (attachments && attachments.length > 0) {
                    attachmentsContainer.innerHTML = attachments.map(attachment => `
                        <div class="attachment-item">
                            <div class="attachment-header">
                                <div class="attachment-icon">
                                    <i class="fas fa-file"></i>
                                </div>
                                <div class="attachment-info">
                                    <div class="attachment-title">${attachment.title}</div>
                                    <div class="attachment-meta">
                                        <span class="attachment-size">${this.formatFileSize(attachment.filesize)}</span>
                                        <span class="attachment-date">${this.formatDate(attachment.created_at)}</span>
                                        <span class="attachment-user">by ${attachment.user_name || 'Unknown User'}</span>
                                    </div>
                                </div>
                                <div class="attachment-actions">
                                    <button class="btn btn-sm btn-secondary" onclick="crmApp.downloadOpportunityAttachment('${attachment.filename}')" title="Download">
                                        <i class="fas fa-download"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="crmApp.deleteOpportunityAttachment(${opportunityId}, ${attachment.id})" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                            ${attachment.description ? `
                                <div class="attachment-description">
                                    <p>${attachment.description}</p>
                                </div>
                            ` : ''}
                        </div>
                    `).join('');
                } else {
                    attachmentsContainer.innerHTML = '<div class="no-attachments">No attachments yet. Add the first attachment!</div>';
                }
            }
            
            const attachmentsStat = document.querySelector('.stat-item:last-child .stat-value');
            if (attachmentsStat) {
                attachmentsStat.textContent = attachments ? attachments.length : 0;
            }
            
        } catch (error) {
            console.error('Failed to upload attachment:', error);
            this.showNotification('Failed to upload attachment: ' + error.message, 'error');
        }
    }

    async downloadOpportunityAttachment(filename) {
        try {
            const response = await fetch(`uploads/${filename}`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (!response.ok) {
                throw new Error('Failed to download file');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            this.showNotification('Download started', 'success');
        } catch (error) {
            console.error('Failed to download attachment:', error);
            this.showNotification('Failed to download attachment: ' + error.message, 'error');
        }
    }

    async deleteOpportunityAttachment(opportunityId, attachmentId) {
        if (!confirm('Are you sure you want to delete this attachment?')) {
            return;
        }
        
        try {
            await this.apiCall(`opportunity-attachments&id=${attachmentId}`, 'DELETE');
            
            this.showNotification('Attachment deleted successfully', 'success');
            
            const currentOpportunity = await this.apiCall(`opportunities&id=${opportunityId}`);
            if (currentOpportunity) {
                const attachments = await this.apiCall(`opportunity-attachments&opportunity_id=${opportunityId}`);
                
                const attachmentsContainer = document.querySelector('.attachments-list');
                if (attachmentsContainer) {
                    if (attachments && attachments.length > 0) {
                        attachmentsContainer.innerHTML = attachments.map(attachment => `
                            <div class="attachment-item">
                                <div class="attachment-header">
                                    <div class="attachment-icon">
                                        <i class="fas fa-file"></i>
                                    </div>
                                    <div class="attachment-info">
                                        <div class="attachment-title">${attachment.title}</div>
                                        <div class="attachment-meta">
                                            <span class="attachment-size">${this.formatFileSize(attachment.filesize)}</span>
                                            <span class="attachment-date">${this.formatDate(attachment.created_at)}</span>
                                            <span class="attachment-user">by ${attachment.user_name || 'Unknown User'}</span>
                                        </div>
                                    </div>
                                    <div class="attachment-actions">
                                        <button class="btn btn-sm btn-secondary" onclick="crmApp.downloadOpportunityAttachment('${attachment.filename}')" title="Download">
                                            <i class="fas fa-download"></i>
                                        </button>
                                        <button class="btn btn-sm btn-danger" onclick="crmApp.deleteOpportunityAttachment(${opportunityId}, ${attachment.id})" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                ${attachment.description ? `
                                    <div class="attachment-description">
                                        <p>${attachment.description}</p>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('');
                    } else {
                        attachmentsContainer.innerHTML = '<div class="no-attachments">No attachments yet. Add the first attachment!</div>';
                    }
                }
                
                const attachmentsStat = document.querySelector('.stat-item:last-child .stat-value');
                if (attachmentsStat) {
                    attachmentsStat.textContent = attachments ? attachments.length : 0;
                }
            }
        } catch (error) {
            console.error('Failed to delete attachment:', error);
            this.showNotification('Failed to delete attachment: ' + error.message, 'error');
        }
    }

    updateUserDisplay() {
        if (this.currentUser) {
            const userName = this.currentUser.name || 'User';
            const currentUserNameEl = document.getElementById('currentUserName');
            const userDropdownNameEl = document.getElementById('userDropdownName');
            
            if (currentUserNameEl) {
                currentUserNameEl.textContent = userName;
            }
            if (userDropdownNameEl) {
                userDropdownNameEl.textContent = userName;
            }
        }
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

    async logout() {
        try {
            await this.apiCall('logout', 'POST');
            window.location.href = '/';
        } catch (error) {
            console.error('Logout error:', error);
            // Even if logout API fails, redirect to login
            window.location.href = '/';
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

function hideAddOpportunityModal() {
    crmApp.hideAddOpportunityModal();
}

function hideViewOpportunityModal() {
    crmApp.hideViewOpportunityModal();
}

function submitOpportunity(event) {
    crmApp.submitOpportunity(event);
}

function hideAddOpportunityNoteModal() {
    crmApp.hideAddOpportunityNoteModal();
}

function hideAddOpportunityAttachmentModal() {
    crmApp.hideAddOpportunityAttachmentModal();
}

function submitOpportunityNote(event) {
    crmApp.submitOpportunityNote(event);
}

function submitOpportunityAttachment(event) {
    crmApp.submitOpportunityAttachment(event);
}

// Initialize CRM App when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('CRM App initialized: CRMApp');
    window.crmApp = new CRMApp();
    crmApp.init();
});