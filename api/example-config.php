<?php
date_default_timezone_set('America/New_York');
require_once __DIR__ . '/env_loader.php';


ini_set('session.cookie_httponly', 1);
ini_set('session.cookie_secure', 1); // Secure cookies for HTTPS
ini_set('session.use_strict_mode', 1);
ini_set('session.cookie_samesite', 'Strict'); // Strict for better security
ini_set('session.gc_maxlifetime', 3600); // 1 hour session timeout

header('Content-Type: application/json');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src \'self\' \'unsafe-inline\' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; img-src \'self\' data: https:; font-src \'self\' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; connect-src \'self\'; frame-ancestors \'none\'; base-uri \'self\'; form-action \'self\';');

define('DB_HOST', 'localhost');
define('DB_NAME', 'kanban_board2');
define('DB_USER', 'YOUR_USERNAME');
define('DB_PASS', 'YOUR_PASSWORD');

// Get CORS origin from environment variable
$corsOrigin = getenv('CORS_ORIGIN');
if (!$corsOrigin) {
    error_log('WARNING: CORS_ORIGIN not set in environment, no CORS headers will be sent');
    $allowedOrigins = ['https://YOUR_DOMAIN.com'];
} else {
    $allowedOrigins = [$corsOrigin];
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // No fallback - reject unauthorized origins
    if (!empty($origin)) {
        error_log("Unauthorized CORS origin attempted: " . $origin);
    }
}

header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-CSRF-Token');
header('Access-Control-Allow-Credentials: true');

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/env_loader.php';
require_once __DIR__ . '/../vendor/autoload.php';

// Import 2FA libraries
use OTPHP\TOTP;
use Endroid\QrCode\QrCode;
use Endroid\QrCode\Writer\PngWriter;

/**
 * Convert UTC datetime to EST timezone
 */
function convertToEST($utcDateTime) {
    $date = new DateTime($utcDateTime, new DateTimeZone('UTC'));
    $date->setTimezone(new DateTimeZone('America/New_York'));
    return $date;
}

/**
 * Format datetime in EST timezone
 */
function formatDateTimeEST($utcDateTime, $format = 'Y-m-d H:i:s') {
    $estDate = convertToEST($utcDateTime);
    return $estDate->format($format);
}

/**
 * Get current EST time
 */
function getCurrentESTTime() {
    $now = new DateTime('now', new DateTimeZone('America/New_York'));
    return $now->format('Y-m-d H:i:s');
}


function getConnection() {
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        
        // Set MySQL timezone to EST
        try {
            $pdo->exec("SET time_zone = '-05:00'");
        } catch (Exception $e) {
            // If setting timezone fails, try alternative method
            try {
                $pdo->exec("SET time_zone = 'America/New_York'");
            } catch (Exception $e2) {
                // Log the issue but don't fail the connection
                error_log("Warning: Could not set MySQL timezone: " . $e2->getMessage());
            }
        }
        
        // Always ensure user_preferences table exists
        ensureUserPreferencesTable($pdo);
        
        return $pdo;
    } catch(PDOException $e) {
        try {
            $pdo = new PDO("mysql:host=" . DB_HOST, DB_USER, DB_PASS);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $pdo->exec("CREATE DATABASE IF NOT EXISTS " . DB_NAME);
            $pdo->exec("USE " . DB_NAME);
            
            createTables($pdo);
            
            return $pdo;
        } catch(PDOException $e) {
            die(json_encode(['error' => 'Connection failed: ' . $e->getMessage()]));
        }
    }
}

function createTables($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS boards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        color VARCHAR(7) DEFAULT '#3498db',
        icon VARCHAR(100) DEFAULT 'fas fa-tasks',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        is_admin BOOLEAN DEFAULT FALSE,
        is_active BOOLEAN DEFAULT TRUE,
        last_login TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS stages (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        color VARCHAR(7) DEFAULT '#3498db',
        board_id INT NOT NULL,
        position INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS tasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        stage_id INT,
        board_id INT NOT NULL,
        user_id INT,
        client_id INT,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        due_date DATE,
        due_time TIME,
        card_color VARCHAR(7) DEFAULT '#1a202c',
        is_completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP NULL,
        position INT DEFAULT 0,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE SET NULL,
        FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )");

    runMigrations($pdo);
    
    runCrmMigrations($pdo);

    $pdo->exec("CREATE TABLE IF NOT EXISTS attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_size INT,
        mime_type VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS checklist_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT,
        text VARCHAR(500) NOT NULL,
        is_completed BOOLEAN DEFAULT FALSE,
        position INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        session_token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX (session_token),
        INDEX (expires_at)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS user_preferences (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        module_name VARCHAR(50) NOT NULL,
        is_enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_module (user_id, module_name)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS user_logos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_name VARCHAR(255) NOT NULL,
        file_size INT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    insertDefaultData($pdo);
}

function ensureUserPreferencesTable($pdo) {
    try {
        // Check if user_preferences table exists
        $stmt = $pdo->query("SHOW TABLES LIKE 'user_preferences'");
        if ($stmt->rowCount() == 0) {
            // Create the user_preferences table if it doesn't exist
            $pdo->exec("CREATE TABLE user_preferences (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                module_name VARCHAR(50) NOT NULL,
                is_enabled BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_module (user_id, module_name)
            )");
            
            error_log("user_preferences table created successfully");
            
            // Create default preferences for all existing users
            $stmt = $pdo->query("SELECT id FROM users");
            $users = $stmt->fetchAll();
            foreach ($users as $user) {
                createDefaultUserPreferences($pdo, $user['id']);
            }
            
            if (count($users) > 0) {
                error_log("Created default preferences for " . count($users) . " existing users");
            }
        }
        
        // Also ensure the helper functions are available by checking if the table has the right structure
        $stmt = $pdo->query("DESCRIBE user_preferences");
        $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
        if (!in_array('module_name', $columns)) {
            error_log("user_preferences table exists but has wrong structure, attempting to fix...");
            // Table exists but may have wrong structure, try to add missing columns
            $pdo->exec("ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS module_name VARCHAR(50) NOT NULL");
            $pdo->exec("ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT TRUE");
        }
        
    } catch (Exception $e) {
        // Log error but don't fail the connection
        error_log("Failed to ensure user_preferences table: " . $e->getMessage());
    }
}

function insertDefaultData($pdo) {
    $stmt = $pdo->prepare("INSERT IGNORE INTO companies (id, name) VALUES (1, 'My Company')");
    $stmt->execute();

    $stmt = $pdo->prepare("INSERT IGNORE INTO boards (id, name, description) VALUES (1, 'Default Board', 'Your main Kanban board')");
    $stmt->execute();

    $defaultStages = [
        ['To Do', '#e74c3c', 1, 1],
        ['In Progress', '#f39c12', 2, 1],
        ['Review', '#3498db', 3, 1],
        ['Done', '#2ecc71', 4, 1]
    ];

    foreach ($defaultStages as $stage) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO stages (name, color, position, board_id) VALUES (?, ?, ?, ?)");
        $stmt->execute($stage);
    }

    $defaultUsers = [
        ['John Doe', 'john@example.com', password_hash('user123', PASSWORD_DEFAULT), false],
        ['Jane Smith', 'jane@example.com', password_hash('user123', PASSWORD_DEFAULT), false]
    ];

    foreach ($defaultUsers as $user) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)");
        $stmt->execute($user);
    }

    $defaultClients = [
        ['Acme Corp', 'contact@acme.com'],
        ['Tech Solutions', 'hello@techsolutions.com']
    ];

    foreach ($defaultClients as $client) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO clients (name, email) VALUES (?, ?)");
        $stmt->execute($client);
    }
    
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM tasks LIKE 'is_completed'");
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE tasks ADD COLUMN is_completed BOOLEAN DEFAULT FALSE");
        }
        
        $stmt = $pdo->query("SHOW COLUMNS FROM tasks LIKE 'completed_at'");
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP NULL");
        }
        
        $stmt = $pdo->query("SHOW COLUMNS FROM tasks LIKE 'due_time'");
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE tasks ADD COLUMN due_time TIME");
        }
        
        $stmt = $pdo->query("SHOW COLUMNS FROM tasks LIKE 'card_color'");
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE tasks ADD COLUMN card_color VARCHAR(7) DEFAULT '#1a202c'");
        }
    } catch (Exception $e) {
    }
}

function runMigrations($pdo) {
    try {
        $stmt = $pdo->query("SHOW TABLES LIKE 'tasks'");
        if ($stmt->rowCount() > 0) {
            $stmt = $pdo->query("SHOW COLUMNS FROM tasks LIKE 'is_completed'");
            if ($stmt->rowCount() == 0) {
                $pdo->exec("ALTER TABLE tasks ADD COLUMN is_completed BOOLEAN DEFAULT FALSE");
            }
            
            $stmt = $pdo->query("SHOW COLUMNS FROM tasks LIKE 'completed_at'");
            if ($stmt->rowCount() == 0) {
                $pdo->exec("ALTER TABLE tasks ADD COLUMN completed_at TIMESTAMP NULL");
            }
            
            $stmt = $pdo->query("SHOW COLUMNS FROM tasks LIKE 'due_time'");
            if ($stmt->rowCount() == 0) {
                $pdo->exec("ALTER TABLE tasks ADD COLUMN due_time TIME");
            }
            
            $stmt = $pdo->query("SHOW COLUMNS FROM tasks LIKE 'card_color'");
            if ($stmt->rowCount() == 0) {
                $pdo->exec("ALTER TABLE tasks ADD COLUMN card_color VARCHAR(7) DEFAULT '#1a202c'");
            }
        }
    } catch (Exception $e) {
        error_log("Migration error: " . $e->getMessage());
    }
}

function runCrmMigrations($pdo) {
    try {
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_number VARCHAR(50) NULL");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_name VARCHAR(255) NULL");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50) NULL");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS alternate_phone VARCHAR(50) NULL");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS url VARCHAR(255) NULL");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_1 VARCHAR(255) NULL");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS address_2 VARCHAR(255) NULL");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS city VARCHAR(100) NULL");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS state VARCHAR(50) NULL");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20) NULL");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'United States'");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS classification VARCHAR(100) NULL");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS status ENUM('active', 'inactive', 'lead', 'prospect') DEFAULT 'active'");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_type ENUM('customer', 'lead', 'prospect', 'vendor') DEFAULT 'lead'");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS company_category VARCHAR(100) DEFAULT 'Standard'");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS account_manager_id INT NULL");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS created_by INT NULL");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_activity TIMESTAMP NULL");
        $pdo->exec("ALTER TABLE clients ADD COLUMN IF NOT EXISTS notes TEXT NULL");
        
        $pdo->exec("ALTER TABLE clients ADD CONSTRAINT IF NOT EXISTS fk_clients_account_manager 
            FOREIGN KEY (account_manager_id) REFERENCES users(id) ON DELETE SET NULL");
        $pdo->exec("ALTER TABLE clients ADD CONSTRAINT IF NOT EXISTS fk_clients_created_by 
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL");
    } catch (Exception $e) {
    }
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS client_contacts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NULL,
        phone VARCHAR(50) NULL,
        position VARCHAR(100) NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        is_billing_contact BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS client_activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        user_id INT NOT NULL,
        activity_type ENUM('note', 'call', 'email', 'meeting', 'task', 'quote', 'invoice') NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS client_attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        filename VARCHAR(255) NOT NULL,
        filepath VARCHAR(500) NOT NULL,
        filesize INT NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS client_todos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        due_date DATE NULL,
        due_time TIME NULL,
        priority ENUM('low', 'medium', 'high') DEFAULT 'medium',
        is_completed BOOLEAN DEFAULT FALSE,
        completed_at TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS client_groups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS opportunities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        status ENUM('new', 'qualified', 'proposal', 'negotiation', 'won', 'lost') DEFAULT 'new',
        revenue DECIMAL(15,2) NULL,
        probability INT DEFAULT 0,
        close_date DATE NULL,
        owner_id INT NULL,
        created_by INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS opportunity_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        opportunity_id INT NOT NULL,
        user_id INT NOT NULL,
        note_text TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS opportunity_attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        opportunity_id INT NOT NULL,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        filename VARCHAR(255) NOT NULL,
        filepath VARCHAR(500) NOT NULL,
        filesize INT NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (opportunity_id) REFERENCES opportunities(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS client_group_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        group_id INT NOT NULL,
        client_id INT NOT NULL,
        added_by INT NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_group_client (group_id, client_id),
        FOREIGN KEY (group_id) REFERENCES client_groups(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE CASCADE
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT NOT NULL,
        user_id INT NOT NULL,
        client_id INT NULL,
        task_id INT NULL,
        tags TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL,
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
        INDEX idx_notes_user (user_id),
        INDEX idx_notes_client (client_id),
        INDEX idx_notes_task (task_id),
        INDEX idx_notes_tags (tags),
        FULLTEXT idx_notes_content (title, content)
    )");

    $pdo->exec("CREATE TABLE IF NOT EXISTS note_links (
        id INT AUTO_INCREMENT PRIMARY KEY,
        source_note_id INT NOT NULL,
        target_note_id INT NOT NULL,
        link_type ENUM('bidirectional', 'unidirectional') DEFAULT 'bidirectional',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_note_link (source_note_id, target_note_id),
        FOREIGN KEY (source_note_id) REFERENCES notes(id) ON DELETE CASCADE,
        FOREIGN KEY (target_note_id) REFERENCES notes(id) ON DELETE CASCADE
    )");

    try {
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_clients_company_type ON clients(company_type)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_clients_account_manager ON clients(account_manager_id)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_client_activities_client ON client_activities(client_id)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_client_activities_date ON client_activities(activity_date)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_client_todos_client ON client_todos(client_id)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_client_todos_user ON client_todos(user_id)");
        $pdo->exec("CREATE INDEX IF NOT EXISTS idx_client_contacts_client ON client_contacts(client_id)");
    } catch (Exception $e) {
    }
    
    createTbrTables($pdo);
}

function createTbrTables($pdo) {
    $pdo->exec("CREATE TABLE IF NOT EXISTS tbr_meetings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        meeting_date DATE NOT NULL,
        meeting_time TIME DEFAULT NULL,
        meeting_type VARCHAR(100) DEFAULT 'Business Review',
        primary_contact VARCHAR(255),
        account_manager_id INT,
        status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
        notes TEXT,
        recommendations TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        FOREIGN KEY (account_manager_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    )");
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS tbr_attendees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        meeting_id INT NOT NULL,
        user_id INT,
        name VARCHAR(255),
        email VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (meeting_id) REFERENCES tbr_meetings(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    )");
    
    $pdo->exec("CREATE TABLE IF NOT EXISTS tbr_attachments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        meeting_id INT NOT NULL,
        filename VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_size INT,
        mime_type VARCHAR(100),
        uploaded_by INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (meeting_id) REFERENCES tbr_meetings(id) ON DELETE CASCADE,
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
    )");
}

function sendResponse($data, $status = 200) {
    http_response_code($status);
    
    // Allow specific user-friendly error messages to pass through
    $allowedErrorMessages = [
        'Invalid verification code',
        'Invalid backup code',
        'Too many 2FA verification attempts. Please wait 15 minutes before trying again.',
        'Too many backup code attempts. Please wait 15 minutes before trying again.',
        '2FA not properly configured',
        'Invalid credentials',
        'Email already registered',
        'Password requirements not met',
        'CSRF token required',
        'Invalid CSRF token',
        'Authentication required',
        'Admin access required',
        'Method not allowed',
        'Endpoint not found',
        'Logo file is required',
        'Invalid file type. Allowed types: jpg, jpeg, png, gif, svg',
        'File too large. Maximum size: 2MB',
        'Invalid file format detected',
        'Failed to save file',
        'No active logo found'
    ];
    
    if (isset($data['error']) && !isDevelopment()) {
        // Only hide detailed errors that aren't user-friendly
        if (!in_array($data['error'], $allowedErrorMessages)) {
            $data['error'] = 'An error occurred. Please try again.';
        }
    }
    
    echo json_encode($data);
    exit;
}

function isDevelopment() {
    return defined('ENVIRONMENT') && ENVIRONMENT === 'development';
}

function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

function validateCSRFToken($token) {
    if (!isset($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
        error_log("CSRF token validation failed for user: " . ($_SESSION['user_id'] ?? 'unknown'));
        sendResponse(['error' => 'Invalid CSRF token'], 403);
    }
    return true;
}

function validateCSRFForStateChanges() {
    // CSRF validation temporarily disabled for debugging
    // TODO: Re-enable after fixing token flow
    return true;
    
    // Require CSRF token for all state-changing operations
    if ($_SERVER['REQUEST_METHOD'] !== 'GET' && $_SERVER['REQUEST_METHOD'] !== 'OPTIONS') {
        $token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_REQUEST['csrf_token'] ?? '';
        if (empty($token)) {
            error_log("Missing CSRF token for " . $_SERVER['REQUEST_METHOD'] . " request to " . $_SERVER['REQUEST_URI'] . " - Headers: " . json_encode(getallheaders()));
            sendResponse(['error' => 'CSRF token required'], 403);
        }
        validateCSRFToken($token);
    }
}

function getRequestBody() {
    error_log('DEBUG: getRequestBody - Starting');
    $input = file_get_contents('php://input');
    error_log('DEBUG: getRequestBody - Raw input: ' . $input);
    
    if ($input === false) {
        error_log('DEBUG: getRequestBody - Failed to read input');
        return null;
    }
    
    $data = json_decode($input, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log('DEBUG: getRequestBody - JSON decode error: ' . json_last_error_msg());
        return null;
    }
    
    error_log('DEBUG: getRequestBody - Decoded data: ' . print_r($data, true));
    return $data;
}

function validateRequired($data, $fields) {
    $missing = [];
    foreach ($fields as $field) {
        if (!isset($data[$field])) {
            $missing[] = $field;
        } elseif (is_array($data[$field]) && empty($data[$field])) {
            $missing[] = $field;
        } elseif (!is_array($data[$field]) && empty(trim($data[$field]))) {
            $missing[] = $field;
        }
    }
    if (!empty($missing)) {
        error_log('VALIDATION_ERROR: Missing fields: ' . implode(', ', $missing));
        sendResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
    }
}

function validateAndSanitizeTaskData($data) {
    $errors = [];
    
    // Validate title
    if (isset($data['title'])) {
        if (!validateString($data['title'], 1, 255)) {
            $errors[] = 'Title must be between 1 and 255 characters';
        }
        $data['title'] = sanitizeInput($data['title']);
    }
    
    // Validate description
    if (isset($data['description'])) {
        if (!validateString($data['description'], 0, 10000, true)) {
            $errors[] = 'Description must be less than 10000 characters';
        }
        $data['description'] = sanitizeInput($data['description']);
    }
    
    // Validate IDs
    if (isset($data['stage_id']) && !validateInteger($data['stage_id'], 1)) {
        $errors[] = 'Invalid stage ID';
    }
    
    if (isset($data['user_id']) && $data['user_id'] !== null && !validateInteger($data['user_id'], 1)) {
        $errors[] = 'Invalid user ID';
    }
    
    if (isset($data['client_id']) && $data['client_id'] !== null && !validateInteger($data['client_id'], 1)) {
        $errors[] = 'Invalid client ID';
    }
    
    // Validate priority
    if (isset($data['priority'])) {
        $validPriorities = ['low', 'medium', 'high'];
        if (!in_array($data['priority'], $validPriorities)) {
            $errors[] = 'Invalid priority value';
        }
    }
    
    // Validate dates
    if (isset($data['due_date']) && !empty($data['due_date'])) {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $data['due_date'])) {
            $errors[] = 'Invalid due date format (YYYY-MM-DD)';
        }
    }
    
    if (!empty($errors)) {
        error_log('DATA_VALIDATION_FAILED: ' . implode('; ', $errors));
        sendResponse(['error' => 'Validation failed: ' . implode(', ', $errors)], 400);
    }
    
    return $data;
}

function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    
    if (is_null($input)) {
        return null;
    }
    
    // Remove potential XSS vectors
    $input = trim($input);
    $input = htmlspecialchars($input, ENT_QUOTES | ENT_HTML5, 'UTF-8');
    
    // Remove dangerous script patterns
    $patterns = [
        '/javascript:/i',
        '/vbscript:/i',
        '/onload\s*=/i',
        '/onerror\s*=/i',
        '/onclick\s*=/i',
        '/<script[^>]*>/i',
        '/<\/script>/i'
    ];
    
    foreach ($patterns as $pattern) {
        $input = preg_replace($pattern, '', $input);
    }
    
    return $input;
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

function validateInteger($value, $min = null, $max = null) {
    if (!is_numeric($value)) {
        return false;
    }
    
    $int = (int)$value;
    if ($min !== null && $int < $min) {
        return false;
    }
    if ($max !== null && $int > $max) {
        return false;
    }
    
    return true;
}

function validateString($string, $minLength = 0, $maxLength = 10000, $allowEmpty = false) {
    if (!$allowEmpty && empty($string)) {
        return false;
    }
    
    $length = strlen($string);
    return $length >= $minLength && $length <= $maxLength;
}

function sanitizeOutput($output) {
    if (is_array($output)) {
        return array_map('sanitizeOutput', $output);
    }
    return htmlspecialchars($output, ENT_QUOTES, 'UTF-8');
}

function createNotification($pdo, $userId, $taskId, $message, $type) {
    $stmt = $pdo->prepare("INSERT INTO notifications (user_id, task_id, message, type) VALUES (?, ?, ?, ?)");
    $stmt->execute([$userId, $taskId, $message, $type]);
    return $pdo->lastInsertId();
}

function checkRateLimit($pdo, $userId, $action, $limit = 5, $window = 300) {
    // Ensure rate_limits table exists
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS rate_limits (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT,
            action VARCHAR(50) NOT NULL,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (user_id, action, created_at),
            INDEX (ip_address, created_at)
        )");
    } catch (Exception $e) {
        error_log("Failed to create rate_limits table: " . $e->getMessage());
    }
    
    $ipAddress = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
    
    // Check user-based rate limit
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM rate_limits 
        WHERE user_id = ? AND action = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)
    ");
    $stmt->execute([$userId, $action, $window]);
    $userCount = $stmt->fetch()['count'];
    
    // Check IP-based rate limit (more restrictive)
    $stmt = $pdo->prepare("
        SELECT COUNT(*) as count 
        FROM rate_limits 
        WHERE ip_address = ? AND action = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)
    ");
    $stmt->execute([$ipAddress, $action, $window]);
    $ipCount = $stmt->fetch()['count'];
    
    if ($userCount >= $limit || $ipCount >= ($limit * 2)) {
        error_log("Rate limit exceeded for user $userId, IP $ipAddress, action $action");
        return false;
    }
    
    // Log the action
    $stmt = $pdo->prepare("INSERT INTO rate_limits (user_id, action, ip_address, user_agent) VALUES (?, ?, ?, ?)");
    $stmt->execute([$userId, $action, $ipAddress, $userAgent]);
    
    return true;
}

function createSecurityLog($pdo, $event, $details = '', $severity = 'INFO') {
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS security_logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            event VARCHAR(100) NOT NULL,
            user_id INT NULL,
            ip_address VARCHAR(45),
            user_agent TEXT,
            details TEXT,
            severity ENUM('INFO', 'WARNING', 'CRITICAL') DEFAULT 'INFO',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX (event, created_at),
            INDEX (user_id, created_at),
            INDEX (ip_address, created_at)
        )");
        
        $stmt = $pdo->prepare("
            INSERT INTO security_logs (event, user_id, ip_address, user_agent, details, severity) 
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $event,
            $_SESSION['user_id'] ?? null,
            $_SERVER['REMOTE_ADDR'] ?? 'unknown',
            $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
            $details,
            $severity
        ]);
    } catch (Exception $e) {
        error_log("Failed to create security log: " . $e->getMessage());
    }
}

function checkIPRateLimit($pdo, $ipAddress, $action, $limit, $window) {
    try {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) as count 
            FROM rate_limits 
            WHERE ip_address = ? AND action = ? AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)
        ");
        $stmt->execute([$ipAddress, $action, $window]);
        $count = $stmt->fetch()['count'];
        
        if ($count >= $limit) {
            return false;
        }
        
        $stmt = $pdo->prepare("INSERT INTO rate_limits (ip_address, action) VALUES (?, ?)");
        $stmt->execute([$ipAddress, $action]);
        
        return true;
    } catch (Exception $e) {
        error_log("Rate limit check failed: " . $e->getMessage());
        return true; // Fail open
    }
}

function createDefaultUserPreferences($pdo, $userId) {
    $defaultModules = ['crm', 'calendar', 'notes', 'kanban', 'dashboard'];
    
    foreach ($defaultModules as $module) {
        $stmt = $pdo->prepare("INSERT IGNORE INTO user_preferences (user_id, module_name, is_enabled) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $module, 1]); // Use 1 instead of true for tinyint
    }
}

function getUserPreferences($pdo, $userId) {
    $stmt = $pdo->prepare("SELECT module_name, is_enabled FROM user_preferences WHERE user_id = ?");
    $stmt->execute([$userId]);
    $preferences = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    
    // If no preferences exist, create defaults
    if (empty($preferences)) {
        createDefaultUserPreferences($pdo, $userId);
        $stmt->execute([$userId]);
        $preferences = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
    }
    
    return $preferences;
}

function updateUserPreference($pdo, $userId, $moduleName, $isEnabled) {
    // Convert boolean to integer for tinyint field
    $isEnabledInt = $isEnabled ? 1 : 0;
    
    $stmt = $pdo->prepare("INSERT INTO user_preferences (user_id, module_name, is_enabled) VALUES (?, ?, ?) 
                          ON DUPLICATE KEY UPDATE is_enabled = VALUES(is_enabled), updated_at = CURRENT_TIMESTAMP");
    $stmt->execute([$userId, $moduleName, $isEnabledInt]);
}

// ============================================================================
// 2FA (Two-Factor Authentication) Functions
// ============================================================================

/**
 * Generate a new TOTP secret for a user
 */
function generate2FASecret() {
    $totp = TOTP::create();
    return $totp->getSecret();
}

/**
 * Generate QR code for 2FA setup
 */
function generate2FAQRCode($secret, $userEmail) {
    $appName = getenv('APP_NAME') ?: 'Kanban Board';
    $issuer = getenv('APP_ISSUER') ?: 'Your Company';
    
    $totp = TOTP::create($secret);
    $totp->setLabel($userEmail);
    $totp->setIssuer($issuer);
    
    try {
        // Create QR code builder with proper v6 API
        $qrCode = new QrCode($totp->getProvisioningUri());
        
        $writer = new PngWriter();
        $result = $writer->write($qrCode);
        
        return 'data:image/png;base64,' . base64_encode($result->getString());
    } catch (Exception $e) {
        error_log("QR Code generation error: " . $e->getMessage());
        // Return a fallback - just the URI that can be manually entered
        return $totp->getProvisioningUri();
    }
}

/**
 * Verify TOTP code
 */
function verify2FACode($secret, $code) {
    if (empty($secret) || empty($code)) {
        return false;
    }
    
    $totp = TOTP::create($secret);
    return $totp->verify($code, null, 1); // Allow 1 period (30 seconds) tolerance
}

/**
 * Setup 2FA for a user - generate secret and return QR code
 */
function setup2FA($pdo, $userId, $userEmail) {
    try {
        $secret = generate2FASecret();
        $qrCode = generate2FAQRCode($secret, $userEmail);
        
        // Store the secret temporarily (not activated yet)
        $stmt = $pdo->prepare("
            INSERT INTO user_2fa (user_id, secret_key, is_active) 
            VALUES (?, ?, 0) 
            ON DUPLICATE KEY UPDATE secret_key = VALUES(secret_key), is_active = 0
        ");
        $stmt->execute([$userId, $secret]);
        
        // Mark user as having pending 2FA setup
        $stmt = $pdo->prepare("UPDATE users SET pending_2fa_setup = 1 WHERE id = ?");
        $stmt->execute([$userId]);
        
        createSecurityLog($pdo, '2FA_SETUP_INITIATED', "User ID: $userId", 'INFO', $userId);
        
        return [
            'success' => true,
            'secret' => $secret,
            'qr_code' => $qrCode,
            'manual_entry_key' => chunk_split($secret, 4, ' ')
        ];
        
    } catch (Exception $e) {
        error_log("2FA setup error: " . $e->getMessage());
        return ['success' => false, 'error' => 'Failed to setup 2FA'];
    }
}

/**
 * Enable 2FA for a user after verification
 */
function enable2FA($pdo, $userId, $totpCode) {
    try {
        // Get the pending secret
        $stmt = $pdo->prepare("SELECT secret_key FROM user_2fa WHERE user_id = ? AND is_active = 0");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        
        if (!$result) {
            return ['success' => false, 'error' => '2FA setup not found. Please restart the setup process.'];
        }
        
        $secret = $result['secret_key'];
        
        // Verify the TOTP code
        if (!verify2FACode($secret, $totpCode)) {
            createSecurityLog($pdo, '2FA_ENABLE_FAILED', "Invalid TOTP code for User ID: $userId", 'WARNING', $userId);
            return ['success' => false, 'error' => 'Invalid verification code. Please try again.'];
        }
        
        // Generate backup codes
        $backupCodes = generateBackupCodes();
        
        // Activate 2FA
        $stmt = $pdo->prepare("
            UPDATE user_2fa 
            SET is_active = 1, backup_codes = ?, created_at = CURRENT_TIMESTAMP 
            WHERE user_id = ?
        ");
        $stmt->execute([json_encode($backupCodes), $userId]);
        
        // Update user table
        $stmt = $pdo->prepare("UPDATE users SET has_2fa_enabled = 1, pending_2fa_setup = 0 WHERE id = ?");
        $stmt->execute([$userId]);
        
        createSecurityLog($pdo, '2FA_ENABLED', "User ID: $userId", 'INFO', $userId);
        
        return [
            'success' => true,
            'backup_codes' => $backupCodes,
            'message' => '2FA has been successfully enabled for your account.'
        ];
        
    } catch (Exception $e) {
        error_log("2FA enable error: " . $e->getMessage());
        return ['success' => false, 'error' => 'Failed to enable 2FA'];
    }
}

/**
 * Verify 2FA during login
 */
function verify2FALogin($pdo, $userId, $totpCode) {
    try {
        // Get user's 2FA secret
        $stmt = $pdo->prepare("SELECT secret_key FROM user_2fa WHERE user_id = ? AND is_active = 1");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        
        if (!$result) {
            return ['success' => false, 'error' => '2FA not properly configured'];
        }
        
        $secret = $result['secret_key'];
        
        // Verify TOTP code
        if (verify2FACode($secret, $totpCode)) {
            // Update last used timestamp
            $stmt = $pdo->prepare("UPDATE user_2fa SET last_used_at = CURRENT_TIMESTAMP WHERE user_id = ?");
            $stmt->execute([$userId]);
            
            createSecurityLog($pdo, '2FA_LOGIN_SUCCESS', "User ID: $userId", 'INFO', $userId);
            return ['success' => true];
        } else {
            createSecurityLog($pdo, '2FA_LOGIN_FAILED', "Invalid TOTP for User ID: $userId", 'WARNING', $userId);
            return ['success' => false, 'error' => 'Invalid verification code'];
        }
        
    } catch (Exception $e) {
        error_log("2FA verification error: " . $e->getMessage());
        return ['success' => false, 'error' => 'Verification failed'];
    }
}

/**
 * Disable 2FA for a user
 */
function disable2FA($pdo, $userId, $password) {
    try {
        // Verify user's password first
        $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        $user = $stmt->fetch();
        
        if (!$user || !password_verify($password, $user['password'])) {
            createSecurityLog($pdo, '2FA_DISABLE_FAILED', "Invalid password for User ID: $userId", 'WARNING', $userId);
            return ['success' => false, 'error' => 'Invalid password'];
        }
        
        // Remove 2FA data
        $stmt = $pdo->prepare("DELETE FROM user_2fa WHERE user_id = ?");
        $stmt->execute([$userId]);
        
        // Update user table
        $stmt = $pdo->prepare("UPDATE users SET has_2fa_enabled = 0, pending_2fa_setup = 0 WHERE id = ?");
        $stmt->execute([$userId]);
        
        createSecurityLog($pdo, '2FA_DISABLED', "User ID: $userId", 'INFO', $userId);
        
        return ['success' => true, 'message' => '2FA has been disabled for your account.'];
        
    } catch (Exception $e) {
        error_log("2FA disable error: " . $e->getMessage());
        return ['success' => false, 'error' => 'Failed to disable 2FA'];
    }
}

/**
 * Generate backup codes for 2FA recovery
 */
function generateBackupCodes($count = 8) {
    $codes = [];
    for ($i = 0; $i < $count; $i++) {
        // Generate 8-character alphanumeric codes
        $codes[] = substr(str_shuffle('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'), 0, 8);
    }
    return $codes;
}

/**
 * Verify backup code and use it for recovery
 */
function verifyBackupCode($pdo, $userId, $backupCode) {
    try {
        $stmt = $pdo->prepare("SELECT backup_codes, recovery_count FROM user_2fa WHERE user_id = ? AND is_active = 1");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        
        if (!$result) {
            return ['success' => false, 'error' => '2FA not configured'];
        }
        
        $backupCodes = json_decode($result['backup_codes'], true);
        $recoveryCount = $result['recovery_count'];
        
        // Check if the code exists and remove it
        $codeIndex = array_search(strtoupper($backupCode), $backupCodes);
        if ($codeIndex === false) {
            createSecurityLog($pdo, '2FA_BACKUP_FAILED', "Invalid backup code for User ID: $userId", 'WARNING', $userId);
            return ['success' => false, 'error' => 'Invalid backup code'];
        }
        
        // Remove the used code
        unset($backupCodes[$codeIndex]);
        $backupCodes = array_values($backupCodes); // Re-index array
        
        // Update the database
        $stmt = $pdo->prepare("
            UPDATE user_2fa 
            SET backup_codes = ?, recovery_count = recovery_count + 1, last_used_at = CURRENT_TIMESTAMP 
            WHERE user_id = ?
        ");
        $stmt->execute([json_encode($backupCodes), $userId]);
        
        createSecurityLog($pdo, '2FA_BACKUP_USED', "Backup code used for User ID: $userId, remaining codes: " . count($backupCodes), 'INFO', $userId);
        
        return [
            'success' => true,
            'remaining_codes' => count($backupCodes),
            'message' => 'Backup code accepted. You have ' . count($backupCodes) . ' backup codes remaining.'
        ];
        
    } catch (Exception $e) {
        error_log("Backup code verification error: " . $e->getMessage());
        return ['success' => false, 'error' => 'Verification failed'];
    }
}

/**
 * Get 2FA status for a user
 */
function get2FAStatus($pdo, $userId) {
    try {
        $stmt = $pdo->prepare("
            SELECT u.has_2fa_enabled, u.pending_2fa_setup, 
                   f.created_at, f.last_used_at, f.recovery_count,
                   JSON_LENGTH(f.backup_codes) as backup_codes_count
            FROM users u 
            LEFT JOIN user_2fa f ON u.id = f.user_id 
            WHERE u.id = ?
        ");
        $stmt->execute([$userId]);
        $result = $stmt->fetch();
        
        return [
            'enabled' => (bool)$result['has_2fa_enabled'],
            'pending_setup' => (bool)$result['pending_2fa_setup'],
            'setup_date' => $result['created_at'],
            'last_used' => $result['last_used_at'],
            'recovery_count' => $result['recovery_count'] ?? 0,
            'backup_codes_remaining' => $result['backup_codes_count'] ?? 0
        ];
        
    } catch (Exception $e) {
        error_log("Get 2FA status error: " . $e->getMessage());
        return ['enabled' => false, 'pending_setup' => false];
    }
}

?>