<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Load environment variables
require_once __DIR__ . '/env_loader.php';

// Database configuration from environment variables
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'kanban_board2');
define('DB_USER', getenv('DB_USER') ?: 'diamonddave');
define('DB_PASS', getenv('DB_PASS') ?: '');

function getConnection() {
    try {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME, DB_USER, DB_PASS);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
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

    // Run migrations for existing tables
    runMigrations($pdo);

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

    insertDefaultData($pdo);
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
        ['Admin User', 'admin@example.com', password_hash('admin123', PASSWORD_DEFAULT), true],
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
        // Ignore errors if columns already exist
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

function sendResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit;
}

function getRequestBody() {
    return json_decode(file_get_contents('php://input'), true);
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
        sendResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
    }
}

function createNotification($pdo, $userId, $taskId, $message, $type) {
    $stmt = $pdo->prepare("INSERT INTO notifications (user_id, task_id, message, type) VALUES (?, ?, ?, ?)");
    $stmt->execute([$userId, $taskId, $message, $type]);
    return $pdo->lastInsertId();
}
?>