<?php
/**
 * Kanban Board Database Setup Script
 * 
 * This script sets up the database and all required tables for the Kanban Board application.
 * Run this once after uploading the application files to your server.
 * 
 * Configuration is loaded from .env file - make sure to create one with your database credentials.
 */

require_once __DIR__ . '/api/env_loader.php';

$db_host = getenv('DB_HOST') ?: 'localhost';
$db_name = getenv('DB_NAME') ?: 'kanban_board2';
$db_user = getenv('DB_USER') ?: '';
$db_pass = getenv('DB_PASS') ?: '';
$google_api_key = getenv('GOOGLE_API_KEY') ?: '';
$brevo_api_key = getenv('BREVO_API_KEY') ?: '';

error_reporting(E_ALL);
ini_set('display_errors', 1);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kanban Board Setup</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 {
            color: #333;
            text-align: center;
            margin-bottom: 30px;
        }
        .step {
            margin: 20px 0;
            padding: 15px;
            border-left: 4px solid #3498db;
            background: #f8f9fa;
        }
        .success {
            color: #27ae60;
            border-left-color: #27ae60;
            background: #d5f4e6;
        }
        .error {
            color: #e74c3c;
            border-left-color: #e74c3c;
            background: #fdf2f2;
        }
        .warning {
            color: #f39c12;
            border-left-color: #f39c12;
            background: #fdf6e3;
        }
        .config {
            background: #2c3e50;
            color: white;
            padding: 15px;
            border-radius: 5px;
            font-family: monospace;
            margin: 10px 0;
        }
        button {
            background: #3498db;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 16px;
            margin: 10px 5px;
        }
        button:hover {
            background: #2980b9;
        }
        .btn-danger {
            background: #e74c3c;
        }
        .btn-danger:hover {
            background: #c0392b;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Kanban Board Setup</h1>
        
        <?php
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            if (isset($_POST['action'])) {
                if ($_POST['action'] === 'setup') {
                    runDatabaseSetup();
                } elseif ($_POST['action'] === 'check') {
                    checkConfiguration();
                }
            }
        } else {
            showSetupForm();
        }

        function showSetupForm() {
            global $db_host, $db_name, $db_user, $db_pass;
            ?>
            <div class="step">
                <h3>📋 Pre-Setup Instructions</h3>
                <p><strong>Before running setup, please:</strong></p>
                <ol>
                    <li>Create a MySQL database named <code><?php echo $db_name; ?></code></li>
                    <li>Create a MySQL user with full permissions to this database</li>
                    <li>Create a <code>.env</code> file in the root directory with your database credentials:</li>
                </ol>
                
                <div class="config">
# Database Configuration<br>
DB_HOST=<?php echo $db_host; ?><br>
DB_NAME=<?php echo $db_name; ?><br>
DB_USER=your_mysql_username<br>
DB_PASS=your_mysql_password<br>
<br>
# Google API Configuration<br>
GOOGLE_API_KEY=your_google_api_key_here<br>
<br>
# Brevo Email Notifications<br>
BREVO_API_KEY=your_brevo_api_key_here<br>
<br>
# Optional: SMTP Email Configuration<br>
SMTP_HOST=smtp.gmail.com<br>
SMTP_PORT=587<br>
SMTP_USER=your_email@gmail.com<br>
SMTP_PASS=your_app_password
                </div>
                
                <p><strong>Current Configuration:</strong></p>
                <div class="config">
DB_HOST = <?php echo $db_host ? $db_host : '<span style="color: #e74c3c;">Not set</span>'; ?><br>
DB_NAME = <?php echo $db_name ? $db_name : '<span style="color: #e74c3c;">Not set</span>'; ?><br>
DB_USER = <?php echo $db_user ? $db_user : '<span style="color: #e74c3c;">Not set</span>'; ?><br>
DB_PASS = <?php echo $db_pass ? '***' : '<span style="color: #e74c3c;">Not set</span>'; ?><br>
GOOGLE_API_KEY = <?php echo $google_api_key ? '***' : '<span style="color: #f39c12;">Optional - Not set</span>'; ?><br>
BREVO_API_KEY = <?php echo $brevo_api_key ? '***' : '<span style="color: #f39c12;">Optional - Not set</span>'; ?>
                </div>
            </div>

            <div class="step">
                <h3>📧 API Key Setup Instructions</h3>
                <p><strong>Google API Key (Optional - for address autocomplete):</strong></p>
                <ol>
                    <li>Go to <a href="https://console.cloud.google.com/" target="_blank">Google Cloud Console</a></li>
                    <li>Create a project or select existing one</li>
                    <li>Enable these APIs: Places API, Geocoding API, Maps JavaScript API</li>
                    <li>Create credentials (API Key) and copy it to your .env file</li>
                </ol>
                
                <p><strong>Brevo API Key (Optional - for email notifications):</strong></p>
                <ol>
                    <li>Sign up/login to <a href="https://www.brevo.com/" target="_blank">Brevo</a></li>
                    <li>Go to Settings → API Keys</li>
                    <li>Create a new API key with "SMTP" permissions</li>
                    <li>Copy your API key to your .env file</li>
                </ol>
                
                <p><em>Both API keys are optional. The application will work without them, but you'll miss out on enhanced features like address autocomplete and email notifications.</em></p>
            </div>

            <div class="step warning">
                <h3>⚠️ Important Notes</h3>
                <ul>
                    <li>This setup will create all necessary database tables</li>
                    <li>If tables already exist, this will not overwrite your data</li>
                    <li>Make sure your database credentials are correct before proceeding</li>
                    <li><strong>Delete this setup.php file after successful installation for security</strong></li>
                </ul>
            </div>

            <form method="POST">
                <button type="submit" name="action" value="check">🔍 Check Configuration</button>
                <button type="submit" name="action" value="setup">🚀 Run Database Setup</button>
            </form>
            <?php
        }

        function checkConfiguration() {
            global $db_host, $db_name, $db_user, $db_pass;
            
            echo '<div class="step"><h3>🔍 Configuration Check</h3>';
            
            if (!file_exists('.env')) {
                echo '<div class="step error">❌ .env file not found. Please create a .env file with your database credentials.</div>';
                echo '<form method="GET"><button type="submit">← Back to Setup</button></form>';
                return;
            }
            
            echo '<div class="step success">✅ .env file found</div>';
            
            if (empty($db_user) || empty($db_pass)) {
                echo '<div class="step error">❌ Please set DB_USER and DB_PASS in your .env file before proceeding.</div>';
                echo '<form method="GET"><button type="submit">← Back to Setup</button></form>';
                return;
            }
            
            try {
                $pdo = new PDO("mysql:host=$db_host", $db_user, $db_pass);
                echo '<div class="step success">✅ Database connection successful</div>';
                
                $stmt = $pdo->query("SHOW DATABASES LIKE '$db_name'");
                if ($stmt->rowCount() > 0) {
                    echo '<div class="step success">✅ Database "' . $db_name . '" exists</div>';
                } else {
                    echo '<div class="step error">❌ Database "' . $db_name . '" does not exist. Please create it first.</div>';
                    echo '<form method="GET"><button type="submit">← Back to Setup</button></form>';
                    return;
                }
                
                echo '<div class="step success">🎉 Configuration looks good! You can proceed with the setup.</div>';
                echo '<form method="POST">
                        <button type="submit" name="action" value="setup">🚀 Run Database Setup</button>
                        <button type="submit" formmethod="GET">← Back to Setup</button>
                      </form>';
                
            } catch (PDOException $e) {
                echo '<div class="step error">❌ Database connection failed: ' . $e->getMessage() . '</div>';
                echo '<form method="GET"><button type="submit">← Back to Setup</button></form>';
            }
            echo '</div>';
        }

        function runDatabaseSetup() {
            global $db_host, $db_name, $db_user, $db_pass;
            
            echo '<div class="step"><h3>🚀 Running Database Setup</h3>';
            
            if (!file_exists('.env')) {
                echo '<div class="step error">❌ .env file not found. Please create one first!</div>';
                echo '<form method="GET"><button type="submit">← Back to Setup</button></form>';
                return;
            }
            
            if (empty($db_user) || empty($db_pass)) {
                echo '<div class="step error">❌ Please set DB_USER and DB_PASS in your .env file first!</div>';
                echo '<form method="GET"><button type="submit">← Back to Setup</button></form>';
                return;
            }

            try {
                $pdo = new PDO("mysql:host=$db_host;dbname=$db_name;charset=utf8mb4", $db_user, $db_pass);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                
                echo '<div class="step success">✅ Connected to database</div>';
                
                $sql = getDatabaseSetupSQL();
                $statements = explode(';', $sql);
                
                $created_tables = 0;
                $errors = 0;
                
                foreach ($statements as $statement) {
                    $statement = trim($statement);
                    if (empty($statement)) continue;
                    
                    try {
                        $pdo->exec($statement);
                        if (stripos($statement, 'CREATE TABLE') !== false) {
                            $created_tables++;
                        }
                    } catch (PDOException $e) {
                        if (strpos($e->getMessage(), 'already exists') === false) {
                            echo '<div class="step error">❌ Error executing SQL: ' . $e->getMessage() . '</div>';
                            $errors++;
                        }
                    }
                }
                
                if ($errors === 0) {
                    echo '<div class="step success">✅ Database setup completed successfully!</div>';
                    echo '<div class="step success">📊 Tables processed: ' . $created_tables . '</div>';
                    echo '<div class="step warning">⚠️ <strong>Important:</strong> Please delete this setup.php file now for security!</div>';
                    echo '<div class="step"><p><a href="/" style="color: #3498db; text-decoration: none; font-weight: bold;">🎉 Go to your Kanban Board Application →</a></p></div>';
                } else {
                    echo '<div class="step error">❌ Setup completed with ' . $errors . ' errors. Please check your database.</div>';
                }
                
            } catch (PDOException $e) {
                echo '<div class="step error">❌ Database connection failed: ' . $e->getMessage() . '</div>';
            }
            
            echo '</div>';
        }

        function getDatabaseSetupSQL() {
            return "
            SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
            SET time_zone = '+00:00';

            CREATE TABLE IF NOT EXISTS `users` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `name` varchar(255) NOT NULL,
              `email` varchar(255) NOT NULL,
              `password` varchar(255) NOT NULL DEFAULT '',
              `is_admin` tinyint(1) DEFAULT 0,
              `is_active` tinyint(1) DEFAULT 1,
              `last_login` timestamp NULL DEFAULT NULL,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              PRIMARY KEY (`id`),
              UNIQUE KEY `email` (`email`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `boards` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `name` varchar(255) NOT NULL,
              `description` text DEFAULT NULL,
              `color` varchar(7) DEFAULT '#3498db',
              `icon` varchar(100) DEFAULT 'fas fa-tasks',
              `is_active` tinyint(1) DEFAULT 1,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              `created_by` int(11) DEFAULT NULL,
              PRIMARY KEY (`id`),
              UNIQUE KEY `name` (`name`),
              KEY `fk_boards_created_by` (`created_by`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `stages` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `name` varchar(255) NOT NULL,
              `color` varchar(7) DEFAULT '#3498db',
              `position` int(11) DEFAULT 0,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              `board_id` int(11) DEFAULT 1,
              PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `clients` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `name` varchar(255) NOT NULL,
              `contact_name` varchar(255) DEFAULT NULL,
              `contact_number` varchar(50) DEFAULT NULL,
              `email` varchar(255) NOT NULL,
              `url` varchar(500) DEFAULT NULL,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              `company_number` varchar(50) DEFAULT NULL,
              `alternate_phone` varchar(50) DEFAULT NULL,
              `address_1` varchar(255) DEFAULT NULL,
              `address_2` varchar(255) DEFAULT NULL,
              `city` varchar(100) DEFAULT NULL,
              `state` varchar(50) DEFAULT NULL,
              `zip_code` varchar(20) DEFAULT NULL,
              `country` varchar(100) DEFAULT 'United States',
              `classification` varchar(100) DEFAULT NULL,
              `status` enum('active','inactive','lead','prospect') DEFAULT 'active',
              `company_type` enum('customer','lead','prospect','vendor') DEFAULT 'lead',
              `company_category` varchar(100) DEFAULT 'Standard',
              `account_manager_id` int(11) DEFAULT NULL,
              `created_by` int(11) DEFAULT NULL,
              `last_activity` timestamp NULL DEFAULT NULL,
              `notes` text DEFAULT NULL,
              PRIMARY KEY (`id`),
              UNIQUE KEY `email` (`email`),
              KEY `idx_clients_status` (`status`),
              KEY `idx_clients_company_type` (`company_type`),
              KEY `idx_clients_account_manager` (`account_manager_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `tasks` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `title` varchar(255) NOT NULL,
              `description` text DEFAULT NULL,
              `notes` text DEFAULT NULL,
              `stage_id` int(11) DEFAULT NULL,
              `user_id` int(11) DEFAULT NULL,
              `client_id` int(11) DEFAULT NULL,
              `created_by` int(11) DEFAULT NULL,
              `start_date` date DEFAULT NULL,
              `due_date` date DEFAULT NULL,
              `card_color` varchar(7) DEFAULT '#ffffff',
              `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
              `position` int(11) DEFAULT 0,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              `board_id` int(11) DEFAULT 1,
              `due_time` time DEFAULT NULL,
              `is_completed` tinyint(1) DEFAULT 0,
              `completed_at` timestamp NULL DEFAULT NULL,
              PRIMARY KEY (`id`),
              KEY `stage_id` (`stage_id`),
              KEY `user_id` (`user_id`),
              KEY `client_id` (`client_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `attachments` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `task_id` int(11) DEFAULT NULL,
              `filename` varchar(255) NOT NULL,
              `original_name` varchar(255) NOT NULL,
              `file_size` int(11) DEFAULT NULL,
              `mime_type` varchar(100) DEFAULT NULL,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `task_id` (`task_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `checklist_items` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `task_id` int(11) DEFAULT NULL,
              `text` varchar(500) NOT NULL,
              `is_completed` tinyint(1) DEFAULT 0,
              `position` int(11) DEFAULT 0,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `task_id` (`task_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `board_shares` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `board_id` int(11) NOT NULL,
              `user_id` int(11) NOT NULL,
              `shared_by` int(11) NOT NULL,
              `shared_at` timestamp NULL DEFAULT current_timestamp(),
              PRIMARY KEY (`id`),
              UNIQUE KEY `unique_board_user` (`board_id`,`user_id`),
              KEY `user_id` (`user_id`),
              KEY `shared_by` (`shared_by`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `task_shares` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `task_id` int(11) NOT NULL,
              `user_id` int(11) NOT NULL,
              `shared_by` int(11) NOT NULL,
              `shared_at` timestamp NULL DEFAULT current_timestamp(),
              PRIMARY KEY (`id`),
              UNIQUE KEY `unique_task_user` (`task_id`,`user_id`),
              KEY `user_id` (`user_id`),
              KEY `shared_by` (`shared_by`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `task_notes` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `task_id` int(11) NOT NULL,
              `user_id` int(11) NOT NULL,
              `note_text` text NOT NULL,
              `note_type` enum('call','email','inperson') DEFAULT 'call',
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `task_id` (`task_id`),
              KEY `user_id` (`user_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `notifications` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `user_id` int(11) NOT NULL,
              `task_id` int(11) DEFAULT NULL,
              `message` text NOT NULL,
              `type` enum('task_assigned','task_updated','note_added','checklist_completed') NOT NULL,
              `is_read` tinyint(1) DEFAULT 0,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `user_id` (`user_id`),
              KEY `task_id` (`task_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `companies` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `name` varchar(255) NOT NULL,
              `contact_name` varchar(255) DEFAULT NULL,
              `contact_number` varchar(50) DEFAULT NULL,
              `email` varchar(255) DEFAULT NULL,
              `url` varchar(500) DEFAULT NULL,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              PRIMARY KEY (`id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `notes` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `title` varchar(255) NOT NULL,
              `content` longtext DEFAULT NULL,
              `user_id` int(11) NOT NULL,
              `client_id` int(11) DEFAULT NULL,
              `task_id` int(11) DEFAULT NULL,
              `tags` text DEFAULT NULL,
              `is_pinned` tinyint(1) DEFAULT 0,
              `is_archived` tinyint(1) DEFAULT 0,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `idx_notes_user` (`user_id`),
              KEY `idx_notes_client` (`client_id`),
              KEY `idx_notes_task` (`task_id`),
              KEY `idx_notes_tags` (`tags`(768)),
              FULLTEXT KEY `idx_notes_content` (`title`,`content`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `note_links` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `source_note_id` int(11) NOT NULL,
              `target_note_id` int(11) NOT NULL,
              `link_type` enum('bidirectional','unidirectional') DEFAULT 'bidirectional',
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              PRIMARY KEY (`id`),
              UNIQUE KEY `unique_note_link` (`source_note_id`,`target_note_id`),
              KEY `target_note_id` (`target_note_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `opportunities` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `client_id` int(11) NOT NULL,
              `title` varchar(255) NOT NULL,
              `description` text DEFAULT NULL,
              `status` enum('new','qualified','proposal','negotiation','won','lost') DEFAULT 'new',
              `revenue` decimal(15,2) DEFAULT NULL,
              `probability` int(11) DEFAULT 0,
              `close_date` date DEFAULT NULL,
              `owner_id` int(11) DEFAULT NULL,
              `created_by` int(11) NOT NULL,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `client_id` (`client_id`),
              KEY `owner_id` (`owner_id`),
              KEY `created_by` (`created_by`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `opportunity_notes` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `opportunity_id` int(11) NOT NULL,
              `user_id` int(11) NOT NULL,
              `note_text` text NOT NULL,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `opportunity_id` (`opportunity_id`),
              KEY `user_id` (`user_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `opportunity_attachments` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `opportunity_id` int(11) NOT NULL,
              `user_id` int(11) NOT NULL,
              `title` varchar(255) NOT NULL,
              `description` text DEFAULT NULL,
              `filename` varchar(255) NOT NULL,
              `filepath` varchar(500) NOT NULL,
              `filesize` int(11) NOT NULL,
              `file_type` varchar(50) NOT NULL,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `opportunity_id` (`opportunity_id`),
              KEY `user_id` (`user_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `client_activities` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `client_id` int(11) NOT NULL,
              `user_id` int(11) NOT NULL,
              `activity_type` enum('note','call','email','meeting','task','quote','invoice') NOT NULL,
              `title` varchar(255) NOT NULL,
              `description` text DEFAULT NULL,
              `activity_date` timestamp NULL DEFAULT current_timestamp(),
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `user_id` (`user_id`),
              KEY `idx_client_activities_client` (`client_id`),
              KEY `idx_client_activities_date` (`activity_date`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `client_attachments` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `client_id` int(11) NOT NULL,
              `filename` varchar(255) NOT NULL,
              `original_name` varchar(255) NOT NULL,
              `file_size` int(11) DEFAULT NULL,
              `mime_type` varchar(100) DEFAULT NULL,
              `description` varchar(255) DEFAULT NULL,
              `uploaded_by` int(11) NOT NULL,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `client_id` (`client_id`),
              KEY `uploaded_by` (`uploaded_by`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `client_contacts` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `client_id` int(11) NOT NULL,
              `name` varchar(255) NOT NULL,
              `email` varchar(255) DEFAULT NULL,
              `phone` varchar(50) DEFAULT NULL,
              `mobile_phone` varchar(20) DEFAULT NULL,
              `position` varchar(100) DEFAULT NULL,
              `is_primary` tinyint(1) DEFAULT 0,
              `is_billing_contact` tinyint(1) DEFAULT 0,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `idx_client_contacts_client` (`client_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `client_groups` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `name` varchar(255) NOT NULL,
              `description` text DEFAULT NULL,
              `created_by` int(11) NOT NULL,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `created_by` (`created_by`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `client_group_members` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `group_id` int(11) NOT NULL,
              `client_id` int(11) NOT NULL,
              `added_by` int(11) NOT NULL,
              `added_at` timestamp NULL DEFAULT current_timestamp(),
              PRIMARY KEY (`id`),
              UNIQUE KEY `unique_group_client` (`group_id`,`client_id`),
              KEY `client_id` (`client_id`),
              KEY `added_by` (`added_by`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `client_todos` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `client_id` int(11) NOT NULL,
              `user_id` int(11) NOT NULL,
              `title` varchar(255) NOT NULL,
              `description` text DEFAULT NULL,
              `due_date` date DEFAULT NULL,
              `due_time` time DEFAULT NULL,
              `priority` enum('low','medium','high') DEFAULT 'medium',
              `is_completed` tinyint(1) DEFAULT 0,
              `completed_at` timestamp NULL DEFAULT NULL,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              `status` enum('pending','closed') DEFAULT 'pending',
              PRIMARY KEY (`id`),
              KEY `idx_client_todos_client` (`client_id`),
              KEY `idx_client_todos_user` (`user_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `assets` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `client_id` int(11) NOT NULL,
              `name` varchar(255) NOT NULL,
              `type` varchar(100) NOT NULL,
              `model` varchar(255) DEFAULT NULL,
              `serial_number` varchar(255) DEFAULT NULL,
              `status` enum('active','inactive','maintenance','retired') DEFAULT 'active',
              `location` varchar(255) DEFAULT NULL,
              `ip_address` varchar(45) DEFAULT NULL,
              `purchase_date` date DEFAULT NULL,
              `warranty_expiry` date DEFAULT NULL,
              `notes` text DEFAULT NULL,
              `it_glue_id` varchar(255) DEFAULT NULL,
              `created_by` int(11) DEFAULT NULL,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `client_id` (`client_id`),
              KEY `created_by` (`created_by`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `tbr_meetings` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `client_id` int(11) NOT NULL,
              `meeting_date` date NOT NULL,
              `meeting_type` varchar(100) DEFAULT 'Business Review',
              `primary_contact` varchar(255) DEFAULT NULL,
              `account_manager_id` int(11) DEFAULT NULL,
              `status` enum('scheduled','completed','cancelled') DEFAULT 'scheduled',
              `notes` text DEFAULT NULL,
              `recommendations` text DEFAULT NULL,
              `created_by` int(11) DEFAULT NULL,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `client_id` (`client_id`),
              KEY `account_manager_id` (`account_manager_id`),
              KEY `created_by` (`created_by`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `tbr_attendees` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `meeting_id` int(11) NOT NULL,
              `user_id` int(11) DEFAULT NULL,
              `name` varchar(255) DEFAULT NULL,
              `email` varchar(255) DEFAULT NULL,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `meeting_id` (`meeting_id`),
              KEY `user_id` (`user_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE IF NOT EXISTS `tbr_attachments` (
              `id` int(11) NOT NULL AUTO_INCREMENT,
              `meeting_id` int(11) NOT NULL,
              `filename` varchar(255) NOT NULL,
              `original_filename` varchar(255) NOT NULL,
              `file_path` varchar(500) NOT NULL,
              `file_size` int(11) DEFAULT NULL,
              `mime_type` varchar(100) DEFAULT NULL,
              `uploaded_by` int(11) DEFAULT NULL,
              `created_at` timestamp NULL DEFAULT current_timestamp(),
              PRIMARY KEY (`id`),
              KEY `meeting_id` (`meeting_id`),
              KEY `uploaded_by` (`uploaded_by`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
            ";
        }
        ?>
    </div>
</body>
</html>
