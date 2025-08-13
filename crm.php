<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Cache - CRM</title>
    <link rel="icon" type="image/png" href="assets/thecache_logo.png">
    <link rel="shortcut icon" type="image/png" href="assets/thecache_logo.png">
    <link rel="apple-touch-icon" href="assets/thecache_logo.png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/styles.css?v5.0">
    <style>
        .crm-container {
            display: flex;
            height: 100vh;
            background: var(--background-color);
        }

        .crm-sidebar {
            width: 350px;
            background: var(--card-background);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
        }

        .crm-main {
            flex: 1;
            display: flex;
            flex-direction: column;
        }

        .crm-header {
            background: var(--card-background);
            color: var(--text-primary);
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
        }

        .crm-header h1 {
            margin: 0;
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .crm-header-actions {
            display: flex;
            gap: 1rem;
        }

        .crm-content {
            flex: 1;
            padding: 2rem;
            overflow-y: auto;
            background: var(--background-color);
        }

        .client-list {
            background: var(--card-background);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            overflow: hidden;
            border: 1px solid var(--border-color);
        }

        .client-list-header {
            padding: 1.5rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: var(--card-background);
        }

        .client-filters {
            display: flex;
            gap: 1rem;
            align-items: center;
        }

        .client-search {
            position: relative;
            flex: 1;
            max-width: 300px;
        }

        .client-search input {
            width: 100%;
            padding: 0.5rem 1rem 0.5rem 2.5rem;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            font-size: 0.875rem;
            background: var(--input-bg);
            color: var(--text-primary);
        }

        /* Contact grid view styles */
        .table-container.grid-view table {
            display: none;
        }
        
        .table-container.grid-view {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
            padding: 1rem;
        }
        
        .table-container.grid-view .contact-card {
            background: var(--card-background);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 1rem;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        
        .table-container.grid-view .contact-card .contact-name {
            font-weight: 600;
            color: var(--primary-color);
            cursor: pointer;
        }
        
        .table-container.grid-view .contact-card .contact-info {
            font-size: 0.875rem;
            color: var(--text-secondary);
        }
        
        .table-container.grid-view .contact-card .contact-actions {
            display: flex;
            gap: 0.5rem;
            margin-top: auto;
        }

        .client-search input:focus {
            outline: none;
            border-color: var(--primary-color);
        }

        .client-search i {
            position: absolute;
            left: 0.75rem;
            top: 50%;
            transform: translateY(-50%);
            color: var(--text-secondary);
        }

        /* Asset Styles */
        .asset-status {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
        }

        .asset-status.status-active {
            background: var(--success-color);
            color: white;
        }

        .asset-status.status-inactive {
            background: var(--text-secondary);
            color: white;
        }

        .asset-status.status-maintenance {
            background: var(--warning-color);
            color: white;
        }

        .asset-status.status-retired {
            background: var(--danger-color);
            color: white;
        }

        .asset-card {
            background: var(--card-background);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 1rem;
            margin-bottom: 1rem;
            transition: all 0.2s ease;
        }

        .asset-card:hover {
            border-color: var(--primary-color);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .asset-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 0.5rem;
        }

        .asset-title {
            font-weight: 600;
            color: var(--text-primary);
            margin: 0;
        }

        .asset-meta {
            font-size: 0.875rem;
            color: var(--text-secondary);
            margin: 0.25rem 0 0 0;
        }

        .asset-details {
            font-size: 0.875rem;
            color: var(--text-secondary);
            margin-top: 0.5rem;
        }

        .asset-details span {
            margin-right: 1rem;
        }

        .asset-details i {
            margin-right: 0.25rem;
        }

        .asset-notes {
            margin-top: 0.5rem;
            font-size: 0.875rem;
            color: var(--text-secondary);
            background: var(--light-color);
            padding: 0.5rem;
            border-radius: 4px;
        }

        .client-table {
            width: 100%;
            border-collapse: collapse;
        }

        .client-table th,
        .client-table td {
            padding: 1rem;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
        }

        .client-table th {
            background: var(--card-background);
            font-weight: 600;
            color: var(--text-primary);
            font-size: 0.875rem;
        }

        .client-table tr:hover {
            background: var(--hover-color);
        }

        .client-status {
            padding: 0.25rem 0.75rem;
            border-radius: 9999px;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .status-active {
            background: var(--success-color);
            color: white;
        }

        .status-lead {
            background: var(--warning-color);
            color: white;
        }

        .status-inactive {
            background: var(--danger-color);
            color: white;
        }

        .client-type {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .type-customer {
            background: var(--primary-color);
            color: white;
        }

        .type-lead {
            background: var(--warning-color);
            color: white;
        }

        .type-prospect {
            background: var(--info-color);
            color: white;
        }

        .client-actions {
            display: flex;
            gap: 0.5rem;
        }

        .btn-sm {
            padding: 0.25rem 0.5rem;
            font-size: 0.75rem;
        }

        .empty-state {
            text-align: center;
            padding: 3rem;
            color: var(--text-secondary);
        }

        .empty-state i {
            font-size: 3rem;
            margin-bottom: 1rem;
            color: var(--text-secondary);
        }

        .todo-detail-grid,
        .contact-detail-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
        }

        .detail-group {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .detail-label {
            font-weight: 600;
            color: var(--text-primary);
            font-size: 0.875rem;
        }

        .detail-value {
            color: var(--text-secondary);
            padding: 0.75rem;
            background: var(--input-bg);
            border-radius: 6px;
            border: 1px solid var(--border-color);
            min-height: 2.5rem;
            display: flex;
            align-items: center;
        }

        .task-completed {
            color: var(--success-color);
            font-weight: 500;
        }

        .task-status {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: capitalize;
        }

        .status-pending {
            background: var(--warning-color);
            color: white;
        }

        .status-closed {
            background: var(--success-color);
            color: white;
        }

        @media (max-width: 768px) {
            .crm-container {
                flex-direction: column;
                height: auto;
                min-height: 100vh;
            }

            .crm-sidebar {
                width: 100%;
                height: auto;
                border-right: none;
                border-bottom: 1px solid var(--border-color);
            }

            .crm-main {
                flex: 1;
                min-height: 0;
            }

            .crm-header {
                padding: 1rem;
                flex-direction: column;
                gap: 1rem;
                align-items: stretch;
            }

            .crm-header h1 {
                font-size: 1.25rem;
                text-align: center;
            }

            .crm-header-actions {
                justify-content: center;
                flex-wrap: wrap;
            }

            .crm-content {
                padding: 1rem;
            }

            .client-list-header {
                padding: 1rem;
                flex-direction: column;
                gap: 1rem;
                align-items: stretch;
            }

            .client-filters {
                flex-direction: column;
                gap: 0.5rem;
            }

            .client-search {
                max-width: none;
            }

            .client-table {
                font-size: 0.875rem;
            }

            .client-table th,
            .client-table td {
                padding: 0.5rem;
            }

            .client-detail-header {
                flex-direction: column;
                gap: 1rem;
                align-items: stretch;
            }

            .client-info {
                flex-direction: column;
                gap: 1rem;
            }

            .client-tabs {
                flex-wrap: wrap;
                gap: 0.5rem;
            }

            .client-tab {
                flex: 1;
                min-width: 120px;
                font-size: 0.875rem;
                padding: 0.5rem 0.75rem;
            }

            .contact-item,
            .task-item,
            .activity-item {
                padding: 0.75rem;
            }

            /* Mobile timeline adjustments */
            .activity-timeline {
                padding-left: 1rem;
            }

            .timeline-activities {
                padding-left: 1rem;
            }

            .timeline-time {
                min-width: 60px;
                font-size: 0.75rem;
            }

            .timeline-content {
                flex-direction: column;
                gap: 0.75rem;
            }

            .activity-actions {
                justify-content: flex-end;
            }

            .contact-header,
            .task-header,
            .activity-header {
                flex-direction: column;
                gap: 0.5rem;
                align-items: stretch;
            }

            .contact-actions,
            .task-actions {
                justify-content: flex-end;
            }

            .contact-buttons,
            .task-buttons {
                display: flex;
                gap: 0.25rem;
            }

            .modal-content {
                width: 95%;
                max-width: none;
                margin: 1rem;
                max-height: 90vh;
                overflow-y: auto;
            }

            .form-grid {
                grid-template-columns: 1fr;
                gap: 1rem;
            }

            .btn {
                padding: 0.5rem 1rem;
                font-size: 0.875rem;
            }

            .btn-sm {
                padding: 0.25rem 0.5rem;
                font-size: 0.75rem;
            }

            .todo-detail-grid,
            .contact-detail-grid {
                display: grid;
                gap: 1rem;
            }

            .detail-group {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .detail-label {
                font-weight: 600;
                color: var(--text-primary);
                font-size: 0.875rem;
            }

            .detail-value {
                color: var(--text-secondary);
                padding: 0.5rem;
                background: var(--input-bg);
                border-radius: 4px;
                border: 1px solid var(--border-color);
            }

            .task-completed {
                color: var(--success-color);
                font-weight: 500;
            }
        }

        @media (max-width: 480px) {
            .crm-header {
                padding: 0.75rem;
            }

            .crm-header h1 {
                font-size: 1.125rem;
            }

            .crm-content {
                padding: 0.75rem;
            }

            .client-list-header {
                padding: 0.75rem;
            }

            .client-table th,
            .client-table td {
                padding: 0.25rem;
                font-size: 0.75rem;
            }

            .client-tab {
                font-size: 0.75rem;
                padding: 0.375rem 0.5rem;
            }

            .contact-item,
            .task-item,
            .activity-item {
                padding: 0.5rem;
            }

            .modal-content {
                width: 98%;
                margin: 0.5rem;
            }

            .btn {
                padding: 0.375rem 0.75rem;
                font-size: 0.75rem;
            }
        }

        .modal {
            display: none;
            position: fixed;
            z-index: 1000;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
        }

        .modal-content {
            background-color: var(--card-background);
            margin: 5% auto;
            padding: 0;
            border-radius: var(--border-radius);
            width: 90%;
            max-width: 800px;
            max-height: 90vh;
            overflow-y: auto;
            border: 1px solid var(--border-color);
        }

        .modal-header {
            background: var(--card-background);
            color: var(--text-primary);
            padding: 1rem 1.5rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-color);
        }

        .modal-body {
            padding: 1.5rem;
            background: var(--card-background);
        }

        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        .form-group {
            margin-bottom: 1rem;
        }

        .form-group label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 500;
            color: var(--text-primary);
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            font-size: 0.875rem;
            background: var(--input-bg);
            color: var(--text-primary);
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
            outline: none;
            border-color: var(--primary-color);
        }

        .form-group textarea {
            resize: vertical;
            min-height: 80px;
        }

        .required {
            color: var(--danger-color);
        }

        .modal-footer {
            padding: 1rem 1.5rem;
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: flex-end;
            gap: 1rem;
            background: var(--card-background);
        }

        .client-detail {
            display: none;
        }

        .client-detail.active {
            display: block;
        }

        .client-detail-header {
            background: var(--card-background);
            padding: 2rem;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 2rem;
            border-radius: var(--border-radius);
        }

        .client-info {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
        }

        .client-avatar {
            width: 60px;
            height: 60px;
            background: var(--primary-color);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1.5rem;
            font-weight: 600;
        }

        .client-details h2 {
            margin: 0 0 0.5rem 0;
            font-size: 1.5rem;
            color: var(--text-primary);
        }

        .client-meta {
            display: flex;
            gap: 2rem;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        .client-tabs {
            display: flex;
            border-bottom: 1px solid var(--border-color);
            margin-bottom: 2rem;
            background: var(--card-background);
            border-radius: var(--border-radius) var(--border-radius) 0 0;
        }

        .client-tab {
            padding: 1rem 1.5rem;
            border: none;
            background: none;
            cursor: pointer;
            color: var(--text-secondary);
            border-bottom: 2px solid transparent;
            font-weight: 500;
            transition: var(--transition);
        }

        .client-tab:hover {
            color: var(--text-primary);
        }

        .client-tab.active {
            color: var(--primary-color);
            border-bottom-color: var(--primary-color);
        }

        .tab-content {
            display: none;
            background: var(--card-background);
            padding: 2rem;
            border-radius: 0 0 var(--border-radius) var(--border-radius);
        }

        .tab-content.active {
            display: block;
        }

        .activity-item {
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
            display: flex;
            align-items: flex-start;
            gap: 1rem;
        }

        .activity-avatar {
            width: 40px;
            height: 40px;
            background: var(--primary-color);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.875rem;
            font-weight: 600;
        }

        .activity-content {
            flex: 1;
        }

        .activity-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }

        .activity-title {
            font-weight: 600;
            color: var(--text-primary);
        }

        .activity-date {
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        .activity-description {
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        /* Activity Timeline Styles */
        .activity-timeline {
            position: relative;
            padding-left: 2rem;
        }

        .timeline-day {
            margin-bottom: 2rem;
        }

        .timeline-date-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1rem;
            position: relative;
        }

        .timeline-date-dot {
            width: 12px;
            height: 12px;
            background: var(--border-color);
            border-radius: 50%;
            position: relative;
        }

        .timeline-date-dot.today {
            background: var(--success-color);
            box-shadow: 0 0 0 4px rgba(46, 204, 113, 0.2);
        }

        .timeline-date-label {
            margin: 0;
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .timeline-activities {
            position: relative;
            padding-left: 2rem;
        }

        .timeline-activities::before {
            content: '';
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 2px;
            background: var(--border-color);
        }

        .timeline-activity {
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            margin-bottom: 1.5rem;
            position: relative;
        }

        .timeline-time {
            min-width: 80px;
            font-size: 0.875rem;
            color: var(--text-secondary);
            font-weight: 500;
            text-align: right;
            padding-top: 0.5rem;
        }

        .timeline-line {
            position: relative;
            width: 20px;
            display: flex;
            justify-content: center;
        }

        .timeline-dot {
            width: 10px;
            height: 10px;
            background: var(--border-color);
            border-radius: 50%;
            position: relative;
            z-index: 2;
        }

        .timeline-content {
            flex: 1;
            display: flex;
            align-items: flex-start;
            gap: 1rem;
            background: var(--card-background);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 1rem;
            box-shadow: var(--shadow);
        }

        .activity-icon {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 1rem;
            flex-shrink: 0;
        }

        .activity-details {
            flex: 1;
        }

        .activity-title {
            margin: 0 0 0.5rem 0;
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .activity-description {
            margin: 0 0 0.75rem 0;
            color: var(--text-secondary);
            line-height: 1.4;
        }

        .activity-meta {
            display: flex;
            align-items: center;
            gap: 1rem;
            font-size: 0.875rem;
            color: var(--text-secondary);
        }

        .activity-user {
            font-weight: 500;
        }

        .activity-time-ago {
            opacity: 0.8;
        }

        .activity-actions {
            display: flex;
            gap: 0.5rem;
            flex-shrink: 0;
        }

        .contact-item {
            padding: 1rem;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            margin-bottom: 1rem;
            background: var(--card-background);
        }

        .contact-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }

        .contact-name {
            font-weight: 600;
            color: var(--text-primary);
        }

        .contact-badges {
            display: flex;
            gap: 0.5rem;
        }

        .contact-badge {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .badge-primary {
            background: var(--primary-color);
            color: white;
        }

        .badge-billing {
            background: var(--warning-color);
            color: white;
        }

        .contact-info {
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        .task-item {
            padding: 1rem;
            border: 1px solid var(--border-color);
            border-radius: 6px;
            margin-bottom: 1rem;
            background: var(--card-background);
        }

        .task-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }

        .task-title {
            font-weight: 600;
            color: var(--text-primary);
        }

        .task-priority {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            font-weight: 500;
        }

        .priority-high {
            background: var(--danger-color);
            color: white;
        }

        .priority-medium {
            background: var(--warning-color);
            color: white;
        }

        .priority-low {
            background: var(--success-color);
            color: white;
        }

        .task-meta {
            display: flex;
            gap: 1rem;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        .loading {
            text-align: center;
            padding: 2rem;
            color: var(--text-secondary);
        }

        .loading i {
            font-size: 2rem;
            animation: spin 1s linear infinite;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        .add-activity-form,
        .add-contact-form,
        .add-todo-form {
            background: var(--card-background);
            padding: 1.5rem;
            border-radius: var(--border-radius);
            margin-bottom: 1rem;
            border: 1px solid var(--border-color);
        }

        .form-actions {
            display: flex;
            gap: 1rem;
            justify-content: flex-end;
            margin-top: 1rem;
        }

        .activity-type-selector {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 1rem;
        }

        .activity-type-btn {
            padding: 0.5rem 1rem;
            border: 1px solid var(--border-color);
            background: var(--input-bg);
            color: var(--text-primary);
            border-radius: 4px;
            cursor: pointer;
            transition: var(--transition);
        }

        .activity-type-btn:hover {
            background: var(--hover-color);
        }

        .activity-type-btn.active {
            background: var(--primary-color);
            color: white;
            border-color: var(--primary-color);
        }
        .form-help {
            font-size: 0.875rem;
            color: var(--text-secondary);
            margin-top: 0.25rem;
        }

        .csv-mapping-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
            margin-top: 1rem;
        }

        .mapping-row {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }

        .mapping-row label {
            font-weight: 500;
            font-size: 0.875rem;
        }

        .mapping-row select {
            padding: 0.5rem;
            border: 1px solid var(--border-color);
            border-radius: 4px;
            background: var(--card-background);
            color: var(--text-primary);
        }

        #csvPreview table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.75rem;
        }

        #csvPreview th,
        #csvPreview td {
            border: 1px solid var(--border-color);
            padding: 0.25rem;
            text-align: left;
        }

        #csvPreview th {
            background: var(--background-color);
            font-weight: 600;
        }

        .csv-import-progress {
            margin-top: 1rem;
            padding: 1rem;
            background: var(--card-background);
            border-radius: 4px;
            border: 1px solid var(--border-color);
        }

        .progress-bar {
            width: 100%;
            height: 20px;
            background: var(--background-color);
            border-radius: 10px;
            overflow: hidden;
            margin-top: 0.5rem;
        }

        .progress-fill {
            height: 100%;
            background: var(--primary-color);
            transition: width 0.3s ease;
        }

        /* Company Search Styles */
        .input-with-search {
            display: flex;
            gap: 0.5rem;
            align-items: stretch;
        }

        .input-with-search input {
            flex: 1;
        }

        .search-btn {
            padding: 0.75rem 1rem;
            white-space: nowrap;
        }

        .company-search-results {
            border: 1px solid var(--border-color);
            border-radius: 6px;
            background: var(--card-background);
            max-height: 300px;
            overflow-y: auto;
        }

        .company-result {
            padding: 1rem;
            border-bottom: 1px solid var(--border-color);
            cursor: pointer;
            transition: var(--transition);
        }

        .company-result:hover {
            background: var(--hover-color);
        }

        .company-result:last-child {
            border-bottom: none;
        }

        .company-name {
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 0.25rem;
        }

        .company-details {
            font-size: 0.875rem;
            color: var(--text-secondary);
        }

        .company-details div {
            margin-bottom: 0.25rem;
        }

        .company-details i {
            width: 16px;
            margin-right: 0.5rem;
        }

        /* TBR Meeting Styles */
        .tbr-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
        }

        .tbr-actions {
            display: flex;
            gap: 0.5rem;
        }

        .tbr-table-container {
            overflow-x: auto;
            border: 1px solid var(--border-color);
            border-radius: 6px;
        }

        .tbr-table {
            width: 100%;
            border-collapse: collapse;
            background: var(--card-background);
        }

        .tbr-table th,
        .tbr-table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid var(--border-color);
            color: var(--text-primary);
        }

        .tbr-table th {
            background: var(--hover-color);
            font-weight: 600;
            font-size: 0.875rem;
        }

        .tbr-table tbody tr:hover {
            background: var(--hover-color);
        }

        .meeting-row {
            cursor: pointer;
        }

        .meeting-row.completed {
            opacity: 0.8;
        }

        .meeting-row.cancelled {
            opacity: 0.6;
            text-decoration: line-through;
        }

        .status-badge {
            padding: 0.25rem 0.5rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: capitalize;
        }

        .status-scheduled {
            background: var(--info-color);
            color: white;
        }

        .status-completed {
            background: var(--success-color);
            color: white;
        }

        .status-cancelled {
            background: var(--danger-color);
            color: white;
        }

        .notes-preview,
        .recommendations-preview {
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .attendee-row {
            display: flex;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
            align-items: center;
        }

        .attendee-row input {
            flex: 1;
        }

        .modal-content.large {
            max-width: 800px;
            width: 90%;
        }

        .form-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
        }

        @media (max-width: 768px) {
            .form-grid {
                grid-template-columns: 1fr;
            }
            
            .tbr-header {
                flex-direction: column;
                gap: 1rem;
                align-items: stretch;
            }
            
            .tbr-actions {
                justify-content: center;
            }
        }

        #viewOpportunityModal > div > div.modal-body > div > div.opportunity-center-column > div.opportunity-info-section > div > div:nth-child(4) > span {
    /* width: 150px !important; */
    margin-right: 100% !important;
        }

        /* Client Detail Styles */
        .client-detail {
            display: none;
            padding: 2rem;
            background: var(--card-background);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            margin: 1rem;
        }

        .client-detail-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
        }

        .client-detail-title h2 {
            margin: 0 0 0.5rem 0;
            color: var(--text-primary);
            font-size: 1.75rem;
        }

        .client-badges {
            display: flex;
            gap: 0.5rem;
            flex-wrap: wrap;
        }

        .client-type, .client-status {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 500;
            text-transform: uppercase;
        }

        .client-type.type-customer { background: #10b981; color: white; }
        .client-type.type-lead { background: #f59e0b; color: white; }
        .client-type.type-prospect { background: #3b82f6; color: white; }
        .client-type.type-vendor { background: #8b5cf6; color: white; }

        .client-status.status-active { background: #10b981; color: white; }
        .client-status.status-lead { background: #f59e0b; color: white; }
        .client-status.status-inactive { background: #6b7280; color: white; }

        .client-detail-actions {
            display: flex;
            gap: 0.5rem;
        }

        .client-info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1.5rem;
            margin-bottom: 2rem;
        }

        .client-info-card {
            background: var(--background-color);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 1.5rem;
        }

        .info-card-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 1rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .info-card-header i {
            color: var(--primary-color);
        }

        .info-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 0.75rem;
            padding: 0.5rem 0;
        }

        .info-item i {
            color: var(--text-secondary);
            width: 16px;
            text-align: center;
        }

        .info-item span {
            color: var(--text-primary);
        }

        .client-tabs {
            display: flex;
            gap: 0.25rem;
            margin-bottom: 1.5rem;
            border-bottom: 1px solid var(--border-color);
        }

        .tab-button {
            padding: 0.75rem 1.5rem;
            border: none;
            background: transparent;
            color: var(--text-secondary);
            cursor: pointer;
            border-bottom: 2px solid transparent;
            transition: all 0.2s ease;
        }

        .tab-button:hover {
            color: var(--text-primary);
        }

        .tab-button.active {
            color: var(--primary-color);
            border-bottom-color: var(--primary-color);
        }

        .tab-count {
            color: var(--text-secondary);
            font-size: 0.75rem;
            margin-left: 0.25rem;
        }

        .tab-content {
            display: none;
        }

        .tab-content.active {
            display: block;
        }

        .client-overview h3 {
            margin: 0 0 1rem 0;
            color: var(--text-primary);
        }

        .client-overview p {
            color: var(--text-secondary);
            line-height: 1.6;
            margin-bottom: 1rem;
        }

        .company-category, .company-classification {
            background: var(--background-color);
            padding: 0.75rem;
            border-radius: var(--border-radius);
            margin-bottom: 0.75rem;
            border: 1px solid var(--border-color);
        }

        @media (max-width: 768px) {
            .client-info-grid {
                grid-template-columns: 1fr;
            }
            
            .client-detail-header {
                flex-direction: column;
                gap: 1rem;
            }
            
            .client-detail-actions {
                width: 100%;
                justify-content: stretch;
            }
            
            .client-detail-actions .btn {
                flex: 1;
            }
        }
    </style>
</head>
<body>
    <div class="crm-container">
        <!-- Sidebar -->
        <div class="crm-sidebar">
            <div class="crm-header">
                <img src="assets/thecache_logo.png" alt="The Cache Logo" class="header-logo">
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn btn-primary" onclick="crmApp.showNewClientModal()">
                        <i class="fas fa-plus"></i> New Client
                    </button>
                    <button class="btn btn-secondary" onclick="crmApp.showCsvUploadModal()">
                        <i class="fas fa-upload"></i> Import CSV
                    </button>
                </div>
            </div>

            <div class="client-filters" style="padding: 1rem;">
                <div class="client-search">
                    <i class="fas fa-search"></i>
                    <input type="text" id="clientSearch" placeholder="Search clients..." onkeyup="filterClients()">
                </div>
            </div>

            <div class="client-list">
                <div class="client-list-header">
                    <h3>Clients</h3>
                    <div class="client-filters">
                        <select id="statusFilter" onchange="filterClients()">
                            <option value="">All Status</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <select id="typeFilter" onchange="filterClients()">
                            <option value="">All Types</option>
                            <option value="customer">Customer</option>
                            <option value="lead">Lead</option>
                            <option value="prospect">Prospect</option>
                        </select>
                    </div>
                </div>

                <div id="clientTableContainer">
                    <div class="loading">
                        <i class="fas fa-spinner"></i>
                        <p>Loading clients...</p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div class="crm-main">
            <div class="crm-header">
                <h1 id="mainTitle">Client Management</h1>
                <div class="crm-header-actions" style="display: flex; gap: 1rem; align-items: center;">
                    <div id="headerNav" style="display: flex; gap: 0.5rem; align-items: center;">
                        <button class="btn btn-secondary" data-module="kanban" onclick="goToKanban()">
                            <i class="fas fa-tasks"></i> Kanban Board
                        </button>
                        <button class="btn btn-secondary" data-module="notes" onclick="window.location.href='notes.html'">
                            <i class="fas fa-sticky-note"></i> Notes
                        </button>
                    </div>
                    
                    <div class="dropdown">
                        <button class="btn btn-secondary dropdown-toggle" id="userDropdown">
                            <span id="currentUserName">User</span> <i class="fas fa-user"></i>
                            <i class="fas fa-chevron-down"></i>
                        </button>
                        <div class="dropdown-menu" id="userMenu">
                            <div class="dropdown-header">
                                <i class="fas fa-user"></i>
                                <span id="userDropdownName">User</span>
                            </div>
                            <div class="dropdown-divider"></div>
                            <button class="dropdown-item" onclick="window.location.href='/preferences'">
                                <i class="fas fa-cog"></i> Preferences
                            </button>
                            <button class="dropdown-item" onclick="crmApp.logout()">
                                <i class="fas fa-sign-out-alt"></i> Logout
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="crm-content">
                <div id="clientList" class="client-list">
                    <div class="empty-state">
                        <i class="fas fa-users"></i>
                        <h3>No Clients Selected</h3>
                        <p>Select a client from the sidebar to view details</p>
                    </div>
                </div>

                <div id="clientDetail" class="client-detail">
                    <!-- Client detail content will be loaded here -->
                </div>
            </div>
        </div>
    </div>

    <!-- New Client Modal -->
    <div id="newClientModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>New Client</h2>
                <button class="btn btn-icon" onclick="crmApp.hideNewClientModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="newClientForm" onsubmit="crmApp.createClient(event)">
                <div class="modal-body">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="clientName">Company Name <span class="required">*</span></label>
                            <div class="input-with-search">
                                <input type="text" id="clientName" name="name" required>
                                <button type="button" class="btn btn-secondary search-btn" onclick="crmApp.searchCompany()">
                                    <i class="fas fa-search"></i> Search
                                </button>
                            </div>
                            <small style="color: var(--text-secondary); font-size: 0.75rem; margin-top: 0.25rem; display: block;">
                                Search for company by name or phone number
                            </small>
                        </div>

                        <!-- Company Search Results -->
                        <div id="companySearchResults" class="company-search-results" style="display: none; margin-bottom: 1rem;"></div>

                        <div class="form-group">
                            <label for="clientEmail">Email <span class="required">*</span></label>
                            <input type="email" id="clientEmail" name="email" required>
                        </div>

                        <div class="form-group">
                            <label for="clientType">Company Type <span class="required">*</span></label>
                            <select id="clientType" name="company_type" required>
                                <option value="lead">Lead</option>
                                <option value="prospect">Prospect</option>
                                <option value="customer">Customer</option>
                                <option value="vendor">Vendor</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="clientStatus">Status <span class="required">*</span></label>
                            <select id="clientStatus" name="status" required>
                                <option value="active">Active</option>
                                <option value="lead">Lead</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="clientCategory">Company Category</label>
                            <select id="clientCategory" name="company_category">
                                <option value="Standard">Standard</option>
                                <option value="Premium">Premium</option>
                                <option value="Enterprise">Enterprise</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="clientNumber">Company Number</label>
                            <input type="text" id="clientNumber" name="company_number">
                        </div>

                        <div class="form-group">
                            <label for="contactName">Contact Name</label>
                            <input type="text" id="contactName" name="contact_name">
                        </div>

                        <div class="form-group">
                            <label for="contactNumber">Contact Number</label>
                            <input type="tel" id="contactNumber" name="contact_number">
                        </div>

                        <div class="form-group">
                            <label for="alternatePhone">Alternate Phone</label>
                            <input type="tel" id="alternatePhone" name="alternate_phone">
                        </div>

                        <div class="form-group">
                            <label for="clientUrl">Website</label>
                            <input type="url" id="clientUrl" name="url">
                        </div>

                        <div class="form-group">
                            <label for="address1">Address 1</label>
                            <input type="text" id="address1" name="address_1">
                        </div>

                        <div class="form-group">
                            <label for="address2">Address 2</label>
                            <input type="text" id="address2" name="address_2">
                        </div>

                        <div class="form-group">
                            <label for="city">City</label>
                            <input type="text" id="city" name="city">
                        </div>

                        <div class="form-group">
                            <label for="state">State</label>
                            <input type="text" id="state" name="state">
                        </div>

                        <div class="form-group">
                            <label for="zipCode">Zip Code</label>
                            <input type="text" id="zipCode" name="zip_code">
                        </div>

                        <div class="form-group">
                            <label for="country">Country</label>
                            <input type="text" id="country" name="country" value="United States">
                        </div>

                        <div class="form-group">
                            <label for="classification">Classification</label>
                            <input type="text" id="classification" name="classification">
                        </div>

                        <div class="form-group">
                            <label for="accountManager">Account Manager</label>
                            <select id="accountManager" name="account_manager_id">
                                <option value="">Select Account Manager...</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="clientNotes">Notes</label>
                        <textarea id="clientNotes" name="notes" rows="3"></textarea>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="crmApp.hideNewClientModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Client</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Add Activity Modal -->
    <div id="addActivityModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add Activity</h2>
                <button class="btn btn-icon" onclick="hideAddActivityModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="addActivityForm" onsubmit="crmApp.submitActivity(event)" data-client-id="" data-activity-id="">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="activityTitle">Title <span class="required">*</span></label>
                        <input type="text" id="activityTitle" name="title" required>
                    </div>

                    <div class="form-group">
                        <label for="activityType">Activity Type <span class="required">*</span></label>
                        <select id="activityType" name="activity_type" required>
                            <option value="note">Note</option>
                            <option value="call">Call</option>
                            <option value="email">Email</option>
                            <option value="meeting">Meeting</option>
                            <option value="task">Task</option>
                            <option value="quote">Quote</option>
                            <option value="invoice">Invoice</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="activityDescription">Description</label>
                        <textarea id="activityDescription" name="description" rows="4"></textarea>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="crmApp.hideAddActivityModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Activity</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Add Contact Modal -->
    <div id="addContactModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add Contact</h2>
                <button class="btn btn-icon" onclick="hideAddContactModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="addContactForm" onsubmit="crmApp.submitContact(event)" data-client-id="">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="contactName">Name <span class="required">*</span></label>
                        <input type="text" id="contactName" name="name" required>
                    </div>

                    <div class="form-group">
                        <label for="contactEmail">Email</label>
                        <input type="email" id="contactEmail" name="email">
                    </div>

                    <div class="form-group">
                        <label for="contactPhone">Phone</label>
                        <input type="tel" id="contactPhone" name="phone">
                    </div>

                    <div class="form-group">
                        <label for="contactMobilePhone">Mobile Phone</label>
                        <input type="tel" id="contactMobilePhone" name="mobile_phone">
                    </div>

                    <div class="form-group">
                        <label for="contactPosition">Position</label>
                        <input type="text" id="contactPosition" name="position">
                    </div>

                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="isPrimary" name="is_primary">
                            Primary Contact
                        </label>
                    </div>

                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="isBilling" name="is_billing_contact">
                            Billing Contact
                        </label>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="crmApp.hideAddContactModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Contact</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Add Todo Modal -->
    <div id="addTodoModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add To-Do</h2>
                <button class="btn btn-icon" onclick="hideAddTodoModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="addTodoForm" onsubmit="crmApp.submitTodo(event)" data-client-id="">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="todoTitle">Title <span class="required">*</span></label>
                        <input type="text" id="todoTitle" name="title" required>
                    </div>

                    <div class="form-group">
                        <label for="todoDescription">Description</label>
                        <textarea id="todoDescription" name="description" rows="3"></textarea>
                    </div>

                    <div class="form-group">
                        <label for="todoDueDate">Due Date</label>
                        <input type="date" id="todoDueDate" name="due_date">
                    </div>

                    <div class="form-group">
                        <label for="todoDueTime">Due Time</label>
                        <input type="time" id="todoDueTime" name="due_time">
                    </div>

                    <div class="form-group">
                        <label for="todoPriority">Priority</label>
                        <select id="todoPriority" name="priority">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="todoStatus">Status</label>
                        <select id="todoStatus" name="status">
                            <option value="pending" selected>Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="completed">Completed</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="crmApp.hideAddTodoModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Add Todo</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Client Modal -->
    <div id="editClientModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Client</h2>
                <button class="btn btn-icon" onclick="hideEditClientModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="editClientForm" onsubmit="updateClient(event)">
                <div class="modal-body">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="editClientName">Company Name <span class="required">*</span></label>
                            <input type="text" id="editClientName" name="name" required>
                        </div>

                        <div class="form-group">
                            <label for="editClientEmail">Email <span class="required">*</span></label>
                            <input type="email" id="editClientEmail" name="email" required>
                        </div>

                        <div class="form-group">
                            <label for="editClientType">Company Type <span class="required">*</span></label>
                            <select id="editClientType" name="company_type" required>
                                <option value="lead">Lead</option>
                                <option value="prospect">Prospect</option>
                                <option value="customer">Customer</option>
                                <option value="vendor">Vendor</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="editClientStatus">Status <span class="required">*</span></label>
                            <select id="editClientStatus" name="status" required>
                                <option value="active">Active</option>
                                <option value="lead">Lead</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="editClientCategory">Company Category</label>
                            <select id="editClientCategory" name="company_category">
                                <option value="Standard">Standard</option>
                                <option value="Premium">Premium</option>
                                <option value="Enterprise">Enterprise</option>
                            </select>
                        </div>

                        <div class="form-group">
                            <label for="editClientNumber">Company Number</label>
                            <input type="text" id="editClientNumber" name="company_number">
                        </div>

                        <div class="form-group">
                            <label for="editContactName">Contact Name</label>
                            <input type="text" id="editContactName" name="contact_name">
                        </div>

                        <div class="form-group">
                            <label for="editContactNumber">Contact Number</label>
                            <input type="tel" id="editContactNumber" name="contact_number">
                        </div>

                        <div class="form-group">
                            <label for="editAlternatePhone">Alternate Phone</label>
                            <input type="tel" id="editAlternatePhone" name="alternate_phone">
                        </div>

                        <div class="form-group">
                            <label for="editClientUrl">Website</label>
                            <input type="url" id="editClientUrl" name="url">
                        </div>

                        <div class="form-group">
                            <label for="editAddress1">Address 1</label>
                            <input type="text" id="editAddress1" name="address_1">
                        </div>

                        <div class="form-group">
                            <label for="editAddress2">Address 2</label>
                            <input type="text" id="editAddress2" name="address_2">
                        </div>

                        <div class="form-group">
                            <label for="editCity">City</label>
                            <input type="text" id="editCity" name="city">
                        </div>

                        <div class="form-group">
                            <label for="editState">State</label>
                            <input type="text" id="editState" name="state">
                        </div>

                        <div class="form-group">
                            <label for="editZipCode">Zip Code</label>
                            <input type="text" id="editZipCode" name="zip_code">
                        </div>

                        <div class="form-group">
                            <label for="editCountry">Country</label>
                            <input type="text" id="editCountry" name="country" value="United States">
                        </div>

                        <div class="form-group">
                            <label for="editClassification">Classification</label>
                            <input type="text" id="editClassification" name="classification">
                        </div>

                        <div class="form-group">
                            <label for="editAccountManager">Account Manager</label>
                            <select id="editAccountManager" name="account_manager_id">
                                <option value="">Select Account Manager...</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="editClientNotes">Notes</label>
                        <textarea id="editClientNotes" name="notes" rows="3"></textarea>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="hideEditClientModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Client</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Contact Modal -->
    <div id="editContactModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit Contact</h2>
                <button class="btn btn-icon" onclick="hideEditContactModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="editContactForm" onsubmit="submitEditContact(event)">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="editContactNameField">Name <span class="required">*</span></label>
                        <input type="text" id="editContactNameField" name="name" required>
                    </div>

                    <div class="form-group">
                        <label for="editContactEmail">Email</label>
                        <input type="email" id="editContactEmail" name="email">
                    </div>

                    <div class="form-group">
                        <label for="editContactPhone">Phone</label>
                        <input type="tel" id="editContactPhone" name="phone">
                    </div>

                    <div class="form-group">
                        <label for="editContactMobilePhone">Mobile Phone</label>
                        <input type="tel" id="editContactMobilePhone" name="mobile_phone">
                    </div>

                    <div class="form-group">
                        <label for="editContactPosition">Position</label>
                        <input type="text" id="editContactPosition" name="position">
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="editContactIsPrimary" name="is_primary">
                            <span class="checkmark"></span>
                            Primary Contact
                        </label>
                    </div>

                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" id="editContactIsBilling" name="is_billing_contact">
                            <span class="checkmark"></span>
                            Billing Contact
                        </label>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="hideEditContactModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Contact</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Edit Todo Modal -->
    <div id="editTodoModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Edit To-Do</h2>
                <button class="btn btn-icon" onclick="hideEditTodoModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="editTodoForm" onsubmit="submitEditTodo(event)">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="editTodoTitle">Title <span class="required">*</span></label>
                        <input type="text" id="editTodoTitle" name="title" required>
                    </div>

                    <div class="form-group">
                        <label for="editTodoDescription">Description</label>
                        <textarea id="editTodoDescription" name="description" rows="3"></textarea>
                    </div>

                    <div class="form-group">
                        <label for="editTodoDueDate">Due Date</label>
                        <input type="date" id="editTodoDueDate" name="due_date">
                    </div>

                    <div class="form-group">
                        <label for="editTodoDueTime">Due Time</label>
                        <input type="time" id="editTodoDueTime" name="due_time">
                    </div>

                    <div class="form-group">
                        <label for="editTodoPriority">Priority</label>
                        <select id="editTodoPriority" name="priority">
                            <option value="low">Low</option>
                            <option value="medium" selected>Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="editTodoStatus">Status</label>
                        <select id="editTodoStatus" name="status">
                            <option value="pending">Pending</option>
                            <option value="closed">Closed</option>
                        </select>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="hideEditTodoModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update To-Do</button>
                </div>
            </form>
        </div>
    </div>

    <!-- View Todo Modal -->
    <div id="viewTodoModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Todo Details</h2>
                <button class="btn btn-icon" onclick="hideViewTodoModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="modal-body">
                <div class="todo-detail-grid">
                    <div class="detail-group">
                        <label class="detail-label">Title</label>
                        <div class="detail-value" id="viewTodoTitle"></div>
                    </div>

                    <div class="detail-group">
                        <label class="detail-label">Description</label>
                        <div class="detail-value" id="viewTodoDescription"></div>
                    </div>

                    <div class="detail-group">
                        <label class="detail-label">Due Date</label>
                        <div class="detail-value" id="viewTodoDueDate"></div>
                    </div>

                    <div class="detail-group">
                        <label class="detail-label">Due Time</label>
                        <div class="detail-value" id="viewTodoDueTime"></div>
                    </div>

                    <div class="detail-group">
                        <label class="detail-label">Priority</label>
                        <div class="detail-value" id="viewTodoPriority"></div>
                    </div>

                    <div class="detail-group">
                        <label class="detail-label">Status</label>
                        <div class="detail-value" id="viewTodoStatus"></div>
                    </div>

                    <div class="detail-group">
                        <label class="detail-label">Assigned To</label>
                        <div class="detail-value" id="viewTodoUser"></div>
                    </div>

                    <div class="detail-group">
                        <label class="detail-label">Created</label>
                        <div class="detail-value" id="viewTodoCreated"></div>
                    </div>

                    <div class="detail-group" id="viewTodoCompletedStatus" style="display: none;">
                        <label class="detail-label">Completed on</label>
                        <div class="detail-value" id="viewTodoCompletedDate"></div>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="hideViewTodoModal()">Close</button>
                <button type="button" class="btn btn-primary" id="viewTodoEditBtn" onclick="editTodoFromView()">Edit Todo</button>
            </div>
        </div>
    </div>

    <!-- Upload Attachment Modal -->
    <div id="uploadAttachmentModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Upload Attachment</h2>
                <button class="btn btn-icon" onclick="hideUploadAttachmentModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="uploadAttachmentForm" onsubmit="submitAttachment(event)">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="attachmentTitle">Title <span class="required">*</span></label>
                        <input type="text" id="attachmentTitle" name="title" required>
                    </div>

                    <div class="form-group">
                        <label for="attachmentDescription">Description</label>
                        <textarea id="attachmentDescription" name="description" rows="3"></textarea>
                    </div>

                    <div class="form-group">
                        <label for="attachmentFile">File <span class="required">*</span></label>
                        <input type="file" id="attachmentFile" name="file" required accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif">
                        <small class="form-help">Max file size: 10MB. Supported formats: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, GIF</small>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="hideUploadAttachmentModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Upload Attachment</button>
                </div>
            </form>
        </div>
    </div>

    <!-- New Client Modal -->
    <div id="newClientModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Add New Client</h2>
                <button class="btn btn-icon" onclick="hideNewClientModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <form id="newClientForm" onsubmit="crmApp.createClient(event)">
                <div class="modal-body">
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="clientName">Company Name <span class="required">*</span></label>
                            <input type="text" id="clientName" name="name" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="clientEmail">Email <span class="required">*</span></label>
                            <input type="email" id="clientEmail" name="email" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="clientType">Company Type</label>
                            <select id="clientType" name="company_type">
                                <option value="lead">Lead</option>
                                <option value="customer">Customer</option>
                                <option value="prospect">Prospect</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="clientStatus">Status</label>
                            <select id="clientStatus" name="status">
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="clientCategory">Category</label>
                            <select id="clientCategory" name="company_category">
                                <option value="Standard">Standard</option>
                                <option value="Premium">Premium</option>
                                <option value="Enterprise">Enterprise</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="clientNumber">Company Number</label>
                            <input type="text" id="clientNumber" name="company_number">
                        </div>
                        
                        <div class="form-group">
                            <label for="contactName">Contact Name</label>
                            <input type="text" id="contactName" name="contact_name">
                        </div>
                        
                        <div class="form-group">
                            <label for="contactNumber">Contact Number</label>
                            <input type="tel" id="contactNumber" name="contact_number">
                        </div>
                        
                        <div class="form-group">
                            <label for="alternatePhone">Alternate Phone</label>
                            <input type="tel" id="alternatePhone" name="alternate_phone">
                        </div>
                        
                        <div class="form-group">
                            <label for="clientUrl">Website URL</label>
                            <input type="url" id="clientUrl" name="url">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="clientAddress1">Address 1</label>
                        <input type="text" id="clientAddress1" name="address_1">
                    </div>
                    
                    <div class="form-group">
                        <label for="clientAddress2">Address 2</label>
                        <input type="text" id="clientAddress2" name="address_2">
                    </div>
                    
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="clientCity">City</label>
                            <input type="text" id="clientCity" name="city">
                        </div>
                        
                        <div class="form-group">
                            <label for="clientState">State</label>
                            <input type="text" id="clientState" name="state">
                        </div>
                        
                        <div class="form-group">
                            <label for="clientZipCode">Zip Code</label>
                            <input type="text" id="clientZipCode" name="zip_code">
                        </div>
                        
                        <div class="form-group">
                            <label for="clientCountry">Country</label>
                            <input type="text" id="clientCountry" name="country" value="United States">
                        </div>
                        
                        <div class="form-group">
                            <label for="clientClassification">Classification</label>
                            <input type="text" id="clientClassification" name="classification">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="clientNotes">Notes</label>
                        <textarea id="clientNotes" name="notes" rows="3"></textarea>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="hideNewClientModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Create Client</button>
                </div>
            </form>
        </div>
    </div>

    <!-- View Contact Modal -->
    <div id="viewContactModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Contact Details</h2>
                <button class="btn btn-icon" onclick="hideViewContactModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="modal-body">
                <div class="contact-detail-grid">
                    <div class="detail-group">
                        <label class="detail-label">Name</label>
                        <div class="detail-value" id="viewContactName"></div>
                    </div>

                    <div class="detail-group">
                        <label class="detail-label">Email</label>
                        <div class="detail-value" id="viewContactEmail"></div>
                    </div>

                    <div class="detail-group">
                        <label class="detail-label">Phone</label>
                        <div class="detail-value" id="viewContactPhone"></div>
                    </div>

                    <div class="detail-group">
                        <label class="detail-label">Mobile Phone</label>
                        <div class="detail-value" id="viewContactMobilePhone"></div>
                    </div>

                    <div class="detail-group">
                        <label class="detail-label">Position</label>
                        <div class="detail-value" id="viewContactPosition"></div>
                    </div>

                    <div class="detail-group">
                        <label class="detail-label">Primary Contact</label>
                        <div class="detail-value" id="viewContactPrimary"></div>
                    </div>

                    <div class="detail-group">
                        <label class="detail-label">Billing Contact</label>
                        <div class="detail-value" id="viewContactBilling"></div>
                    </div>

                    <div class="detail-group">
                        <label class="detail-label">Created</label>
                        <div class="detail-value" id="viewContactCreated"></div>
                    </div>
                </div>
            </div>

            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" onclick="hideViewContactModal()">Close</button>
            </div>
        </div>
    </div>

    <!-- CSV Upload Modal -->
    <div id="csvUploadModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Import Clients from CSV</h2>
                <button class="btn btn-icon" onclick="crmApp.hideCsvUploadModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="csvUploadForm" onsubmit="crmApp.submitCsvUpload(event)">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="csvFile">Select CSV File <span class="required">*</span></label>
                        <input type="file" id="csvFile" name="csv_file" accept=".csv" required>
                        <small class="form-help">Upload a CSV file with client data. Maximum file size: 10MB</small>
                    </div>

                    <div class="form-group">
                        <label for="csvMapping">Column Mapping</label>
                        <div id="csvMappingContainer" style="display: none;">
                            <div class="csv-mapping-grid">
                                <div class="mapping-row">
                                    <label>Company Name:</label>
                                    <select id="mapCompanyName" name="map_company_name">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>Email:</label>
                                    <select id="mapEmail" name="map_email">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>Phone:</label>
                                    <select id="mapPhone" name="map_phone">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>Website:</label>
                                    <select id="mapWebsite" name="map_website">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>Address:</label>
                                    <select id="mapAddress" name="map_address">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>City:</label>
                                    <select id="mapCity" name="map_city">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>State:</label>
                                    <select id="mapState" name="map_state">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>Zip Code:</label>
                                    <select id="mapZipCode" name="map_zip_code">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>Classification:</label>
                                    <select id="mapClassification" name="map_classification">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>Company Type:</label>
                                    <select id="mapCompanyType" name="map_company_type">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="csvPreview">Data Preview</label>
                        <div id="csvPreview" style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color); padding: 0.5rem; background: var(--background-color);">
                            <p style="color: var(--text-secondary); text-align: center;">Upload a CSV file to see preview</p>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="skipFirstRow" name="skip_first_row" checked>
                            Skip first row (headers)
                        </label>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="crmApp.hideCsvUploadModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Import Clients</button>
                </div>
            </form>
        </div>
    </div>

    <!-- Assets CSV Upload Modal -->
    <div id="assetsCsvUploadModal" class="modal">
        <div class="modal-content large">
            <div class="modal-header">
                <h2>Import Assets from CSV</h2>
                <button class="btn btn-icon" onclick="crmApp.hideAssetsCsvUploadModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <form id="assetsCsvUploadForm" onsubmit="crmApp.submitAssetsCsvUpload(event)">
                <div class="modal-body">
                    <div class="form-group">
                        <label for="assetsCsvFile">Select CSV File <span class="required">*</span></label>
                        <input type="file" id="assetsCsvFile" name="csv_file" accept=".csv" required>
                        <small class="form-help">Upload a CSV file with asset data. Maximum file size: 10MB</small>
                    </div>

                    <div class="form-group">
                        <label for="assetsCsvMapping">Column Mapping</label>
                        <div id="assetsCsvMappingContainer" style="display: none;">
                            <div class="csv-mapping-grid">
                                <div class="mapping-row">
                                    <label>Asset Name:</label>
                                    <select id="mapAssetName" name="map_asset_name">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>Asset Type:</label>
                                    <select id="mapAssetType" name="map_asset_type">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>Model:</label>
                                    <select id="mapAssetModel" name="map_asset_model">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>Serial Number:</label>
                                    <select id="mapAssetSerialNumber" name="map_asset_serial_number">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>Status:</label>
                                    <select id="mapAssetStatus" name="map_asset_status">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>Location:</label>
                                    <select id="mapAssetLocation" name="map_asset_location">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>IP Address:</label>
                                    <select id="mapAssetIpAddress" name="map_asset_ip_address">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>Purchase Date:</label>
                                    <select id="mapAssetPurchaseDate" name="map_asset_purchase_date">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>Warranty Expiry:</label>
                                    <select id="mapAssetWarrantyExpiry" name="map_asset_warranty_expiry">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>Notes:</label>
                                    <select id="mapAssetNotes" name="map_asset_notes">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                                <div class="mapping-row">
                                    <label>IT Glue ID:</label>
                                    <select id="mapAssetItGlueId" name="map_asset_it_glue_id">
                                        <option value="">Select column...</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="assetsCsvPreview">Data Preview</label>
                        <div id="assetsCsvPreview" style="max-height: 200px; overflow-y: auto; border: 1px solid var(--border-color); padding: 0.5rem; background: var(--background-color);">
                            <p style="color: var(--text-secondary); text-align: center;">Upload a CSV file to see preview</p>
                        </div>
                    </div>

                    <div class="form-group">
                        <label>
                            <input type="checkbox" id="assetsSkipFirstRow" name="skip_first_row" checked>
                            Skip first row (headers)
                        </label>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" onclick="crmApp.hideAssetsCsvUploadModal()">Cancel</button>
                    <button type="submit" class="btn btn-primary">Import Assets</button>
                </div>
            </form>
        </div>
    </div>

    <script src="assets/js/logo-helper.js?v=1.1"></script>
    <script src="assets/js/crm.js?v=1.0.30"></script>
</body>
</html>