<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Cache - User Preferences</title>
    <link rel="icon" type="image/png" href="assets/thecache_logo.png">
    <link rel="shortcut icon" type="image/png" href="assets/thecache_logo.png">
    <link rel="apple-touch-icon" href="assets/thecache_logo.png">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <link rel="stylesheet" href="assets/css/styles.css?v4.8">
    <style>
        .preferences-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: var(--card-background);
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
        }

        .preferences-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
        }

        .preferences-header h1 {
            margin: 0;
            color: var(--text-primary);
            font-size: 1.75rem;
        }

        .preferences-section {
            margin-bottom: 2rem;
        }

        .section-title {
            font-size: 1.125rem;
            font-weight: 600;
            color: var(--text-primary);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .module-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1rem;
        }

        .module-card {
            background: var(--background-color);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 1.5rem;
            transition: all 0.2s ease;
        }

        .module-card:hover {
            border-color: var(--primary-color);
        }

        .module-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
        }

        .module-info {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }

        .module-icon {
            width: 40px;
            height: 40px;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.125rem;
            color: white;
        }

        .module-icon.crm {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .module-icon.calendar {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }

        .module-icon.notes {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }

        .module-icon.kanban {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
        }

        .module-icon.dashboard {
            background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
        }

        .module-details h3 {
            margin: 0 0 0.25rem 0;
            font-size: 1rem;
            font-weight: 600;
            color: var(--text-primary);
        }

        .module-details p {
            margin: 0;
            font-size: 0.875rem;
            color: var(--text-secondary);
        }

        .toggle-switch {
            position: relative;
            width: 50px;
            height: 26px;
        }

        .toggle-switch input {
            opacity: 0;
            width: 0;
            height: 0;
        }

        .slider {
            position: absolute;
            cursor: pointer;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: #ccc;
            transition: .4s;
            border-radius: 26px;
        }

        .slider:before {
            position: absolute;
            content: "";
            height: 20px;
            width: 20px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .4s;
            border-radius: 50%;
        }

        input:checked + .slider {
            background-color: var(--primary-color);
        }

        input:checked + .slider:before {
            transform: translateX(24px);
        }

        .preferences-actions {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 1rem;
            border-top: 1px solid var(--border-color);
        }

        .back-link {
            color: var(--text-secondary);
            text-decoration: none;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
        }

        .back-link:hover {
            color: var(--primary-color);
        }

        .save-status {
            font-size: 0.875rem;
            color: var(--success-color);
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        .save-status.show {
            opacity: 1;
        }

        /* Security Settings Styles */
        .security-section {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .security-card {
            background: var(--background-light);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 1.5rem;
        }

        .security-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin-bottom: 1rem;
        }

        .security-header h3 {
            margin: 0 0 0.5rem 0;
            color: var(--text-primary);
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .security-header p {
            margin: 0;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        .security-status {
            display: flex;
            align-items: center;
        }

        .status-badge {
            padding: 0.25rem 0.75rem;
            border-radius: 1rem;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.025em;
        }

        .status-enabled {
            background-color: var(--success-light, #d4edda);
            color: var(--success-dark, #155724);
        }

        .status-disabled {
            background-color: var(--warning-light, #fff3cd);
            color: var(--warning-dark, #856404);
        }

        .security-actions {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
        }

        .security-actions .btn {
            font-size: 0.875rem;
        }

        /* 2FA Modal Styles */
        .totp-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
        }

        .totp-modal.show {
            opacity: 1;
            visibility: visible;
        }

        .totp-modal-content {
            background: var(--card-background);
            border-radius: var(--border-radius);
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
        }

        .totp-modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1.5rem;
            padding-bottom: 1rem;
            border-bottom: 1px solid var(--border-color);
        }

        .totp-modal-header h2 {
            margin: 0;
            color: var(--text-primary);
        }

        .close-modal {
            background: none;
            border: none;
            font-size: 1.5rem;
            color: var(--text-secondary);
            cursor: pointer;
            padding: 0;
            width: 2rem;
            height: 2rem;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .qr-code-container {
            text-align: center;
            margin: 1.5rem 0;
        }

        .qr-code-container img {
            max-width: 300px;
            width: 100%;
            height: auto;
            border-radius: var(--border-radius);
        }

        .manual-entry {
            background: var(--background-light);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 1rem;
            margin: 1rem 0;
            text-align: center;
        }

        .manual-entry-key {
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            color: var(--text-primary);
            word-break: break-all;
            background: var(--card-background);
            padding: 0.5rem;
            border-radius: 4px;
            margin-top: 0.5rem;
        }

        .verification-input {
            text-align: center;
            font-size: 1.25rem;
            letter-spacing: 0.25rem;
            font-family: 'Courier New', monospace;
            margin: 1rem 0;
        }

        .backup-codes {
            background: var(--background-light);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 1.5rem;
            margin: 1rem 0;
        }

        .backup-codes-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 0.5rem;
            margin-top: 1rem;
        }

        .backup-code {
            font-family: 'Courier New', monospace;
            background: var(--card-background);
            padding: 0.5rem;
            border-radius: 4px;
            text-align: center;
            font-size: 0.875rem;
        }

        @media (max-width: 768px) {
            .security-header {
                flex-direction: column;
                gap: 1rem;
                align-items: flex-start;
            }

            .security-actions {
                flex-direction: column;
            }

            .totp-modal-content {
                padding: 1.5rem;
            }
        }

        .loading {
            text-align: center;
            padding: 2rem;
            color: var(--text-secondary);
        }

        .loading i {
            font-size: 2rem;
            animation: spin 1s linear infinite;
            margin-bottom: 1rem;
        }

        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }

        /* Logo Upload Styles */
        .logo-section {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .logo-preview-card {
            background: var(--background-color);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .logo-preview {
            display: flex;
            align-items: center;
            gap: 1rem;
        }

        .preview-image {
            width: 80px;
            height: 80px;
            object-fit: contain;
            border-radius: 8px;
            border: 1px solid var(--border-color);
            background: white;
            padding: 8px;
        }

        .logo-info h4 {
            margin: 0 0 0.25rem 0;
            color: var(--text-primary);
            font-size: 1rem;
        }

        .logo-info p {
            margin: 0;
            color: var(--text-secondary);
            font-size: 0.875rem;
        }

        .logo-actions {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
        }

        .logo-actions .btn {
            font-size: 0.875rem;
        }

        /* Upload Progress */
        .upload-progress {
            background: var(--background-color);
            border: 1px solid var(--border-color);
            border-radius: var(--border-radius);
            padding: 1rem;
            margin-top: 1rem;
            display: none;
        }

        .progress-bar {
            width: 100%;
            height: 8px;
            background: var(--border-color);
            border-radius: 4px;
            overflow: hidden;
            margin-top: 0.5rem;
        }

        .progress-fill {
            height: 100%;
            background: var(--primary-color);
            width: 0%;
            transition: width 0.3s ease;
        }

        @media (max-width: 768px) {
            .preferences-container {
                margin: 1rem;
                padding: 1rem;
            }

            .module-grid {
                grid-template-columns: 1fr;
            }

            .preferences-header {
                flex-direction: column;
                text-align: center;
                gap: 0.5rem;
            }

            .preferences-actions {
                flex-direction: column;
                gap: 1rem;
            }

            .logo-preview {
                flex-direction: column;
                text-align: center;
                gap: 0.75rem;
            }

            .logo-actions {
                justify-content: center;
            }
        }
    </style>
</head>
<body>
    <div class="login-container" id="loginContainer" style="display: none;">
        <div class="login-logo">
            <img src="assets/thecache_logo.png" alt="The Cache Logo" class="logo-image">
        </div>
        <form class="login-form" id="loginForm">
            <h2>Login to The Cache</h2>
            <div class="form-group">
                <label for="loginEmail">Email</label>
                <input type="email" id="loginEmail" name="email" required>
            </div>
            <div class="form-group">
                <label for="loginPassword">Password</label>
                <input type="password" id="loginPassword" name="password" required>
            </div>
            <div class="form-actions">
                <button type="submit" class="btn btn-primary" style="width: 100%;">Login</button>
            </div>
        </form>
    </div>

    <div class="app-container" id="appContainer" style="display: none;">
        <div class="preferences-container">
            <div class="preferences-header">
                <div>
                    <i class="fas fa-cog" style="color: var(--primary-color); font-size: 1.5rem;"></i>
                </div>
                <div>
                    <h1>User Preferences</h1>
                    <p style="color: var(--text-secondary); margin: 0;">Customize which modules are visible to you</p>
                </div>
            </div>

            <div id="loadingPreferences" class="loading">
                <i class="fas fa-spinner"></i>
                <p>Loading preferences...</p>
            </div>

            <div id="preferencesContent" style="display: none;">
                <div class="preferences-section">
                    <h2 class="section-title">
                        <i class="fas fa-image"></i>
                        Custom Logo
                    </h2>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                        Upload your own logo to customize your instance. Supported formats: JPG, PNG, GIF, SVG (max 2MB).
                    </p>

                    <div class="logo-section">
                        <div class="logo-preview-card">
                            <div class="logo-preview">
                                <img id="currentLogo" src="/assets/thecache_logo.png" alt="Current Logo" class="preview-image">
                                <div class="logo-info">
                                    <h4 id="logoStatus">Default Logo</h4>
                                    <p id="logoDetails">Using system default logo</p>
                                </div>
                            </div>
                            <div class="logo-actions">
                                <input type="file" id="logoInput" accept="image/*" style="display: none;">
                                <button type="button" class="btn btn-primary" id="uploadLogoBtn">
                                    <i class="fas fa-upload"></i> Upload Logo
                                </button>
                                <button type="button" class="btn btn-danger" id="deleteLogoBtn" style="display: none;">
                                    <i class="fas fa-trash"></i> Remove Logo
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="preferences-section">
                    <h2 class="section-title">
                        <i class="fas fa-shield-alt"></i>
                        Security Settings
                    </h2>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                        Manage your account security settings including two-factor authentication.
                    </p>

                    <div class="security-section">
                        <div class="security-card">
                            <div class="security-header">
                                <div>
                                    <h3><i class="fas fa-mobile-alt"></i> Two-Factor Authentication</h3>
                                    <p>Add an extra layer of security to your account using an authenticator app.</p>
                                </div>
                                <div class="security-status" id="2faStatus">
                                    <span class="status-badge status-disabled">Disabled</span>
                                </div>
                            </div>
                            <div class="security-actions" id="2faActions">
                                <button type="button" class="btn btn-primary" id="setup2FA">
                                    <i class="fas fa-plus"></i> Setup 2FA
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="preferences-section">
                    <h2 class="section-title">
                        <i class="fas fa-th-large"></i>
                        Module Visibility
                    </h2>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                        Toggle which modules you want to see in your navigation and dashboard. Changes are saved automatically.
                    </p>

                    <div class="module-grid" id="moduleGrid">
                        <!-- Module cards will be populated by JavaScript -->
                    </div>
                </div>

                <div class="preferences-actions">
                    <a href="/" class="back-link">
                        <i class="fas fa-arrow-left"></i>
                        Back to Dashboard
                    </a>
                    <div class="save-status" id="saveStatus">
                        <i class="fas fa-check"></i>
                        Preferences saved
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Loading Screen -->
    <div class="loading-screen" id="loadingScreen">
        <div class="loading-spinner">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading preferences...</p>
        </div>
    </div>

    <!-- 2FA Setup Modal -->
    <div class="totp-modal" id="totpModal">
        <div class="totp-modal-content">
            <div class="totp-modal-header">
                <h2 id="modalTitle">Setup Two-Factor Authentication</h2>
                <button type="button" class="close-modal" onclick="close2FAModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div id="modalContent">
                <!-- Content will be dynamically populated -->
            </div>
        </div>
    </div>

    <script src="assets/js/logo-helper.js?v=1.0"></script>
    <script src="assets/js/preferences.js?v=1.0"></script>
    <script>
        // 2FA Management Functions
        class TwoFactorAuth {
            constructor() {
                this.modal = document.getElementById('totpModal');
                this.modalTitle = document.getElementById('modalTitle');
                this.modalContent = document.getElementById('modalContent');
                this.init();
            }

            init() {
                this.load2FAStatus();
                document.getElementById('setup2FA').addEventListener('click', () => this.setup2FA());
            }

            async load2FAStatus() {
                try {
                    const response = await fetch('/api.php?endpoint=2fa-status', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': window.csrfToken
                        }
                    });
                    
                    const data = await response.json();
                    if (data.status) {
                        this.update2FAStatus(data.status);
                    }
                } catch (error) {
                    console.error('Failed to load 2FA status:', error);
                }
            }

            update2FAStatus(status) {
                const statusElement = document.getElementById('2faStatus');
                const actionsElement = document.getElementById('2faActions');
                
                if (status.enabled) {
                    statusElement.innerHTML = '<span class="status-badge status-enabled">Enabled</span>';
                    actionsElement.innerHTML = `
                        <button type="button" class="btn btn-danger" onclick="twoFA.disable2FA()">
                            <i class="fas fa-times"></i> Disable 2FA
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="twoFA.show2FAInfo()">
                            <i class="fas fa-info-circle"></i> View Info
                        </button>
                    `;
                } else {
                    statusElement.innerHTML = '<span class="status-badge status-disabled">Disabled</span>';
                    actionsElement.innerHTML = `
                        <button type="button" class="btn btn-primary" id="setup2FA" onclick="twoFA.setup2FA()">
                            <i class="fas fa-plus"></i> Setup 2FA
                        </button>
                    `;
                }
            }

            async setup2FA() {
                try {
                    const response = await fetch('/api.php?endpoint=2fa-setup', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': window.csrfToken
                        }
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        this.showSetupModal(data);
                    } else {
                        alert('Failed to setup 2FA: ' + (data.error || 'Unknown error'));
                    }
                } catch (error) {
                    console.error('Failed to setup 2FA:', error);
                    alert('Failed to setup 2FA. Please try again.');
                }
            }

            showSetupModal(data) {
                this.modalTitle.textContent = 'Setup Two-Factor Authentication';
                this.modalContent.innerHTML = `
                    <div class="setup-step">
                        <p><strong>Step 1:</strong> Install an authenticator app on your phone:</p>
                        <ul style="margin: 1rem 0; color: var(--text-secondary);">
                            <li>Google Authenticator</li>
                            <li>Authy</li>
                            <li>Microsoft Authenticator</li>
                            <li>Any TOTP-compatible app</li>
                        </ul>
                    </div>

                    <div class="setup-step">
                        <p><strong>Step 2:</strong> Scan this QR code with your authenticator app:</p>
                        <div class="qr-code-container">
                            <img src="${data.qr_code}" alt="2FA QR Code" />
                        </div>
                    </div>

                    <div class="setup-step">
                        <p><strong>Alternative:</strong> Enter this key manually:</p>
                        <div class="manual-entry">
                            <small>Manual Entry Key:</small>
                            <div class="manual-entry-key">${data.manual_entry_key}</div>
                        </div>
                    </div>

                    <div class="setup-step">
                        <p><strong>Step 3:</strong> Enter the 6-digit code from your app:</p>
                        <input type="text" 
                               class="form-control verification-input" 
                               id="totpVerification" 
                               placeholder="000000" 
                               maxlength="6" 
                               pattern="[0-9]{6}"
                               autocomplete="off">
                    </div>

                    <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-primary" onclick="twoFA.verifySetup()">
                            <i class="fas fa-check"></i> Verify & Enable
                        </button>
                        <button type="button" class="btn btn-secondary" onclick="twoFA.close2FAModal()">
                            Cancel
                        </button>
                    </div>
                `;
                this.modal.classList.add('show');
            }

            async verifySetup() {
                const code = document.getElementById('totpVerification').value;
                if (!code || code.length !== 6) {
                    alert('Please enter a valid 6-digit code');
                    return;
                }

                try {
                    const response = await fetch('/api.php?endpoint=2fa-enable', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': window.csrfToken
                        },
                        body: JSON.stringify({ totp_code: code })
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        this.showBackupCodes(data.backup_codes);
                    } else {
                        alert('Verification failed: ' + (data.error || 'Invalid code'));
                    }
                } catch (error) {
                    console.error('Failed to verify 2FA:', error);
                    alert('Verification failed. Please try again.');
                }
            }

            showBackupCodes(backupCodes) {
                this.modalTitle.textContent = '2FA Enabled Successfully!';
                this.modalContent.innerHTML = `
                    <div style="text-align: center; margin-bottom: 1.5rem;">
                        <i class="fas fa-check-circle" style="color: var(--success-color, #28a745); font-size: 3rem;"></i>
                        <h3 style="margin: 1rem 0; color: var(--text-primary);">Two-Factor Authentication Enabled</h3>
                    </div>

                    <div class="backup-codes">
                        <h4><i class="fas fa-key"></i> Backup Recovery Codes</h4>
                        <p style="color: var(--text-secondary); margin-bottom: 1rem;">
                            Save these backup codes in a safe place. You can use them to access your account if you lose your authenticator device.
                        </p>
                        <div class="backup-codes-grid">
                            ${backupCodes.map(code => `<div class="backup-code">${code}</div>`).join('')}
                        </div>
                        <div style="margin-top: 1rem; text-align: center;">
                            <button type="button" class="btn btn-secondary" onclick="twoFA.downloadBackupCodes('${backupCodes.join('\\n')}')">
                                <i class="fas fa-download"></i> Download Codes
                            </button>
                        </div>
                    </div>

                    <div style="background: var(--warning-light, #fff3cd); border: 1px solid var(--warning-color, #ffc107); border-radius: var(--border-radius); padding: 1rem; margin: 1rem 0;">
                        <p style="margin: 0; color: var(--warning-dark, #856404);">
                            <i class="fas fa-exclamation-triangle"></i>
                            <strong>Important:</strong> Each backup code can only be used once. Make sure to store them securely.
                        </p>
                    </div>

                    <div style="text-align: center; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-primary" onclick="twoFA.close2FAModal(); twoFA.load2FAStatus();">
                            <i class="fas fa-check"></i> Done
                        </button>
                    </div>
                `;
            }

            downloadBackupCodes(codes) {
                const blob = new Blob([`2FA Backup Codes\\n\\nThese are your backup codes for two-factor authentication.\\nSave them in a secure location.\\n\\n${codes}`], 
                    { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = '2fa-backup-codes.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }

            async disable2FA() {
                const password = prompt('Enter your password to disable 2FA:');
                if (!password) return;

                try {
                    const response = await fetch('/api.php?endpoint=2fa-disable', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-Token': window.csrfToken
                        },
                        body: JSON.stringify({ password })
                    });
                    
                    const data = await response.json();
                    if (data.success) {
                        alert('2FA has been disabled successfully.');
                        this.load2FAStatus();
                    } else {
                        alert('Failed to disable 2FA: ' + (data.error || 'Unknown error'));
                    }
                } catch (error) {
                    console.error('Failed to disable 2FA:', error);
                    alert('Failed to disable 2FA. Please try again.');
                }
            }

            show2FAInfo() {
                this.modalTitle.textContent = '2FA Information';
                this.modalContent.innerHTML = `
                    <div style="text-align: center;">
                        <i class="fas fa-shield-alt" style="color: var(--success-color, #28a745); font-size: 3rem; margin-bottom: 1rem;"></i>
                        <h3>Two-Factor Authentication is Active</h3>
                        <p style="color: var(--text-secondary);">Your account is protected with 2FA.</p>
                    </div>
                    <div style="text-align: center; margin-top: 1.5rem;">
                        <button type="button" class="btn btn-secondary" onclick="twoFA.close2FAModal()">
                            Close
                        </button>
                    </div>
                `;
                this.modal.classList.add('show');
            }

            close2FAModal() {
                this.modal.classList.remove('show');
            }
        }

        // Initialize 2FA when page loads
        let twoFA;
        document.addEventListener('DOMContentLoaded', () => {
            // Wait for the existing preferences.js to load first
            setTimeout(() => {
                twoFA = new TwoFactorAuth();
            }, 500);
        });

        // Global function for modal closing
        function close2FAModal() {
            if (twoFA) twoFA.close2FAModal();
        }
    </script>
</body>
</html>
