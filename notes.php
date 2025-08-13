<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Notes - Kanban CRM</title>
    <link rel="stylesheet" href="assets/css/styles.css?v5.5">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/theme/monokai.min.css">
    <style>
        /* Modern Notes Interface Styles */
        :root {
            --notes-sidebar-width: 400px;
            --notes-border-radius: 12px;
            --notes-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            --notes-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            --notes-transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .notes-container {
            display: flex;
            height: calc(100vh - 80px);
            background: var(--background-color);
            gap: 0;
            overflow: hidden; /* Prevent container overflow */
        }
        
        .notes-sidebar {
            width: var(--notes-sidebar-width);
            background: var(--card-background);
            border-right: 1px solid var(--border-color);
            display: flex;
            flex-direction: column;
            box-shadow: var(--notes-shadow);
            position: relative;
            z-index: 10;
            height: 100%;
            overflow: hidden;
        }
        
        .notes-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: var(--card-background);
            margin: 16px;
            border-radius: var(--notes-border-radius);
            box-shadow: var(--notes-shadow-lg);
            overflow: hidden;
            height: calc(100vh - 112px); /* Force specific height */
        }
        
        .notes-toolbar {
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-color);
            background: var(--card-background);
            display: flex;
            gap: 12px;
            align-items: center;
            justify-content: space-between;
        }

        .notes-toolbar .btn {
            border-radius: 8px;
            font-weight: 500;
            transition: var(--notes-transition);
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
        }

        .notes-toolbar .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .notes-list {
            flex: 1;
            overflow-y: scroll !important;
            overflow-x: hidden;
            padding: 16px;
            background: transparent;
            max-height: none !important;
            height: 0 !important;
            min-height: 200px !important; /* Force minimum height for scrolling */
        }

        .notes-list::-webkit-scrollbar {
            width: 6px;
        }

        .notes-list::-webkit-scrollbar-track {
            background: transparent;
        }

        .notes-list::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.3);
            border-radius: 3px;
        }

        .notes-list::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.5);
        }
        
        /* Ensure proper scrolling behavior */
        .notes-list {
            scroll-behavior: smooth;
            scroll-padding-top: 16px; /* Keep some padding when scrolling to top */
        }
        
        /* Force scroll to top when new notes are added */
        .notes-list.scroll-to-top {
            scrollTop: 0;
        }
        
        .note-item {
            background: var(--card-background);
            border: 1px solid var(--border-color);
            border-radius: var(--notes-border-radius);
            padding: 16px;
            margin-bottom: 12px;
            cursor: pointer;
            transition: var(--notes-transition);
            position: relative;
            overflow: hidden;
        }

        .note-item::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--primary-color), var(--primary-color-dark));
            transform: scaleX(0);
            transition: var(--notes-transition);
        }
        
        .note-item:hover {
            border-color: var(--primary-color);
            box-shadow: var(--notes-shadow);
            transform: translateY(-2px);
        }

        .note-item:hover::before {
            transform: scaleX(1);
        }
        
        .note-item.active {
            border-color: var(--primary-color);
            background: linear-gradient(135deg, var(--primary-color), var(--primary-color-dark));
            color: white;
            box-shadow: var(--notes-shadow-lg);
        }

        .note-item.active::before {
            transform: scaleX(1);
            background: white;
        }
        
        .note-title {
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 16px;
            line-height: 1.4;
            display: flex;
            align-items: center;
        }

        .note-item.active .note-title {
            color: white;
        }
        
        .note-meta {
            font-size: 13px;
            color: var(--text-secondary);
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
        }

        .note-item.active .note-meta {
            color: rgba(255, 255, 255, 0.8);
        }

        .note-meta .linked-entity {
            background: linear-gradient(135deg, var(--success-color), #38a169);
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }

        .note-item.active .note-meta .linked-entity {
            background: rgba(255, 255, 255, 0.2);
            color: white;
        }

        .note-meta .note-tags {
            background: linear-gradient(135deg, var(--primary-color), var(--primary-color-dark));
            color: white;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }

        .note-item.active .note-meta .note-tags {
            background: rgba(255, 255, 255, 0.2);
            color: white;
        }
        
        .note-editor {
            flex: 1;
            display: flex;
            flex-direction: column;
        }
        
        .markdown-preview {
            padding: 24px;
            background: var(--card-background);
            border: 1px solid var(--border-color);
            border-radius: var(--notes-border-radius);
            min-height: 400px;
            overflow-y: auto;
            line-height: 1.7;
            font-size: 15px;
        }
        
        .markdown-preview h1,
        .markdown-preview h2,
        .markdown-preview h3,
        .markdown-preview h4,
        .markdown-preview h5,
        .markdown-preview h6 {
            margin-top: 2rem;
            margin-bottom: 1rem;
            color: var(--text-primary);
            font-weight: 600;
        }
        
        .markdown-preview h1 { font-size: 2.25rem; }
        .markdown-preview h2 { font-size: 1.875rem; }
        .markdown-preview h3 { font-size: 1.5rem; }
        .markdown-preview h4 { font-size: 1.25rem; }
        
        .markdown-preview p {
            margin-bottom: 1.25rem;
            color: var(--text-primary);
        }
        
        .markdown-preview ul,
        .markdown-preview ol {
            margin-bottom: 1.25rem;
            padding-left: 2rem;
        }
        
        .markdown-preview li {
            margin-bottom: 0.5rem;
            color: var(--text-primary);
        }
        
        .markdown-preview code {
            background: var(--input-bg);
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 14px;
            color: var(--danger-color);
        }
        
        .markdown-preview pre {
            background: var(--light-color);
            color: var(--text-primary);
            padding: 1.5rem;
            border-radius: var(--notes-border-radius);
            overflow-x: auto;
            margin-bottom: 1.5rem;
            box-shadow: var(--notes-shadow);
        }
        
        .markdown-preview pre code {
            background: none;
            padding: 0;
            color: inherit;
        }
        
        .markdown-preview blockquote {
            border-left: 4px solid var(--primary-color);
            padding-left: 1.5rem;
            margin: 1.5rem 0;
            color: var(--text-secondary);
            font-style: italic;
            background: rgba(74, 158, 255, 0.05);
            padding: 1rem 1.5rem;
            border-radius: 0 8px 8px 0;
        }
        
        .markdown-preview table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1.5rem;
            border-radius: var(--notes-border-radius);
            overflow: hidden;
            box-shadow: var(--notes-shadow);
        }
        
        .markdown-preview th,
        .markdown-preview td {
            border: 1px solid var(--border-color);
            padding: 0.75rem;
            text-align: left;
        }
        
        .markdown-preview th {
            background: var(--input-bg);
            font-weight: 600;
            color: var(--text-primary);
        }
        
        .editor-toolbar {
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-color);
            background: var(--card-background);
            display: flex;
            gap: 16px;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
        }

        .editor-toolbar-left,
        .editor-toolbar-right {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .editor-content {
            flex: 1;
            padding: 0;
            background: var(--card-background);
            overflow: hidden; /* Prevent content overflow */
            display: flex;
            flex-direction: column;
            height: 0; /* Force flex item to respect height */
            min-height: 0; /* Allow flex item to shrink */
            position: relative; /* For absolute positioning of children */
        }
        
        .CodeMirror {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            height: 100% !important;
            width: 100% !important;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 14px;
            border-radius: var(--notes-border-radius);
            border: 1px solid var(--border-color);
            box-shadow: var(--notes-shadow);

        }
        
        /* Add padding to CodeMirror content */
        .CodeMirror-lines {
            padding: 24px !important;
        }
        
        /* Ensure the textarea has proper dimensions */
        #noteEditor {
            width: 100% !important;
            height: 100% !important;
            min-height: 300px !important;
            resize: none;
        }
        
        /* Ensure editor container has proper dimensions */
        #editorContainer {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            height: 100% !important;
            width: 100% !important;
        }
        
        /* Ensure preview container has proper dimensions and scrolling */
        #previewContainer {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            height: 100% !important;
            width: 100% !important;
            overflow-y: auto !important;
            overflow-x: hidden;
        }
        
        /* Style the markdown preview content */
        .markdown-preview {
            padding: 24px;
            line-height: 1.6;
        }

        .CodeMirror-focused {
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.1);
        }
        
        .note-links {
            padding: 20px 24px;
            border-top: 1px solid var(--border-color);
            background: var(--card-background);
        }
        
        .link-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px;
            border-radius: var(--notes-border-radius);
            background: var(--input-bg);
            margin-bottom: 8px;
            cursor: pointer;
            transition: var(--notes-transition);
            border: 1px solid var(--border-color);
        }
        
        .link-item:hover {
            background: var(--hover-color);
            border-color: var(--primary-color);
            transform: translateX(4px);
        }
        
        .filters {
            padding: 20px 24px;
            border-bottom: 1px solid var(--border-color);
            background: var(--card-background);
        }
        
        .filter-group {
            display: flex;
            gap: 12px;
            align-items: center;
            margin-bottom: 16px;
            flex-wrap: wrap;
        }

        .filter-group:last-child {
            margin-bottom: 0;
        }
        
        .filter-input {
            padding: 10px 14px;
            border: 1px solid var(--border-color);
            border-radius: 8px;
            background: var(--input-bg);
            color: var(--text-primary);
            font-size: 14px;
            transition: var(--notes-transition);
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .filter-input:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.1);
        }

        .filter-input::placeholder {
            color: var(--text-secondary);
        }
        
        .empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            color: var(--text-secondary);
            text-align: center;
            padding: 48px 24px;
        }
        
        .empty-state i {
            font-size: 4rem;
            margin-bottom: 24px;
            opacity: 0.3;
            color: var(--text-secondary);
        }

        .empty-state h3 {
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 8px;
            color: var(--text-primary);
        }

        .empty-state p {
            font-size: 1rem;
            color: var(--text-secondary);
            max-width: 400px;
            line-height: 1.6;
        }
        
        .note-tags {
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
            margin-top: 8px;
        }
        
        .note-tag {
            background: linear-gradient(135deg, var(--primary-color), var(--primary-color-dark));
            color: white;
            padding: 4px 10px;
            border-radius: 16px;
            font-size: 12px;
            font-weight: 500;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        
        .linked-entity {
            background: linear-gradient(135deg, var(--success-color), #38a169);
            color: white;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            margin-left: 8px;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        /* Modern Button Styles */
        .btn {
            border-radius: 8px;
            font-weight: 500;
            transition: var(--notes-transition);
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            border: none;
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 16px;
            font-size: 14px;
        }

        .btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }

        .btn-primary {
            background: linear-gradient(135deg, var(--primary-color), var(--primary-color-dark));
            color: white;
        }

        .btn-secondary {
            background: var(--input-bg);
            color: var(--text-primary);
            border: 1px solid var(--border-color);
        }

        .btn-danger {
            background: linear-gradient(135deg, var(--danger-color), #e53e3e);
            color: white;
        }

        .btn-icon {
            padding: 8px;
            border-radius: 6px;
            background: var(--input-bg);
            color: var(--text-secondary);
            border: 1px solid var(--border-color);
        }

        .btn-icon:hover {
            background: var(--hover-color);
            color: var(--primary-color);
        }

        /* Modern Checkbox Styles */
        .checkbox-label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
            font-size: 14px;
            color: var(--text-primary);
            user-select: none;
        }

        .checkbox-label input[type="checkbox"] {
            display: none;
        }

        .checkbox-label .checkmark {
            width: 18px;
            height: 18px;
            border: 2px solid var(--border-color);
            border-radius: 4px;
            background: var(--input-bg);
            position: relative;
            transition: var(--notes-transition);
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }

        .checkbox-label:hover .checkmark {
            border-color: var(--primary-color);
            background: rgba(74, 158, 255, 0.05);
        }

        .checkbox-label input[type="checkbox"]:checked + .checkmark {
            background: linear-gradient(135deg, var(--primary-color), var(--primary-color-dark));
            border-color: var(--primary-color);
        }

        .checkbox-label input[type="checkbox"]:checked + .checkmark::after {
            content: '✓';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: white;
            font-size: 12px;
            font-weight: bold;
        }

        /* Header Styles */
        .header {
            background: var(--card-background);
            border-bottom: 1px solid var(--border-color);
            padding: 16px 24px;
            box-shadow: var(--notes-shadow);
        }

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            max-width: 1400px;
            margin: 0 auto;
        }

        .header-left {
            display: flex;
            align-items: center;
            gap: 16px;
        }

        .header-left h1 {
            font-size: 1.875rem;
            font-weight: 700;
            color: var(--text-primary);
            margin: 0;
        }

        .header-right {
            display: flex;
            gap: 12px;
        }

        /* Fix dropdown overflow */
        .filter-input {
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        select.filter-input {
            background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
            background-position: right 8px center;
            background-repeat: no-repeat;
            background-size: 16px;
            padding-right: 32px;
            appearance: none;
        }

        /* Responsive Design */
        @media (max-width: 1024px) {
            .notes-sidebar {
                width: 320px;
            }
        }

        @media (max-width: 768px) {
            .notes-container {
                flex-direction: column;
                height: calc(100vh - 60px);
                position: relative;
            }

            .notes-sidebar {
                width: 100%;
                height: auto;
                max-height: 50vh;
                min-height: 250px;
                position: relative;
                z-index: 20;
                flex-shrink: 0;
            }

            .notes-main {
                margin: 0;
                border-radius: 0;
                flex: 1;
                min-height: 50vh;
                position: relative;
                z-index: 10;
            }

            .header {
                padding: 12px 16px;
            }

            .header-content {
                flex-direction: column;
                gap: 12px;
                align-items: stretch;
            }

            .header-left {
                justify-content: center;
            }

            .header-left h1 {
                font-size: 1.5rem;
            }

            .header-right {
                justify-content: center;
                flex-wrap: wrap;
            }

            .header-right .btn {
                flex: 1;
                min-width: 120px;
                justify-content: center;
            }

            .notes-toolbar {
                padding: 8px 16px;
                flex-direction: row;
                gap: 8px;
                justify-content: space-between;
            }

            .notes-toolbar .btn {
                flex: 1;
                justify-content: center;
            }

            .filters {
                padding: 8px 16px;
            }

            .filter-group {
                flex-direction: row;
                gap: 8px;
                flex-wrap: wrap;
            }

            .filter-input {
                width: auto;
                flex: 1;
                min-width: 120px;
                font-size: 16px; /* Prevents zoom on iOS */
            }

            .notes-list {
                padding: 8px 16px;
                -webkit-overflow-scrolling: touch;
                overflow-y: scroll !important;
                flex: 1;
                max-height: none !important;
                height: auto !important;
            }


            .note-item {
                padding: 12px;
                margin-bottom: 8px;
                min-height: 44px;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                -khtml-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }

            .note-item:hover {
                transform: none;
            }

            .note-item:active {
                transform: scale(0.98);
            }

            .note-title {
                font-size: 14px;
                margin-bottom: 6px;
            }

            .note-meta {
                gap: 6px;
            }

            .note-meta .linked-entity {
                font-size: 11px;
                padding: 3px 6px;
            }

            .editor-toolbar {
                padding: 12px 16px;
                flex-direction: column;
                gap: 8px;
            }

            .editor-toolbar-left,
            .editor-toolbar-right {
                width: 100%;
                flex-direction: column;
                gap: 8px;
            }

            .editor-toolbar-left input,
            .editor-toolbar-right select,
            .editor-toolbar-right input {
                width: 100%;
                font-size: 16px;
            }

            .editor-toolbar-right {
                flex-direction: row;
                flex-wrap: wrap;
            }

            .editor-toolbar-right .btn {
                flex: 1;
                min-width: 80px;
                justify-content: center;
                font-size: 12px;
                padding: 8px 12px;
            }

            .editor-content {
                padding: 0;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                position: relative;
            }

            .CodeMirror {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                height: 100% !important;
                width: 100% !important;
                font-size: 16px !important;
                line-height: 1.4;
           
            }
            
            #previewContainer {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                height: 100% !important;
                width: 100% !important;
                overflow-y: auto !important;
                overflow-x: hidden;
            }
            
            .markdown-preview {
                padding: 12px;
                line-height: 1.6;
            }

            .note-links {
                padding: 12px 16px;
            }

            .empty-state {
                padding: 24px 16px;
            }

            .empty-state h3 {
                font-size: 1.25rem;
            }

            .empty-state p {
                font-size: 0.875rem;
            }

            /* Prevent horizontal scrolling */
            body {
                overflow-x: hidden;
            }

            /* Improve button touch targets */
            .btn {
                min-height: 44px;
            }

            .btn-icon {
                min-width: 44px;
                min-height: 44px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .btn:active {
                transform: scale(0.95);
            }

            /* Better form inputs on mobile */
            input, select, textarea {
                -webkit-appearance: none;
                border-radius: 8px;
            }

            /* Improve dropdown appearance on mobile */
            select {
                background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
                background-position: right 8px center;
                background-repeat: no-repeat;
                background-size: 16px;
                padding-right: 32px;
            }

            /* Hide scrollbars on mobile for cleaner look */
            .notes-list::-webkit-scrollbar {
                width: 0;
                background: transparent;
            }
        }

        @media (max-width: 480px) {
            .notes-container {
                height: calc(100vh - 50px);
            }

            .notes-sidebar {
                max-height: 60vh;
                min-height: 300px;
            }

            .notes-main {
                min-height: 40vh;
            }

            .header {
                padding: 8px 12px;
            }

            .header-left h1 {
                font-size: 1.25rem;
            }

            .header-right .btn {
                min-width: 100px;
                font-size: 12px;
                padding: 8px 12px;
            }

            .notes-toolbar {
                padding: 6px 12px;
                flex-direction: row;
                gap: 6px;
            }

            .notes-toolbar .btn {
                flex: 1;
            }

            .filters {
                padding: 6px 12px;
            }

            .filter-group {
                flex-direction: row;
                gap: 6px;
                flex-wrap: wrap;
            }

            .filter-input {
                width: auto;
                flex: 1;
                min-width: 100px;
            }

            .notes-list {
                padding: 6px 12px;
                overflow-y: scroll !important;
                max-height: none !important;
                height: auto !important;
            }

            .note-item {
                padding: 10px;
                margin-bottom: 6px;
            }

            .note-title {
                font-size: 13px;
            }

            .note-meta .linked-entity {
                font-size: 10px;
                padding: 2px 4px;
            }

            .editor-toolbar {
                padding: 8px 12px;
            }

            .editor-toolbar-right .btn {
                min-width: 70px;
                font-size: 11px;
                padding: 6px 8px;
            }

            .editor-content {
                padding: 0;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                position: relative;
            }

            .note-links {
                padding: 8px 12px;
            }

            /* Better spacing for mobile */
            .filter-group {
                margin-bottom: 8px;
            }

            .filter-group:last-child {
                margin-bottom: 0;
            }

            /* Better modal handling on mobile */
            .modal-content {
                margin: 10px;
                max-height: calc(100vh - 20px);
                overflow-y: auto;
            }
        }

        /* Enhanced Focus States and Animations */
        .filter-input:focus,
        .CodeMirror-focused,
        .btn:focus {
            outline: none;
            border-color: var(--primary-color);
            box-shadow: 0 0 0 3px rgba(74, 158, 255, 0.1);
        }

        /* Smooth transitions for all interactive elements */
        .note-item,
        .btn,
        .filter-input,
        .link-item {
            transition: var(--notes-transition);
        }

        /* Enhanced hover effects */
        .note-item:hover {
            transform: translateY(-2px);
            box-shadow: var(--notes-shadow-lg);
        }

        .btn:hover {
            transform: translateY(-1px);
        }

        /* Loading states */
        .loading {
            opacity: 0.6;
            pointer-events: none;
        }

        /* Success/Error states */
        .success {
            border-color: var(--success-color) !important;
            box-shadow: 0 0 0 3px rgba(72, 187, 120, 0.1) !important;
        }

        .error {
            border-color: var(--danger-color) !important;
            box-shadow: 0 0 0 3px rgba(245, 101, 101, 0.1) !important;
        }

        /* Enhanced scrollbar for webkit browsers */
        ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }

        ::-webkit-scrollbar-track {
            background: transparent;
        }

        ::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.3);
            border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.5);
        }

        /* Selection styles */
        ::selection {
            background: rgba(74, 158, 255, 0.2);
            color: inherit;
        }

        /* Focus visible for accessibility */
        .btn:focus-visible,
        .filter-input:focus-visible,
        .note-item:focus-visible {
            outline: 2px solid var(--primary-color);
            outline-offset: 2px;
        }
    </style>
</head>
<body>
    <div class="app-container">
        <!-- Header -->
        <header class="header">
            <div class="header-content">
                <div class="header-left">
                    <img src="assets/thecache_logo.png" alt="The Cache Logo" class="header-logo">
                    <h1>Notes</h1>
                </div>
                <div class="header-right" id="headerNav">
                    <button class="btn btn-secondary" data-module="kanban" onclick="window.location.href='/kanban.html'">
                        <i class="fas fa-tasks"></i> Kanban
                    </button>
                    <button class="btn btn-secondary" data-module="crm" onclick="window.location.href='/crm'">
                        <i class="fas fa-users"></i> CRM
                    </button>
                    <button class="btn btn-secondary" onclick="window.location.href='/preferences'">
                        <i class="fas fa-cog"></i> Preferences
                    </button>
                    <button class="btn btn-danger" onclick="notesApp.logout()">
                        <i class="fas fa-sign-out-alt"></i> Logout
                    </button>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <div class="notes-container">
            <!-- Sidebar -->
            <div class="notes-sidebar">
                <div class="notes-toolbar">
                    <button class="btn btn-primary" onclick="notesApp.createNote()">
                        <i class="fas fa-plus"></i> New Note
                    </button>
                    <button class="btn btn-icon" onclick="notesApp.toggleView()" title="Toggle View">
                        <i class="fas fa-th-large"></i>
                    </button>
                </div>
                
                <div class="filters">
                    <div class="filter-group">
                        <input type="text" class="filter-input" id="searchFilter" placeholder="Search notes..." onkeyup="notesApp.filterNotes()">
                    </div>
                    <div class="filter-group">
                        <select class="filter-input" id="clientFilter" onchange="notesApp.filterNotes()">
                            <option value="">All Clients</option>
                        </select>
                        <select class="filter-input" id="taskFilter" onchange="notesApp.filterNotes()">
                            <option value="">All Tasks</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <!-- Removed pin and archive filters -->
                    </div>
                </div>
                
                <div class="notes-list" id="notesList">
                    <!-- Notes will be loaded here -->
                </div>
            </div>

            <!-- Main Editor -->
            <div class="notes-main">
                <div class="editor-toolbar">
                    <div class="editor-toolbar-left">
                        <input type="text" id="noteTitle" placeholder="Note title..." class="filter-input" style="width: 300px; font-weight: 600;">
                    </div>
                    <div class="editor-toolbar-right">
                        <select id="linkClient" class="filter-input" style="width: 150px;">
                            <option value="">Link to Client</option>
                        </select>
                        <select id="linkTask" class="filter-input" style="width: 150px;">
                            <option value="">Link to Task</option>
                        </select>
                        <input type="text" id="noteTags" placeholder="Tags (comma separated)" class="filter-input" style="width: 200px;">
                        <button class="btn btn-secondary" onclick="notesApp.togglePreview()" id="previewToggle" title="Toggle Preview">
                            <i class="fas fa-eye"></i> Preview
                        </button>
                        <button class="btn btn-primary" onclick="notesApp.saveNote()">
                            <i class="fas fa-save"></i> Save
                        </button>
                        <button class="btn btn-danger" onclick="notesApp.deleteNote()">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
                
                <div class="editor-content">
                    <div id="editorContainer" style="display: block;">
                        <textarea id="noteEditor"></textarea>
                    </div>
                    <div id="previewContainer" style="display: none;">
                        <div id="markdownPreview" class="markdown-preview"></div>
                    </div>
                </div>
                
                <div class="note-links" id="noteLinks" style="display: none;">
                    <h4>Linked Notes</h4>
                    <div id="linkedNotesList">
                        <!-- Linked notes will be shown here -->
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modals -->
    <div id="linkModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h3>Link Notes</h3>
                <span class="close" onclick="notesApp.closeModal('linkModal')">&times;</span>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>Select note to link:</label>
                    <select id="linkNoteSelect" class="form-control">
                        <!-- Notes will be loaded here -->
                    </select>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-secondary" onclick="notesApp.closeModal('linkModal')">Cancel</button>
                <button class="btn btn-primary" onclick="notesApp.createLink()">Create Link</button>
            </div>
        </div>
    </div>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/codemirror.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.2/mode/markdown/markdown.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/4.0.0/marked.min.js"></script>
    <script src="assets/js/logo-helper.js?v=1.0"></script>
    <script src="assets/js/notes.js?v5.2"></script>
    <style> 
        .cm-s-monokai.CodeMirror {
                background: #343f57!important;
                color: #f8f8f2;
            }
    </style>
    
    <script>
        // Force CodeMirror to refresh dimensions after page load
        window.addEventListener('load', function() {
            setTimeout(function() {
                if (window.notesApp && window.notesApp.editor) {
                    window.notesApp.editor.refresh();
                    console.log('CodeMirror refreshed');
                }
            }, 1000);
        });
    </script>
</body>
</html> 