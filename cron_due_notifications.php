<?php
/**
 * Cron script for sending due notifications
 * Run this daily at 5 AM: 0 5 * * * /usr/bin/php /path/to/cron_due_notifications.php
 */

date_default_timezone_set('UTC');

require_once 'api/config.php';

try {
    try {
        $pdo = new PDO("mysql:unix_socket=/var/run/mysqld/mysqld.sock;dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    } catch (Exception $e) {
        $pdo = new PDO("mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4", DB_USER, DB_PASS);
    }
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $today = date('Y-m-d');
    
    $stmt = $pdo->prepare("
        SELECT t.*, u.name as user_name, u.email as user_email, c.name as client_name
        FROM tasks t
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN clients c ON t.client_id = c.id
        WHERE t.due_date IS NOT NULL 
        AND t.user_id IS NOT NULL
        AND (t.due_date <= ? OR t.due_date <= DATE_ADD(?, INTERVAL 7 DAY))
        AND t.is_completed = 0
        ORDER BY t.due_date ASC
    ");
    $stmt->execute([$today, $today]);
    $dueTasks = $stmt->fetchAll();
    
    if (empty($dueTasks)) {
        echo "[" . date('Y-m-d H:i:s') . "] No overdue or upcoming tasks found. Exiting.\n";
        exit(0);
    }
    
    $userTasks = [];
    foreach ($dueTasks as $task) {
        $userId = $task['user_id'];
        if (!isset($userTasks[$userId])) {
            $userTasks[$userId] = [
                'user_name' => $task['user_name'],
                'user_email' => $task['user_email'],
                'tasks' => []
            ];
        }
        $userTasks[$userId]['tasks'][] = $task;
    }
    
    $sentCount = 0;
    $failedCount = 0;
    
    foreach ($userTasks as $userData) {
        if (sendDueNotificationEmail($userData)) {
            $sentCount++;
            echo "[" . date('Y-m-d H:i:s') . "] Sent notification to {$userData['user_name']} ({$userData['user_email']}) - " . count($userData['tasks']) . " tasks\n";
        } else {
            $failedCount++;
            echo "[" . date('Y-m-d H:i:s') . "] FAILED to send notification to {$userData['user_name']} ({$userData['user_email']})\n";
        }
    }
    
    echo "[" . date('Y-m-d H:i:s') . "] Summary: Sent $sentCount emails, Failed $failedCount emails\n";
    exit(0);
    
} catch (Exception $e) {
    echo "[" . date('Y-m-d H:i:s') . "] ERROR: " . $e->getMessage() . "\n";
    exit(1);
}

function sendDueNotificationEmail($userData) {
    require_once __DIR__ . '/api/env_loader.php';
    
    $brevoApiKey = getenv('BREVO_API_KEY');
    if (!$brevoApiKey) {
        echo "[" . date('Y-m-d H:i:s') . "] ERROR: BREVO_API_KEY environment variable not set\n";
        return false;
    }
    
    $senderEmail = getenv('ADMIN_EMAIL') ?: 'admin@localhost'; // Configured via .env file
    $senderName = getenv('SENDER_NAME') ?: 'Task Management System';
    
    $htmlContent = generateDueNotificationEmail($userData);
    
    $data = [
        'sender' => [
            'name' => $senderName,
            'email' => $senderEmail
        ],
        'to' => [
            [
                'email' => $userData['user_email'],
                'name' => $userData['user_name']
            ]
        ],
        'subject' => 'Tasks Due Tomorrow - Action Required',
        'htmlContent' => $htmlContent
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.brevo.com/v3/smtp/email');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'accept: application/json',
        'api-key: ' . $brevoApiKey,
        'content-type: application/json'
    ]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        echo "[" . date('Y-m-d H:i:s') . "] CURL Error: $error\n";
        return false;
    }
    
    if ($httpCode === 201) {
        return true;
    } else {
        echo "[" . date('Y-m-d H:i:s') . "] Brevo API Error: HTTP $httpCode - $response\n";
        return false;
    }
}

function generateDueNotificationEmail($userData) {
    $taskCards = '';
    foreach ($userData['tasks'] as $task) {
        $priorityClass = 'priority-' . ($task['priority'] ?? 'medium');
        $taskCards .= '
        <div class="task-card ' . $priorityClass . '" style="
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 16px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            border-left: 4px solid ' . getPriorityColor($task['priority'] ?? 'medium') . ';
        ">
            <div class="task-header" style="
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 12px;
            ">
                <h3 class="task-title" style="
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #1a202c;
                ">' . htmlspecialchars($task['title']) . '</h3>
                <span class="task-priority" style="
                    background: ' . getPriorityColor($task['priority'] ?? 'medium') . ';
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: 600;
                    text-transform: uppercase;
                ">' . ucfirst($task['priority'] ?? 'medium') . '</span>
            </div>
            
            ' . ($task['description'] ? '
            <div class="task-description" style="
                color: #4a5568;
                margin-bottom: 12px;
                line-height: 1.5;
            ">' . htmlspecialchars($task['description']) . '</div>
            ' : '') . '
            
            <div class="task-meta" style="
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                font-size: 14px;
                color: #718096;
            ">
                ' . ($task['client_name'] ? '
                <span class="task-client" style="
                    display: flex;
                    align-items: center;
                    gap: 4px;
                ">
                    <span style="color: #e53e3e;">🏢</span>
                    ' . htmlspecialchars($task['client_name']) . '
                </span>
                ' : '') . '
                
                <span class="task-due-date" style="
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    color: #d69e2e;
                    font-weight: 600;
                ">
                    <span>📅</span>
                    Due: ' . date('M j, Y', strtotime($task['due_date'])) . '
                </span>
            </div>
        </div>';
    }
    
    return '
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Tasks Due Tomorrow</title>
    </head>
    <body style="
        margin: 0;
        padding: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        background-color: #f7fafc;
    ">
        <div style="
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        ">
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 32px;
                text-align: center;
            ">
                <h1 style="
                    margin: 0;
                    color: white;
                    font-size: 28px;
                    font-weight: 700;
                ">⚠️ Tasks Due Tomorrow</h1>
                <p style="
                    margin: 8px 0 0 0;
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 16px;
                ">Hi ' . htmlspecialchars($userData['user_name']) . ', you have ' . count($userData['tasks']) . ' task(s) due tomorrow</p>
            </div>
            
            <div style="padding: 32px;">
                <p style="
                    margin: 0 0 24px 0;
                    color: #4a5568;
                    font-size: 16px;
                    line-height: 1.6;
                ">Please review and complete the following tasks before they are due:</p>
                
                ' . $taskCards . '
                
                <div style="
                    margin-top: 32px;
                    padding: 20px;
                    background-color: #f7fafc;
                    border-radius: 8px;
                    border-left: 4px solid #3182ce;
                ">
                    <h3 style="
                        margin: 0 0 12px 0;
                        color: #2d3748;
                        font-size: 18px;
                    ">💡 Quick Tips</h3>
                    <ul style="
                        margin: 0;
                        padding-left: 20px;
                        color: #4a5568;
                        line-height: 1.6;
                    ">
                        <li>Prioritize tasks by importance and urgency</li>
                        <li>Break down complex tasks into smaller steps</li>
                        <li>Update task status as you make progress</li>
                        <li>Reach out to clients if you need clarification</li>
                    </ul>
                </div>
                
                <div style="
                    margin-top: 32px;
                    text-align: center;
                    padding: 20px;
                    background-color: #f0fff4;
                    border-radius: 8px;
                    border: 1px solid #9ae6b4;
                ">
                    <p style="
                        margin: 0;
                        color: #22543d;
                        font-size: 14px;
                    ">
                        <strong>Need help?</strong> Contact your team lead or project manager for assistance.
                    </p>
                </div>
            </div>
            
            <div style="
                background-color: #2d3748;
                color: #a0aec0;
                padding: 20px;
                text-align: center;
                font-size: 14px;
            ">
                <p style="margin: 0;">
                    This is an automated notification from your Task Management System.<br>
                    Please log in to your dashboard to update task status.
                </p>
            </div>
        </div>
    </body>
    </html>';
}

function getPriorityColor($priority) {
    switch ($priority) {
        case 'urgent':
            return '#e53e3e';
        case 'high':
            return '#dd6b20';
        case 'medium':
            return '#3182ce';
        case 'low':
            return '#38a169';
        default:
            return '#3182ce';
    }
}
?> 