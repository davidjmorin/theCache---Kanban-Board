<?php
require_once 'api/config.php';
require_once 'api/email_notifications.php';

$pdo = getConnection();
$emailNotifications = new EmailNotifications($pdo);
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

session_start();

$endpoint = $_GET['endpoint'] ?? '';
$id = $_GET['id'] ?? null;

if (empty($endpoint)) {
    $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $pathParts = explode('/', trim($path, '/'));

    $apiIndex = array_search('api.php', $pathParts);
    if ($apiIndex !== false) {
        $pathParts = array_slice($pathParts, $apiIndex + 1);
    }

    $endpoint = $pathParts[0] ?? '';
    $id = $pathParts[1] ?? null;
}

switch ($endpoint) {
    case 'login':
        handleLogin($pdo, $method);
        break;
    case 'register':
        handleRegister($pdo, $method);
        break;
    case 'logout':
        handleLogout($pdo, $method);
        break;
    case 'check-auth':
        handleCheckAuth($pdo, $method);
        break;
    case 'company':
        requireAuth();
        handleCompany($pdo, $method, $id);
        break;
    case 'stages':
        requireAuth();
        handleStages($pdo, $method, $id);
        break;
    case 'tasks':
        requireAuth();
        handleTasks($pdo, $method, $id);
        break;
    case 'users':
        requireAuth();
        handleUsers($pdo, $method, $id);
        break;
    case 'clients':
        requireAuth();
        handleClients($pdo, $method, $id);
        break;
    case 'boards':
        requireAuth();
        handleBoards($pdo, $method, $id);
        break;
        case 'attachments':
            requireAuth();
            handleAttachments($pdo, $method, $id);
            break;
        case 'notes':
            requireAuth();
            handleNotes($pdo, $method, $id);
            break;
        case 'notifications':
            requireAuth();
            handleNotifications($pdo, $method, $id);
            break;
        case 'search':
            requireAuth();
            handleSearch($pdo, $method, $id);
            break;
    case 'checklist':
        requireAuth();
        handleChecklist($pdo, $method, $id);
        break;
    case 'task-checklist':
        requireAuth();
        handleTaskChecklist($pdo, $method, $id);
        break;
    case 'board':
        requireAuth();
        handleBoard($pdo, $method);
        break;
    case 'client-tasks':
        requireAuth();
        handleClientTasks($pdo, $method, $id);
        break;
    case 'due-tasks':
        requireAuth();
        handleDueTasks($pdo, $method);
        break;
    case 'crm-clients':
        requireAuth();
        try {
            handleCrmClients($pdo, $method);
        } catch (Exception $e) {
            sendResponse(['error' => 'CRM Clients error: ' . $e->getMessage()], 500);
        }
        break;
    case 'crm-client':
        requireAuth();
        $clientId = $_GET['id'] ?? null;
        handleCrmClient($pdo, $method, $clientId);
        break;
    case 'crm-contacts':
        requireAuth();
        $clientId = $_GET['client_id'] ?? null;
        handleCrmContacts($pdo, $method, $clientId);
        break;
    case 'crm-activities':
        requireAuth();
        $clientId = $_GET['client_id'] ?? null;
        handleCrmActivities($pdo, $method, $clientId);
        break;
    case 'crm-attachments':
        requireAuth();
        $clientId = $_GET['client_id'] ?? null;
        handleCrmAttachments($pdo, $method, $clientId);
        break;
    case 'crm-todos':
        requireAuth();
        $clientId = $_GET['client_id'] ?? null;
        handleCrmTodos($pdo, $method, $clientId);
        break;
    case 'crm-groups':
        requireAuth();
        handleCrmGroups($pdo, $method);
        break;
            case 'send-due-notifications':
            handleDueNotifications($pdo, $method);
            break;
        case 'share-board':
            requireAuth();
            handleShareBoard($pdo, $method, $id);
            break;
        case 'share-task':
            requireAuth();
            handleShareTask($pdo, $method, $id);
            break;
        case 'unshare-board':
            requireAuth();
            handleUnshareBoard($pdo, $method, $id);
            break;
        case 'unshare-task':
            requireAuth();
            handleUnshareTask($pdo, $method, $id);
            break;
    case 'debug':
        sendResponse(['status' => 'API is working', 'session_user_id' => $_SESSION['user_id'] ?? 'not set']);
        break;
    case 'debug-shares':
        requireAuth();
        $boardId = $_GET['board_id'] ?? null;
        $taskId = $_GET['task_id'] ?? null;

        if ($boardId) {
            $stmt = $pdo->prepare("
                SELECT bs.*, u.name as user_name 
                FROM board_shares bs 
                JOIN users u ON bs.user_id = u.id 
                WHERE bs.board_id = ?
            ");
            $stmt->execute([$boardId]);
            $shares = $stmt->fetchAll();
            sendResponse(['board_id' => $boardId, 'shares' => $shares]);
        } elseif ($taskId) {
            $stmt = $pdo->prepare("
                SELECT ts.*, u.name as user_name 
                FROM task_shares ts 
                JOIN users u ON ts.user_id = u.id 
                WHERE ts.task_id = ?
            ");
            $stmt->execute([$taskId]);
            $shares = $stmt->fetchAll();
            sendResponse(['task_id' => $taskId, 'shares' => $shares]);
        } else {
            sendResponse(['error' => 'Board ID or Task ID required']);
        }
        break;
    case 'crm-csv-import':
        handleCrmCsvImport();
        break;
    case 'crm-users':
        handleCrmUsers($pdo, $method);
        break;
    default:
        sendResponse(['error' => 'Endpoint not found'], 404);
}

function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required', 'auth_required' => true], 401);
    }
}

function requireAdmin() {
    requireAuth();
    if (!isset($_SESSION['is_admin']) || !$_SESSION['is_admin']) {
        sendResponse(['error' => 'Admin access required'], 403);
    }
}

function getCurrentUser() {
    return [
        'id' => $_SESSION['user_id'] ?? null,
        'name' => $_SESSION['user_name'] ?? null,
        'email' => $_SESSION['user_email'] ?? null,
        'is_admin' => $_SESSION['is_admin'] ?? false
    ];
}

function handleLogin($pdo, $method) {
    if ($method !== 'POST') {
        sendResponse(['error' => 'Method not allowed'], 405);
    }

    $data = getRequestBody();
    validateRequired($data, ['email', 'password']);

    $stmt = $pdo->prepare("SELECT id, name, email, password, is_admin FROM users WHERE email = ? AND is_active = 1");
    $stmt->execute([$data['email']]);
    $user = $stmt->fetch();

    if (!$user || !password_verify($data['password'], $user['password'])) {
        sendResponse(['error' => 'Invalid credentials'], 401);
    }

            $stmt = $pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);

        $_SESSION['user_id'] = $user['id'];
    $_SESSION['user_name'] = $user['name'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['is_admin'] = (bool)$user['is_admin'];
    
    // Generate CSRF token for the session
    $csrfToken = generateCSRFToken();

    sendResponse([
        'success' => true,
        'user' => [
            'id' => $user['id'],
            'name' => sanitizeOutput($user['name']),
            'email' => sanitizeOutput($user['email']),
            'is_admin' => (bool)$user['is_admin']
        ],
        'csrf_token' => $csrfToken
    ]);
}

function handleRegister($pdo, $method) {
    if ($method !== 'POST') {
        sendResponse(['error' => 'Method not allowed'], 405);
    }

    $data = getRequestBody();
    validateRequired($data, ['name', 'email', 'password']);
    
    // Sanitize input data
    $data['name'] = sanitizeInput($data['name']);
    $data['email'] = filter_var(trim($data['email']), FILTER_SANITIZE_EMAIL);
    
    if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
        sendResponse(['error' => 'Invalid email format'], 400);
    }

    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        sendResponse(['error' => 'Email already registered'], 409);
    }

    // Enhanced password validation
    $password = $data['password'];
    $errors = [];
    
    if (strlen($password) < 8) {
        $errors[] = 'Password must be at least 8 characters long';
    }
    
    if (!preg_match('/[A-Z]/', $password)) {
        $errors[] = 'Password must contain at least one uppercase letter';
    }
    
    if (!preg_match('/[a-z]/', $password)) {
        $errors[] = 'Password must contain at least one lowercase letter';
    }
    
    if (!preg_match('/[0-9]/', $password)) {
        $errors[] = 'Password must contain at least one number';
    }
    
    if (!preg_match('/[^A-Za-z0-9]/', $password)) {
        $errors[] = 'Password must contain at least one special character';
    }
    
    if (!empty($errors)) {
        sendResponse(['error' => 'Password requirements not met: ' . implode(', ', $errors)], 400);
    }

    $stmt = $pdo->prepare("INSERT INTO users (name, email, password, is_admin, is_active) VALUES (?, ?, ?, 0, 1)");
    $stmt->execute([
        $data['name'],
        $data['email'],
        password_hash($data['password'], PASSWORD_DEFAULT)
    ]);

    $userId = $pdo->lastInsertId();

    $_SESSION['user_id'] = $userId;
    $_SESSION['user_name'] = $data['name'];
    $_SESSION['user_email'] = $data['email'];
    $_SESSION['is_admin'] = false;

    sendResponse([
        'success' => true,
        'message' => 'Registration successful',
        'user' => [
            'id' => $userId,
            'name' => $data['name'],
            'email' => $data['email'],
            'is_admin' => false
        ]
    ]);
}

function handleLogout($pdo, $method) {
    if ($method !== 'POST') {
        sendResponse(['error' => 'Method not allowed'], 405);
    }

    session_destroy();
    sendResponse(['success' => true, 'message' => 'Logged out successfully']);
}

function handleCheckAuth($pdo, $method) {
    if ($method !== 'GET') {
        sendResponse(['error' => 'Method not allowed'], 405);
    }

    if (isset($_SESSION['user_id'])) {
        sendResponse([
            'authenticated' => true,
            'user' => getCurrentUser()
        ]);
    } else {
        sendResponse(['authenticated' => false]);
    }
}

function handleCompany($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM companies WHERE id = 1");
            $company = $stmt->fetch();
            if (!$company) {
                $company = ['id' => 1, 'name' => 'My Company'];
            }
            sendResponse($company);
            break;
        case 'PUT':
            $data = getRequestBody();
            validateRequired($data, ['name']);

            $stmt = $pdo->prepare("UPDATE companies SET name = ?, updated_at = NOW() WHERE id = 1");
            $stmt->execute([$data['name']]);

            sendResponse(['success' => true, 'message' => 'Company updated successfully']);
            break;
    }
}

function handleStages($pdo, $method, $id) {
    try {
        $stmt = $pdo->query("SHOW COLUMNS FROM stages LIKE 'board_id'");
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE stages ADD COLUMN board_id INT DEFAULT 1");
            $pdo->exec("UPDATE stages SET board_id = 1 WHERE board_id IS NULL");
        }

        switch ($method) {
            case 'GET':
                if ($id) {
                    $stmt = $pdo->prepare("SELECT * FROM stages WHERE id = ?");
                    $stmt->execute([$id]);
                    $stage = $stmt->fetch();
                    if (!$stage) {
                        sendResponse(['error' => 'Stage not found'], 404);
                    }
                    sendResponse($stage);
                } else {
                    $boardId = $_GET['board_id'] ?? null;
                    if (!$boardId) {
                        sendResponse(['error' => 'Board ID required'], 400);
                    }

                    $currentUser = getCurrentUser();
                    $stmt = $pdo->prepare("
                        SELECT b.*, 
                               CASE WHEN b.created_by = ? THEN 'owner' 
                                    WHEN bs.user_id = ? THEN 'shared' 
                                    WHEN b.created_by IS NULL THEN 'owner' 
                                    ELSE 'none' END as access_type
                        FROM boards b
                        LEFT JOIN board_shares bs ON b.id = bs.board_id
                        WHERE b.id = ? AND (b.created_by = ? OR bs.user_id = ? OR b.created_by IS NULL)
                    ");
                    $stmt->execute([$currentUser['id'], $currentUser['id'], $boardId, $currentUser['id'], $currentUser['id']]);
                    $boardAccess = $stmt->fetch();

                    if (!$boardAccess) {
                        sendResponse(['error' => 'Access denied to this board'], 403);
                    }

                    $stmt = $pdo->prepare("SELECT * FROM stages WHERE board_id = ? ORDER BY position");
                    $stmt->execute([$boardId]);
                    sendResponse($stmt->fetchAll());
                }
                break;
            case 'POST':
                $data = getRequestBody();
                validateRequired($data, ['name', 'board_id']);

                $stmt = $pdo->prepare("SELECT MAX(position) as max_pos FROM stages WHERE board_id = ?");
                $stmt->execute([$data['board_id']]);
                $result = $stmt->fetch();
                $newPosition = ($result['max_pos'] ?? 0) + 1;

                $stmt = $pdo->prepare("INSERT INTO stages (name, color, board_id, position) VALUES (?, ?, ?, ?)");
                $stmt->execute([
                    $data['name'],
                    $data['color'] ?? '#3498db',
                    $data['board_id'],
                    $newPosition
                ]);

                $newId = $pdo->lastInsertId();
                $stmt = $pdo->prepare("SELECT * FROM stages WHERE id = ?");
                $stmt->execute([$newId]);
                sendResponse($stmt->fetch());
                break;
            case 'PUT':
                if (!$id) {
                    sendResponse(['error' => 'Stage ID required'], 400);
                }
                $data = getRequestBody();

                if (isset($data['position'])) {
                    $newPosition = (int)$data['position'];

                    $stmt = $pdo->prepare("SELECT position FROM stages WHERE id = ?");
                    $stmt->execute([$id]);
                    $currentStage = $stmt->fetch();
                    if (!$currentStage) {
                        sendResponse(['error' => 'Stage not found'], 404);
                    }
                    $currentPosition = $currentStage['position'];

                    if ($newPosition > $currentPosition) {
                        $stmt = $pdo->prepare("UPDATE stages SET position = position - 1 WHERE position > ? AND position <= ?");
                        $stmt->execute([$currentPosition, $newPosition]);
                    } else {
                        $stmt = $pdo->prepare("UPDATE stages SET position = position + 1 WHERE position >= ? AND position < ?");
                        $stmt->execute([$newPosition, $currentPosition]);
                    }

                    $stmt = $pdo->prepare("UPDATE stages SET position = ? WHERE id = ?");
                    $stmt->execute([$newPosition, $id]);

                    sendResponse(['success' => true, 'message' => 'Stage position updated successfully']);
                } else {
                    validateRequired($data, ['name']);

                    $stmt = $pdo->prepare("UPDATE stages SET name = ?, color = ? WHERE id = ?");
                    $stmt->execute([
                        $data['name'],
                        $data['color'] ?? '#3498db',
                        $id
                    ]);
                    sendResponse(['success' => true, 'message' => 'Stage updated successfully']);
                }
                break;
            case 'DELETE':
                if (!$id) {
                    sendResponse(['error' => 'Stage ID required'], 400);
                }

                $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM tasks WHERE stage_id = ?");
                $stmt->execute([$id]);
                $taskCount = $stmt->fetch()['count'];

                if ($taskCount > 0) {
                    sendResponse(['error' => 'Cannot delete stage with tasks. Move or delete tasks first.'], 400);
                }

                $stmt = $pdo->prepare("DELETE FROM stages WHERE id = ?");
                $stmt->execute([$id]);
                sendResponse(['success' => true, 'message' => 'Stage deleted successfully']);
                break;
            default:
                sendResponse(['error' => 'Method not allowed'], 405);
        }
    } catch (Exception $e) {

        sendResponse(['error' => 'Internal server error: ' . $e->getMessage()], 500);
    }
}

function handleTasks($pdo, $method, $id) {
    try {

        runMigrations($pdo);

        $stmt = $pdo->query("SHOW COLUMNS FROM tasks LIKE 'board_id'");
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE tasks ADD COLUMN board_id INT DEFAULT 1");
            $pdo->exec("UPDATE tasks SET board_id = 1 WHERE board_id IS NULL");
        }

        $stmt = $pdo->query("SHOW COLUMNS FROM tasks LIKE 'created_by'");
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE tasks ADD COLUMN created_by INT");
            $pdo->exec("UPDATE tasks SET created_by = user_id WHERE created_by IS NULL");
        }

        switch ($method) {
            case 'GET':
                if ($id) {
                    $stmt = $pdo->prepare("
                        SELECT t.*, u.name as user_name, c.name as client_name,
                               COUNT(DISTINCT a.id) as attachment_count,
                               COUNT(DISTINCT cl.id) as checklist_total,
                               COUNT(DISTINCT CASE WHEN cl.is_completed = 1 THEN cl.id END) as checklist_completed,
                               t.is_completed,
                               t.completed_at
                        FROM tasks t
                        LEFT JOIN users u ON t.user_id = u.id
                        LEFT JOIN clients c ON t.client_id = c.id
                        LEFT JOIN attachments a ON t.id = a.task_id
                        LEFT JOIN checklist_items cl ON t.id = cl.task_id
                        WHERE t.id = ?
                        GROUP BY t.id
                    ");
                    $stmt->execute([$id]);
                    $task = $stmt->fetch();
                    if (!$task) {
                        sendResponse(['error' => 'Task not found'], 404);
                    }

                    $stmt = $pdo->prepare("
                        SELECT b.*, 
                               CASE WHEN b.created_by = ? THEN 'owner' 
                                    WHEN bs.user_id = ? THEN 'shared' 
                                    WHEN b.created_by IS NULL THEN 'owner' 
                                    ELSE 'none' END as access_type
                        FROM boards b
                        LEFT JOIN board_shares bs ON b.id = bs.board_id
                        WHERE b.id = ? AND (b.created_by = ? OR bs.user_id = ? OR b.created_by IS NULL)
                    ");
                    $stmt->execute([$_SESSION['user_id'], $_SESSION['user_id'], $task['board_id'], $_SESSION['user_id'], $_SESSION['user_id']]);
                    $board = $stmt->fetch();

                    if (!$board) {
                        sendResponse(['error' => 'Access denied to this task'], 403);
                    }

                    sendResponse($task);
                } else {
                    $boardId = $_GET['board_id'] ?? null;
                    if (!$boardId) {
                        sendResponse(['error' => 'Board ID required'], 400);
                    }

                    $stmt = $pdo->prepare("
                        SELECT b.*, 
                               CASE WHEN b.created_by = ? THEN 'owner' 
                                    WHEN bs.user_id = ? THEN 'shared' 
                                    WHEN b.created_by IS NULL THEN 'owner' 
                                    ELSE 'none' END as access_type
                        FROM boards b
                        LEFT JOIN board_shares bs ON b.id = bs.board_id
                        WHERE b.id = ? AND (b.created_by = ? OR bs.user_id = ? OR b.created_by IS NULL)
                    ");
                    $stmt->execute([$_SESSION['user_id'], $_SESSION['user_id'], $boardId, $_SESSION['user_id'], $_SESSION['user_id']]);
                    $board = $stmt->fetch();

                    if (!$board) {
                        sendResponse(['error' => 'Access denied to this board'], 403);
                    }

                    $stmt = $pdo->prepare("
                        SELECT t.*, u.name as user_name, c.name as client_name,
                               COUNT(DISTINCT a.id) as attachment_count,
                               COUNT(DISTINCT cl.id) as checklist_total,
                               COUNT(DISTINCT CASE WHEN cl.is_completed = 1 THEN cl.id END) as checklist_completed,
                               t.is_completed,
                               t.completed_at
                        FROM tasks t
                        LEFT JOIN users u ON t.user_id = u.id
                        LEFT JOIN clients c ON t.client_id = c.id
                        LEFT JOIN attachments a ON t.id = a.task_id
                        LEFT JOIN checklist_items cl ON t.id = cl.task_id
                        WHERE t.board_id = ?
                        GROUP BY t.id
                        ORDER BY t.stage_id, t.position
                    ");
                    $stmt->execute([$boardId]);
                    $tasks = $stmt->fetchAll();

                    sendResponse($tasks);
                }
                break;
            case 'POST':
                $data = getRequestBody();
                validateRequired($data, ['title', 'stage_id', 'board_id']);
                
                // Validate CSRF token for POST requests
                $csrfToken = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? null;
                if ($csrfToken) {
                    validateCSRFToken($csrfToken);
                }
                
                // Sanitize input data
                $data['title'] = sanitizeInput($data['title']);
                $data['description'] = sanitizeInput($data['description'] ?? '');
                $data['stage_id'] = (int)$data['stage_id'];
                $data['board_id'] = (int)$data['board_id'];
                $data['user_id'] = isset($data['user_id']) ? (int)$data['user_id'] : null;
                $data['client_id'] = isset($data['client_id']) ? (int)$data['client_id'] : null;
                $data['priority'] = sanitizeInput($data['priority'] ?? 'medium');
                $data['due_date'] = sanitizeInput($data['due_date'] ?? null);
                $data['due_time'] = sanitizeInput($data['due_time'] ?? null);

                $stmt = $pdo->prepare("
                    SELECT b.*, 
                           CASE WHEN b.created_by = ? THEN 'owner' 
                                WHEN bs.user_id = ? THEN 'shared' 
                                WHEN b.created_by IS NULL THEN 'owner' 
                                ELSE 'none' END as access_type
                    FROM boards b
                    LEFT JOIN board_shares bs ON b.id = bs.board_id
                    WHERE b.id = ? AND (b.created_by = ? OR bs.user_id = ? OR b.created_by IS NULL)
                ");
                $stmt->execute([$_SESSION['user_id'], $_SESSION['user_id'], $data['board_id'], $_SESSION['user_id'], $_SESSION['user_id']]);
                $board = $stmt->fetch();

                if (!$board) {
                    sendResponse(['error' => 'Access denied to this board'], 403);
                }

                $stmt = $pdo->prepare("SELECT MAX(position) as max_pos FROM tasks WHERE stage_id = ?");
                $stmt->execute([$data['stage_id']]);
                $result = $stmt->fetch();
                $newPosition = ($result['max_pos'] ?? 0) + 1;

                $stmt = $pdo->prepare("
                    INSERT INTO tasks (title, description, stage_id, board_id, user_id, client_id, priority, due_date, due_time, position, created_by) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $data['title'],
                    $data['description'] ?? '',
                    $data['stage_id'],
                    $data['board_id'],
                    $data['user_id'] ?? $_SESSION['user_id'], 
                    $data['client_id'] ?? null,
                    $data['priority'] ?? 'medium',
                    $data['due_date'] ?? null,
                    $data['due_time'] ?? null,
                    $newPosition,
                    $_SESSION['user_id']
                ]);

                $newId = $pdo->lastInsertId();

                $stmt = $pdo->prepare("
                    SELECT t.*, u.name as user_name, c.name as client_name
                    FROM tasks t
                    LEFT JOIN users u ON t.user_id = u.id
                    LEFT JOIN clients c ON t.client_id = c.id
                    WHERE t.id = ?
                ");
                $stmt->execute([$newId]);
                sendResponse($stmt->fetch());
                break;
            case 'PUT':
                if (!$id) {
                    sendResponse(['error' => 'Task ID required'], 400);
                }
                $data = getRequestBody();

                $stmt = $pdo->prepare("SELECT board_id FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
                $task = $stmt->fetch();

                if (!$task) {
                    sendResponse(['error' => 'Task not found'], 404);
                }

                $stmt = $pdo->prepare("
                    SELECT b.*, 
                           CASE WHEN b.created_by = ? THEN 'owner' 
                                WHEN bs.user_id = ? THEN 'shared' 
                                WHEN b.created_by IS NULL THEN 'owner' 
                                ELSE 'none' END as access_type
                    FROM boards b
                    LEFT JOIN board_shares bs ON b.id = bs.board_id
                    WHERE b.id = ? AND (b.created_by = ? OR bs.user_id = ? OR b.created_by IS NULL)
                ");
                $stmt->execute([$_SESSION['user_id'], $_SESSION['user_id'], $task['board_id'], $_SESSION['user_id'], $_SESSION['user_id']]);
                $board = $stmt->fetch();

                if (!$board) {
                    sendResponse(['error' => 'Access denied to this task'], 403);
                }

                if (isset($data['stage_id']) && isset($data['position']) && !isset($data['title'])) {
                    $stmt = $pdo->prepare("UPDATE tasks SET stage_id = ?, position = ? WHERE id = ?");
                    $stmt->execute([
                        $data['stage_id'],
                        $data['position'],
                        $id
                    ]);
                    sendResponse(['success' => true, 'message' => 'Task position updated successfully']);
                } else {

                    if (isset($data['is_completed'])) {
                        $isCompleted = (bool)$data['is_completed'];
                        $completedAt = $isCompleted ? date('Y-m-d H:i:s') : null;

                        $stmt = $pdo->prepare("
                            UPDATE tasks SET 
                                is_completed = ?,
                                completed_at = ?
                            WHERE id = ?
                        ");
                        $stmt->execute([
                            $isCompleted ? 1 : 0,
                            $completedAt,
                            $id
                        ]);

                        $action = $isCompleted ? 'completed' : 'uncompleted';
                        sendResponse(['success' => true, 'message' => "Task {$action} successfully"]);
                    }

                    validateRequired($data, ['title']);

                    $stmt = $pdo->prepare("
                        UPDATE tasks SET 
                            title = ?, 
                            description = ?, 
                            stage_id = ?, 
                            user_id = ?, 
                            client_id = ?, 
                            priority = ?, 
                            start_date = ?,
                            due_date = ?,
                            due_time = ?,
                            card_color = ?
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $data['title'],
                        $data['description'] ?? '',
                        $data['stage_id'] ?? null,
                        $data['user_id'] ?? null,
                        $data['client_id'] ?? null,
                        $data['priority'] ?? 'medium',
                        $data['start_date'] ?? null,
                        $data['due_date'] ?? null,
                        $data['due_time'] ?? null,
                        $data['card_color'] ?? '#1a202c',
                        $id
                    ]);
                    sendResponse(['success' => true, 'message' => 'Task updated successfully']);
                }
                break;
            case 'DELETE':
                if (!$id) {
                    sendResponse(['error' => 'Task ID required'], 400);
                }

                $stmt = $pdo->prepare("SELECT board_id FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
                $task = $stmt->fetch();

                if (!$task) {
                    sendResponse(['error' => 'Task not found'], 404);
                }

                $stmt = $pdo->prepare("
                    SELECT b.*, 
                           CASE WHEN b.created_by = ? THEN 'owner' 
                                WHEN bs.user_id = ? THEN 'shared' 
                                WHEN b.created_by IS NULL THEN 'owner' 
                                ELSE 'none' END as access_type
                    FROM boards b
                    LEFT JOIN board_shares bs ON b.id = bs.board_id
                    WHERE b.id = ? AND (b.created_by = ? OR bs.user_id = ? OR b.created_by IS NULL)
                ");
                $stmt->execute([$_SESSION['user_id'], $_SESSION['user_id'], $task['board_id'], $_SESSION['user_id'], $_SESSION['user_id']]);
                $board = $stmt->fetch();

                if (!$board) {
                    sendResponse(['error' => 'Access denied to this task'], 403);
                }

                $pdo->prepare("DELETE FROM task_notes WHERE task_id = ?")->execute([$id]);
                $pdo->prepare("DELETE FROM checklist_items WHERE task_id = ?")->execute([$id]);
                $pdo->prepare("DELETE FROM attachments WHERE task_id = ?")->execute([$id]);

                $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
                $stmt->execute([$id]);
                sendResponse(['success' => true, 'message' => 'Task deleted successfully']);
                break;
            default:
                sendResponse(['error' => 'Method not allowed'], 405);
        }
    } catch (Exception $e) {

        sendResponse(['error' => 'Internal server error: ' . $e->getMessage()], 500);
    }
}

function handleUsers($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM users ORDER BY name");
            sendResponse($stmt->fetchAll());
            break;
        case 'POST':
            $data = getRequestBody();
            validateRequired($data, ['name', 'email']);

            try {
                $stmt = $pdo->prepare("INSERT INTO users (name, email) VALUES (?, ?)");
                $stmt->execute([$data['name'], $data['email']]);
                $newId = $pdo->lastInsertId();
                sendResponse(['id' => $newId, 'success' => true, 'message' => 'User created successfully']);
            } catch (PDOException $e) {
                if ($e->getCode() == 23000) {
                    sendResponse(['error' => 'Email already exists'], 400);
                }
                throw $e;
            }
            break;
        case 'DELETE':
            if (!$id) {
                sendResponse(['error' => 'User ID required'], 400);
            }
            $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(['success' => true, 'message' => 'User deleted successfully']);
            break;
    }
}

function handleClients($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("SELECT * FROM clients WHERE id = ?");
                $stmt->execute([$id]);
                $client = $stmt->fetch();
                if (!$client) {
                    sendResponse(['error' => 'Client not found'], 404);
                }
                sendResponse($client);
            } else {
                $stmt = $pdo->query("SELECT * FROM clients ORDER BY name");
                sendResponse($stmt->fetchAll());
            }
            break;
        case 'POST':
            $data = getRequestBody();
            validateRequired($data, ['name', 'email']);

            try {
                $stmt = $pdo->prepare("INSERT INTO clients (name, contact_name, contact_number, email, url) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['name'],
                    $data['contact_name'] ?? null,
                    $data['contact_number'] ?? null,
                    $data['email'],
                    $data['url'] ?? null
                ]);
                $newId = $pdo->lastInsertId();
                sendResponse(['id' => $newId, 'success' => true, 'message' => 'Client created successfully']);
            } catch (PDOException $e) {
                if ($e->getCode() == 23000) {
                    sendResponse(['error' => 'Email already exists'], 400);
                }
                throw $e;
            }
            break;
        case 'PUT':
            if (!$id) {
                sendResponse(['error' => 'Client ID required'], 400);
            }
            $data = getRequestBody();
            validateRequired($data, ['name', 'email']);

            try {
                $stmt = $pdo->prepare("UPDATE clients SET name = ?, contact_name = ?, contact_number = ?, email = ?, url = ? WHERE id = ?");
                $stmt->execute([
                    $data['name'],
                    $data['contact_name'] ?? null,
                    $data['contact_number'] ?? null,
                    $data['email'],
                    $data['url'] ?? null,
                    $id
                ]);
                sendResponse(['success' => true, 'message' => 'Client updated successfully']);
            } catch (PDOException $e) {
                if ($e->getCode() == 23000) {
                    sendResponse(['error' => 'Email already exists'], 400);
                }
                throw $e;
            }
            break;
        case 'DELETE':
            if (!$id) {
                sendResponse(['error' => 'Client ID required'], 400);
            }
            $stmt = $pdo->prepare("DELETE FROM clients WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(['success' => true, 'message' => 'Client deleted successfully']);
            break;
    }
}

function handleBoards($pdo, $method, $id) {
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS boards (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            description TEXT,
            color VARCHAR(7) DEFAULT '#3498db',
            icon VARCHAR(100) DEFAULT 'fas fa-tasks',
            is_active BOOLEAN DEFAULT TRUE,
            created_by INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )");

        $pdo->exec("CREATE TABLE IF NOT EXISTS board_shares (
            id INT AUTO_INCREMENT PRIMARY KEY,
            board_id INT NOT NULL,
            user_id INT NOT NULL,
            shared_by INT NOT NULL,
            shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_board_user (board_id, user_id),
            FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE
        )");

        $pdo->exec("CREATE TABLE IF NOT EXISTS task_shares (
            id INT AUTO_INCREMENT PRIMARY KEY,
            task_id INT NOT NULL,
            user_id INT NOT NULL,
            shared_by INT NOT NULL,
            shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_task_user (task_id, user_id),
            FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE
        )");

        try {
            $pdo->exec("ALTER TABLE boards ADD COLUMN created_by INT");
            $pdo->exec("ALTER TABLE boards ADD CONSTRAINT fk_boards_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL");
        } catch (PDOException $e) {
        }

        switch ($method) {
            case 'GET':
                if ($id) {
                    $stmt = $pdo->prepare("SELECT * FROM boards WHERE id = ?");
                    $stmt->execute([$id]);
                    $board = $stmt->fetch();
                    if (!$board) {
                        sendResponse(['error' => 'Board not found'], 404);
                    }
                    sendResponse($board);
                } else {
                    $stmt = $pdo->prepare("
                        SELECT DISTINCT b.*, 
                               CASE WHEN b.created_by = ? THEN 'owner' 
                                    WHEN bs.user_id = ? THEN 'shared' 
                                    WHEN b.created_by IS NULL THEN 'owner' 
                                    ELSE 'owner' END as access_type
                        FROM boards b
                        LEFT JOIN board_shares bs ON b.id = bs.board_id
                        WHERE b.created_by = ? OR bs.user_id = ? OR b.created_by IS NULL
                        ORDER BY b.name
                    ");
                    $stmt->execute([$_SESSION['user_id'], $_SESSION['user_id'], $_SESSION['user_id'], $_SESSION['user_id']]);
                    sendResponse($stmt->fetchAll());
                }
                break;
            case 'POST':
                $data = getRequestBody();
                validateRequired($data, ['name']);

                try {
                    $stmt = $pdo->prepare("INSERT INTO boards (name, description, color, icon, is_active, created_by) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmt->execute([
                        $data['name'], 
                        $data['description'] ?? null,
                        $data['color'] ?? '#3498db',
                        $data['icon'] ?? 'fas fa-tasks',
                        $data['is_active'] ?? true,
                        $_SESSION['user_id']
                    ]);
                    $newId = $pdo->lastInsertId();

                    $stmt = $pdo->prepare("SELECT * FROM boards WHERE id = ?");
                    $stmt->execute([$newId]);
                    $board = $stmt->fetch();
                    sendResponse($board);
                } catch (PDOException $e) {
                    if ($e->getCode() == 23000) {
                        $stmt = $pdo->query("SELECT name FROM boards ORDER BY name");
                        $existingBoards = $stmt->fetchAll(PDO::FETCH_COLUMN);

                        $suggestions = [];
                        $baseName = $data['name'];
                        $counter = 1;

                        while (count($suggestions) < 3) {
                            $suggestion = $baseName . ' (' . $counter . ')';
                            if (!in_array($suggestion, $existingBoards)) {
                                $suggestions[] = $suggestion;
                            }
                            $counter++;
                        }

                        sendResponse([
                            'error' => 'Board name already exists',
                            'suggestions' => $suggestions,
                            'existing_boards' => $existingBoards
                        ], 400);
                    }
                    throw $e;
                }
                break;
            case 'PUT':
                if (!$id) {
                    sendResponse(['error' => 'Board ID required'], 400);
                }
                $data = getRequestBody();
                validateRequired($data, ['name']);

                $stmt = $pdo->prepare("SELECT id FROM boards WHERE name = ? AND id != ?");
                $stmt->execute([$data['name'], $id]);
                if ($stmt->fetch()) {
                    sendResponse(['error' => 'Board name already exists'], 400);
                }

                try {
                    $stmt = $pdo->prepare("UPDATE boards SET name = ?, description = ?, color = ?, icon = ?, is_active = ? WHERE id = ?");
                    $stmt->execute([
                        $data['name'], 
                        $data['description'] ?? null,
                        $data['color'] ?? '#3498db',
                        $data['icon'] ?? 'fas fa-tasks',
                        $data['is_active'] ?? true,
                        $id
                    ]);
                    sendResponse(['success' => true, 'message' => 'Board updated successfully']);
                } catch (PDOException $e) {
                    if ($e->getCode() == 23000) {
                        sendResponse(['error' => 'Board name already exists'], 400);
                    }
                    throw $e;
                }
                break;
            case 'DELETE':
                if (!$id) {
                    sendResponse(['error' => 'Board ID required'], 400);
                }
                $stmt = $pdo->prepare("DELETE FROM boards WHERE id = ?");
                $stmt->execute([$id]);
                sendResponse(['success' => true, 'message' => 'Board deleted successfully']);
                break;
            default:
                sendResponse(['error' => 'Method not allowed'], 405);
        }
    } catch (Exception $e) {

        sendResponse(['error' => 'Internal server error: ' . $e->getMessage()], 500);
    }
}

function handleNotes($pdo, $method, $id) {
    global $emailNotifications;

    switch ($method) {
        case 'GET':
            if (!$id) {
                sendResponse(['error' => 'Task ID required'], 400);
            }

            $stmt = $pdo->prepare("
                SELECT tn.*, u.name as user_name, u.email as user_email
                FROM task_notes tn
                LEFT JOIN users u ON tn.user_id = u.id
                WHERE tn.task_id = ?
                ORDER BY tn.created_at ASC
            ");
            $stmt->execute([$id]);
            sendResponse($stmt->fetchAll());
            break;
        case 'POST':
            $data = getRequestBody();
            validateRequired($data, ['task_id', 'note_text']);

            $stmt = $pdo->prepare("INSERT INTO task_notes (task_id, user_id, note_text, note_type) VALUES (?, ?, ?, ?)");
            $stmt->execute([$data['task_id'], $_SESSION['user_id'], $data['note_text'], $data['note_type'] ?? 'call']);

            $noteId = $pdo->lastInsertId();

            $stmt = $pdo->prepare("
                SELECT tn.*, u.name as user_name, u.email as user_email
                FROM task_notes tn
                LEFT JOIN users u ON tn.user_id = u.id
                WHERE tn.id = ?
            ");
            $stmt->execute([$noteId]);
            $note = $stmt->fetch();

            $taskOwner = $emailNotifications->getTaskOwnerEmail($data['task_id']);

            error_log("Note notification debug - Task ID: " . $data['task_id']);
            error_log("Task owner: " . ($taskOwner ? json_encode($taskOwner) : 'null'));
            error_log("Current user ID: " . $_SESSION['user_id']);

            $stmt = $pdo->prepare("SELECT title FROM tasks WHERE id = ?");
            $stmt->execute([$data['task_id']]);
            $task = $stmt->fetch();

            $currentUser = $emailNotifications->getUserEmail($_SESSION['user_id']);

            if ($taskOwner && $taskOwner['email'] && $taskOwner['id'] != $_SESSION['user_id']) {
                error_log("Sending note notification to task owner: " . $taskOwner['email']);

                $result = $emailNotifications->sendNoteUpdateNotification(
                    $taskOwner['email'],
                    $taskOwner['name'],
                    $currentUser['name'],
                    $currentUser['email'],
                    $task['title'] ?? 'Task',
                    $data['note_text']
                );

                error_log("Task owner notification result: " . ($result ? 'success' : 'failed'));
            }

            $stmt = $pdo->prepare("
                SELECT u.email, u.name 
                FROM task_shares ts 
                JOIN users u ON ts.user_id = u.id 
                WHERE ts.task_id = ? AND u.id != ?
            ");
            $stmt->execute([$data['task_id'], $_SESSION['user_id']]);
            $sharedUsers = $stmt->fetchAll();

            error_log("Shared users count: " . count($sharedUsers));

            foreach ($sharedUsers as $sharedUser) {
                error_log("Sending note notification to shared user: " . $sharedUser['email']);

                $result = $emailNotifications->sendNoteUpdateNotification(
                    $sharedUser['email'],
                    $sharedUser['name'],
                    $currentUser['name'],
                    $currentUser['email'],
                    $task['title'] ?? 'Task',
                    $data['note_text']
                );

                error_log("Shared user notification result: " . ($result ? 'success' : 'failed'));
            }

            $stmt = $pdo->prepare("
                SELECT DISTINCT u.email, u.name 
                FROM task_shares ts 
                JOIN users u ON ts.shared_by = u.id 
                WHERE ts.task_id = ? AND ts.shared_by != ?
            ");
            $stmt->execute([$data['task_id'], $_SESSION['user_id']]);
            $sharers = $stmt->fetchAll();

            error_log("Task sharers count: " . count($sharers));

            foreach ($sharers as $sharer) {
                error_log("Sending note notification to task sharer: " . $sharer['email']);

                $result = $emailNotifications->sendNoteUpdateNotification(
                    $sharer['email'],
                    $sharer['name'],
                    $currentUser['name'],
                    $currentUser['email'],
                    $task['title'] ?? 'Task',
                    $data['note_text']
                );

                error_log("Task sharer notification result: " . ($result ? 'success' : 'failed'));
            }

            if (!$taskOwner && empty($sharedUsers)) {
                error_log("Note notification skipped - no task owner and no shared users");
            }

            sendResponse($note);
            break;
        case 'DELETE':
            if (!$id) {
                sendResponse(['error' => 'Note ID required'], 400);
            }

            $stmt = $pdo->prepare("SELECT user_id FROM task_notes WHERE id = ?");
            $stmt->execute([$id]);
            $note = $stmt->fetch();

            if (!$note) {
                sendResponse(['error' => 'Note not found'], 404);
            }

            if ($note['user_id'] != $_SESSION['user_id'] && !$_SESSION['is_admin']) {
                sendResponse(['error' => 'Unauthorized'], 403);
            }

            $stmt = $pdo->prepare("DELETE FROM task_notes WHERE id = ?");
            $stmt->execute([$id]);

            sendResponse(['success' => true, 'message' => 'Note deleted successfully']);
            break;
    }
}

function handleNotifications($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("
                    SELECT n.*, t.title as task_title, u.name as user_name 
                    FROM notifications n 
                    LEFT JOIN tasks t ON n.task_id = t.id 
                    LEFT JOIN users u ON n.user_id = u.id 
                    WHERE n.id = ? AND n.user_id = ?
                ");
                $stmt->execute([$id, $_SESSION['user_id']]);
                $notification = $stmt->fetch();

                if (!$notification) {
                    sendResponse(['error' => 'Notification not found'], 404);
                }

                sendResponse($notification);
            } else {
                $stmt = $pdo->prepare("
                    SELECT n.*, t.title as task_title, u.name as user_name 
                    FROM notifications n 
                    LEFT JOIN tasks t ON n.task_id = t.id 
                    LEFT JOIN users u ON n.user_id = u.id 
                    WHERE n.user_id = ? 
                    ORDER BY n.created_at DESC
                ");
                $stmt->execute([$_SESSION['user_id']]);
                $notifications = $stmt->fetchAll();
                sendResponse($notifications);
            }
            break;

        case 'PUT':
            if (!$id) {
                sendResponse(['error' => 'Notification ID required'], 400);
            }

            $data = getRequestBody();

            if (isset($data['is_read'])) {
                $stmt = $pdo->prepare("UPDATE notifications SET is_read = ? WHERE id = ? AND user_id = ?");
                $stmt->execute([(int)$data['is_read'], $id, $_SESSION['user_id']]);
                sendResponse(['success' => true]);
            }

            sendResponse(['error' => 'Invalid update'], 400);
            break;

        case 'DELETE':
            if (!$id) {
                sendResponse(['error' => 'Notification ID required'], 400);
            }

            $stmt = $pdo->prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?");
            $stmt->execute([$id, $_SESSION['user_id']]);
            sendResponse(['success' => true]);
            break;

        default:
            sendResponse(['error' => 'Method not allowed'], 405);
    }
}

function handleAttachments($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if (!$id) {
                sendResponse(['error' => 'Task ID required'], 400);
            }

            $stmt = $pdo->prepare("
                SELECT id, filename, original_name, file_size, mime_type, created_at
                FROM attachments 
                WHERE task_id = ?
                ORDER BY created_at DESC
            ");
            $stmt->execute([$id]);
            $attachments = $stmt->fetchAll();

            sendResponse($attachments);
            break;

        case 'POST':
            if (!isset($_FILES['file']) || !isset($_POST['task_id'])) {
                sendResponse(['error' => 'File and task_id required'], 400);
            }

            $taskId = $_POST['task_id'];
            $file = $_FILES['file'];

            if ($file['error'] !== UPLOAD_ERR_OK) {
                sendResponse(['error' => 'File upload failed'], 400);
            }

            // File upload security validation
            $allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'csv', 'xls', 'xlsx'];
            $maxFileSize = 10 * 1024 * 1024; // 10MB
            $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            
            // Validate file type
            if (!in_array($extension, $allowedTypes)) {
                sendResponse(['error' => 'Invalid file type. Allowed types: ' . implode(', ', $allowedTypes)], 400);
            }
            
            // Validate file size
            if ($file['size'] > $maxFileSize) {
                sendResponse(['error' => 'File too large. Maximum size: 10MB'], 400);
            }
            
            // Validate MIME type
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mimeType = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);
            
            $allowedMimeTypes = [
                'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
                'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'text/plain', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ];
            
            if (!in_array($mimeType, $allowedMimeTypes)) {
                sendResponse(['error' => 'Invalid file MIME type'], 400);
            }
            
            $filename = uniqid() . '.' . $extension;
            $uploadPath = 'uploads/' . $filename;

            if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
                $stmt = $pdo->prepare("
                    INSERT INTO attachments (task_id, filename, original_name, file_size, mime_type) 
                    VALUES (?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $taskId,
                    $filename,
                    $file['name'],
                    $file['size'],
                    $file['type']
                ]);

                $attachmentId = $pdo->lastInsertId();
                sendResponse([
                    'id' => $attachmentId,
                    'filename' => $filename,
                    'original_name' => $file['name'],
                    'success' => true
                ]);
            } else {
                sendResponse(['error' => 'Failed to save file'], 500);
            }
            break;
        case 'DELETE':
            if (!$id) {
                sendResponse(['error' => 'Attachment ID required'], 400);
            }

            $stmt = $pdo->prepare("SELECT filename FROM attachments WHERE id = ?");
            $stmt->execute([$id]);
            $attachment = $stmt->fetch();

            if ($attachment) {
                $filePath = 'uploads/' . $attachment['filename'];
                if (file_exists($filePath)) {
                    unlink($filePath);
                }

                $stmt = $pdo->prepare("DELETE FROM attachments WHERE id = ?");
                $stmt->execute([$id]);
            }

            sendResponse(['success' => true, 'message' => 'Attachment deleted successfully']);
            break;
    }
}

function handleChecklist($pdo, $method, $id) {
    switch ($method) {
        case 'POST':
            $data = getRequestBody();
            validateRequired($data, ['task_id', 'text']);

            try {
                $stmt = $pdo->prepare("INSERT INTO checklist_items (task_id, text, is_completed) VALUES (?, ?, ?)");
                $isCompleted = isset($data['is_completed']) ? (int)$data['is_completed'] : 0;
                $stmt->execute([$data['task_id'], $data['text'], $isCompleted]);
                $newId = $pdo->lastInsertId();

                sendResponse(['success' => true, 'id' => $newId, 'message' => 'Checklist item added successfully']);
            } catch (Exception $e) {
                sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
            }
            break;

        case 'PUT':
            if (!$id) {
                sendResponse(['error' => 'Checklist item ID required'], 400);
            }
            $data = getRequestBody();

            $isCompleted = isset($data['is_completed']) ? (int)$data['is_completed'] : 0;
            $stmt = $pdo->prepare("UPDATE checklist_items SET is_completed = ? WHERE id = ?");
            $stmt->execute([$isCompleted, $id]);
            sendResponse(['success' => true, 'message' => 'Checklist item updated successfully']);
            break;

        case 'DELETE':
            if (!$id) {
                sendResponse(['error' => 'Checklist item ID required'], 400);
            }

            $stmt = $pdo->prepare("DELETE FROM checklist_items WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(['success' => true, 'message' => 'Checklist item deleted successfully']);
            break;
    }
}

function handleTaskChecklist($pdo, $method, $taskId) {
    if ($method === 'GET' && $taskId) {
        try {
            $stmt = $pdo->prepare("
                SELECT cl.* 
                FROM checklist_items cl
                JOIN tasks t ON cl.task_id = t.id
                JOIN boards b ON t.board_id = b.id
                LEFT JOIN board_shares bs ON b.id = bs.board_id
                WHERE cl.task_id = ? 
                AND (b.created_by = ? OR bs.user_id = ? OR b.created_by IS NULL)
                ORDER BY cl.id
            ");
            $stmt->execute([$taskId, $_SESSION['user_id'], $_SESSION['user_id']]);
            $checklist = $stmt->fetchAll();

            sendResponse(['checklist' => $checklist]);
        } catch (Exception $e) {
            sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }
    } else {
        sendResponse(['error' => 'Invalid request'], 400);
    }
}

function handleBoard($pdo, $method) {
    try {
        if ($method !== 'GET') {
            sendResponse(['error' => 'Method not allowed'], 405);
        }

        $boardId = $_GET['board_id'] ?? null;
        $lastUpdate = $_GET['last_update'] ?? null;

        if (isset($_GET['last_update'])) {
            if (!$boardId) {
                sendResponse(['error' => 'Board ID required'], 400);
            }

            $hasUpdates = false;

            if ($lastUpdate && $lastUpdate !== 'null') {
                try {
                    $lastUpdateTime = new DateTime($lastUpdate);

                    $stmt = $pdo->prepare("
                        SELECT COUNT(*) as count FROM tasks 
                        WHERE board_id = ? AND (updated_at > ? OR created_at > ?)
                    ");
                    $stmt->execute([$boardId, $lastUpdate, $lastUpdate]);
                    $taskUpdates = $stmt->fetch()['count'] > 0;

                    $stmt = $pdo->prepare("
                        SELECT COUNT(*) as count FROM stages 
                        WHERE board_id = ? AND (updated_at > ? OR created_at > ?)
                    ");
                    $stmt->execute([$boardId, $lastUpdate, $lastUpdate]);
                    $stageUpdates = $stmt->fetch()['count'] > 0;

                    $hasUpdates = $taskUpdates || $stageUpdates;
                } catch (Exception $e) {
                    $hasUpdates = true;
                }
            } else {
                $hasUpdates = true;
            }

            sendResponse([
                'has_updates' => $hasUpdates,
                'success' => true
            ]);
            return;
        }

        if (!$boardId) {
            sendResponse(['error' => 'Board ID required'], 400);
        }

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

        $stmt = $pdo->query("SHOW COLUMNS FROM stages LIKE 'board_id'");
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE stages ADD COLUMN board_id INT DEFAULT 1");
            $pdo->exec("UPDATE stages SET board_id = 1 WHERE board_id IS NULL");
        }

        $stmt = $pdo->query("SHOW COLUMNS FROM tasks LIKE 'board_id'");
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE tasks ADD COLUMN board_id INT DEFAULT 1");
            $pdo->exec("UPDATE tasks SET board_id = 1 WHERE board_id IS NULL");
        }

        $stmt = $pdo->query("SHOW COLUMNS FROM tasks LIKE 'created_by'");
        if ($stmt->rowCount() == 0) {
            $pdo->exec("ALTER TABLE tasks ADD COLUMN created_by INT");
            $pdo->exec("UPDATE tasks SET created_by = user_id WHERE created_by IS NULL");
        }

        $stmt = $pdo->query("SELECT * FROM companies LIMIT 1");
        $company = $stmt->fetch();

        $stmt = $pdo->prepare("SELECT * FROM boards WHERE id = ?");
        $stmt->execute([$boardId]);
        $board = $stmt->fetch();

        if (!$board) {
            sendResponse(['error' => 'Board not found'], 404);
        }

        $stmt = $pdo->prepare("SELECT * FROM stages WHERE board_id = ? ORDER BY position");
        $stmt->execute([$boardId]);
        $stages = $stmt->fetchAll();

        $currentUser = getCurrentUser();
        $stmt = $pdo->prepare("
            SELECT b.*, 
                   CASE WHEN b.created_by = ? THEN 'owner' 
                        WHEN bs.user_id = ? THEN 'shared' 
                        WHEN b.created_by IS NULL THEN 'owner' 
                        ELSE 'none' END as access_type
            FROM boards b
            LEFT JOIN board_shares bs ON b.id = bs.board_id
            WHERE b.id = ? AND (b.created_by = ? OR bs.user_id = ? OR b.created_by IS NULL)
        ");
        $stmt->execute([$currentUser['id'], $currentUser['id'], $boardId, $currentUser['id'], $currentUser['id']]);
        $boardAccess = $stmt->fetch();

        if (!$boardAccess) {
            sendResponse(['error' => 'Access denied to this board'], 403);
        }

        $stmt = $pdo->prepare("
            SELECT t.*, u.name as user_name, c.name as client_name,
                   COUNT(DISTINCT a.id) as attachment_count,
                   COUNT(DISTINCT cl.id) as checklist_total,
                   COUNT(DISTINCT CASE WHEN cl.is_completed = 1 THEN cl.id END) as checklist_completed
            FROM tasks t
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN clients c ON t.client_id = c.id
            LEFT JOIN attachments a ON t.id = a.task_id
            LEFT JOIN checklist_items cl ON t.id = cl.task_id
            WHERE t.board_id = ?
            GROUP BY t.id
            ORDER BY t.stage_id, t.position
        ");
        $stmt->execute([$boardId]);
        $tasks = $stmt->fetchAll();

        $stmt = $pdo->query("SELECT * FROM users ORDER BY name");
        $users = $stmt->fetchAll();

        $stmt = $pdo->query("SELECT * FROM clients ORDER BY name");
        $clients = $stmt->fetchAll();

        sendResponse([
            'company' => $company,
            'board' => $board,
            'stages' => $stages,
            'tasks' => $tasks,
            'users' => $users,
            'clients' => $clients
        ]);
    } catch (Exception $e) {

        sendResponse(['error' => 'Internal server error: ' . $e->getMessage()], 500);
    }
}

function handleClientTasks($pdo, $method, $id) {
    if ($method === 'GET' && $id) {
        $stmt = $pdo->prepare("
            SELECT t.*, u.name as user_name, c.name as client_name,
                   COUNT(DISTINCT a.id) as attachment_count,
                   COUNT(DISTINCT cl.id) as checklist_total,
                   COUNT(DISTINCT CASE WHEN cl.is_completed = 1 THEN cl.id END) as checklist_completed
            FROM tasks t
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN clients c ON t.client_id = c.id
            LEFT JOIN attachments a ON t.id = a.task_id
            LEFT JOIN checklist_items cl ON t.id = cl.task_id
            WHERE t.client_id = ?
            GROUP BY t.id
            ORDER BY t.stage_id, t.position
        ");
        $stmt->execute([$id]);
        $tasks = $stmt->fetchAll();

        sendResponse(['tasks' => $tasks]);
    } else {
        sendResponse(['error' => 'Invalid request'], 400);
    }
}

function handleDueTasks($pdo, $method) {
    if ($method === 'GET') {
        $stmt = $pdo->query("
            SELECT t.*, u.name as user_name, c.name as client_name
            FROM tasks t
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN clients c ON t.client_id = c.id
            WHERE t.due_date IS NOT NULL 
            AND t.due_date <= DATE_ADD(CURDATE(), INTERVAL 1 DAY)
            AND (t.is_completed IS NULL OR t.is_completed = 0)
            ORDER BY t.due_date ASC
        ");
        $tasks = $stmt->fetchAll();

        sendResponse(['tasks' => $tasks]);
    } else {
        sendResponse(['error' => 'Invalid request'], 400);
    }
}

function handleSearch($pdo, $method, $id) {
    if ($method !== 'GET') {
        sendResponse(['error' => 'Method not allowed'], 405);
    }

    $query = $_GET['query'] ?? '';
    if (empty($query)) {
        sendResponse(['error' => 'Search query required'], 400);
    }

    $searchTerm = '%' . $query . '%';
    $results = [];

    $taskSql = "SELECT t.*, s.name as stage_name, u.name as user_name, c.name as client_name 
                FROM tasks t 
                LEFT JOIN stages s ON t.stage_id = s.id 
                LEFT JOIN users u ON t.user_id = u.id 
                LEFT JOIN clients c ON t.client_id = c.id 
                WHERE t.title LIKE ? OR t.description LIKE ? 
                ORDER BY t.created_at DESC 
                LIMIT 20";

    $stmt = $pdo->prepare($taskSql);
    $stmt->execute([$searchTerm, $searchTerm]);
    $results['tasks'] = $stmt->fetchAll();

    $clientSql = "SELECT c.*, COUNT(t.id) as task_count 
                  FROM clients c 
                  LEFT JOIN tasks t ON c.id = t.client_id 
                  WHERE c.name LIKE ? OR c.contact_name LIKE ? OR c.email LIKE ? 
                  GROUP BY c.id 
                  ORDER BY c.name 
                  LIMIT 10";

    $stmt = $pdo->prepare($clientSql);
    $stmt->execute([$searchTerm, $searchTerm, $searchTerm]);
    $results['clients'] = $stmt->fetchAll();

    $projectSql = "SELECT 
                      c.name as project_name,
                      c.id as client_id,
                      COUNT(t.id) as task_count,
                      MIN(t.due_date) as earliest_due,
                      MAX(t.due_date) as latest_due,
                      GROUP_CONCAT(DISTINCT t.title SEPARATOR '|') as task_titles
                    FROM clients c 
                    LEFT JOIN tasks t ON c.id = t.client_id 
                    WHERE c.name LIKE ? 
                    GROUP BY c.id 
                    HAVING task_count > 0 
                    ORDER BY task_count DESC 
                    LIMIT 10";

    $stmt = $pdo->prepare($projectSql);
    $stmt->execute([$searchTerm]);
    $results['projects'] = $stmt->fetchAll();

    sendResponse($results);
}

function handleDueNotifications($pdo, $method) {
    if ($method !== 'POST') {
        sendResponse(['error' => 'Method not allowed'], 405);
    }

    try {
        $today = date('Y-m-d');

        $stmt = $pdo->prepare("
            SELECT t.*, u.name as user_name, u.email as user_email, c.name as client_name
            FROM tasks t
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN clients c ON t.client_id = c.id
            WHERE t.due_date IS NOT NULL 
            AND t.user_id IS NOT NULL
            AND (t.due_date <= ? OR t.due_date <= DATE_ADD(?, INTERVAL 7 DAY))
            AND (t.is_completed IS NULL OR t.is_completed = 0)
            ORDER BY t.due_date ASC
        ");
        $stmt->execute([$today, $today]);
        $dueTasks = $stmt->fetchAll();

        foreach ($dueTasks as $task) {
            $status = ($task['due_date'] < $today) ? 'OVERDUE' : 'UPCOMING';

        }

        if (empty($dueTasks)) {
            sendResponse(['message' => 'No overdue or upcoming tasks found', 'sent' => 0, 'total_users' => 0, 'debug' => 'No tasks found that are overdue or due within 7 days']);
            return;
        }

        $userTasks = [];
        foreach ($dueTasks as $task) {
            $userId = $task['user_id'];
            if (!isset($userTasks[$userId])) {
                $userTasks[$userId] = [
                    'user_name' => $task['user_name'] ?? 'Unknown User',
                    'user_email' => $task['user_email'] ?? 'unknown@example.com',
                    'tasks' => []
                ];
            }
            $userTasks[$userId]['tasks'][] = $task;
        }

        foreach ($userTasks as $userId => $userData) {
        }

        $sentCount = 0;
        $failedCount = 0;
        foreach ($userTasks as $userData) {
            if (sendDueNotificationEmail($userData)) {
                $sentCount++;
            } else {
                $failedCount++;
            }
        }

        sendResponse([
            'message' => "Sent $sentCount notification emails",
            'sent' => $sentCount,
            'failed' => $failedCount,
            'total_users' => count($userTasks),
            'debug_info' => [
                'today' => $today,
                'tomorrow' => $tomorrow,
                'tasks_found' => count($dueTasks),
                'users_found' => count($userTasks)
            ]
        ]);

    } catch (Exception $e) {

        sendResponse(['error' => 'Failed to send notifications: ' . $e->getMessage()], 500);
    }
}

function sendDueNotificationEmail($userData) {

    require_once __DIR__ . '/api/env_loader.php';

    $brevoApiKey = getenv('BREVO_API_KEY');
    if (!$brevoApiKey) {
        error_log('BREVO_API_KEY environment variable not set');
        return false;
    }

    $senderEmail = 'noreply@thecache.io'; 
    $senderName = 'Task Management System';

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
        'subject' => 'Task Summary - Overdue & Upcoming Tasks',
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

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($httpCode === 201) {
        return true;
    } else {

        return false;
    }
}

function generateDueNotificationEmail($userData) {
    $today = date('Y-m-d');

    $overdueTasks = [];
    $upcomingTasks = [];

    foreach ($userData['tasks'] as $task) {
        if ($task['due_date'] < $today) {
            $overdueTasks[] = $task;
        } else {
            $upcomingTasks[] = $task;
        }
    }

    $taskCards = '';

    if (!empty($overdueTasks)) {
        $taskCards .= '
        <div style="margin-bottom: 24px;">
            <h3 style="
                color: #e53e3e;
                font-size: 20px;
                font-weight: 700;
                margin: 0 0 16px 0;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>🚨</span>
                OVERDUE TASKS (' . count($overdueTasks) . ')
            </h3>';

        foreach ($overdueTasks as $task) {
            $daysOverdue = floor((strtotime($today) - strtotime($task['due_date'])) / (60 * 60 * 24));
            $taskCards .= '
            <div class="task-card overdue" style="
                background: #fef2f2;
                border: 1px solid #fecaca;
                border-radius: 8px;
                padding: 16px;
                margin-bottom: 16px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                border-left: 4px solid #e53e3e;
            ">
                <div class="task-header" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 12px;
                ">
                    <h4 class="task-title" style="
                        margin: 0;
                        font-size: 16px;
                        font-weight: 600;
                        color: #1a202c;
                    ">' . htmlspecialchars($task['title']) . '</h4>
                    <span class="task-priority" style="
                        background: #e53e3e;
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 11px;
                        font-weight: 600;
                        text-transform: uppercase;
                    ">' . ucfirst($task['priority'] ?? 'high') . '</span>
                </div>

                ' . ($task['description'] ? '
                <div class="task-description" style="
                    color: #4a5568;
                    margin-bottom: 12px;
                    line-height: 1.5;
                    font-size: 14px;
                ">' . htmlspecialchars($task['description']) . '</div>
                ' : '') . '

                <div class="task-meta" style="
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    font-size: 13px;
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
                        color: #e53e3e;
                        font-weight: 600;
                    ">
                        <span>🚨</span>
                        Overdue by ' . $daysOverdue . ' day' . ($daysOverdue > 1 ? 's' : '') . ' (Due: ' . date('M j, Y', strtotime($task['due_date'])) . ')
                    </span>
                </div>
            </div>';
        }

        $taskCards .= '</div>';
    }

    if (!empty($upcomingTasks)) {
        $taskCards .= '
        <div style="margin-bottom: 24px;">
            <h3 style="
                color: #3182ce;
                font-size: 20px;
                font-weight: 700;
                margin: 0 0 16px 0;
                display: flex;
                align-items: center;
                gap: 8px;
            ">
                <span>📅</span>
                UPCOMING TASKS (' . count($upcomingTasks) . ')
            </h3>';

        foreach ($upcomingTasks as $task) {
            $daysUntilDue = floor((strtotime($task['due_date']) - strtotime($today)) / (60 * 60 * 24));
            $taskCards .= '
            <div class="task-card upcoming" style="
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
                    <h4 class="task-title" style="
                        margin: 0;
                        font-size: 16px;
                        font-weight: 600;
                        color: #1a202c;
                    ">' . htmlspecialchars($task['title']) . '</h4>
                    <span class="task-priority" style="
                        background: ' . getPriorityColor($task['priority'] ?? 'medium') . ';
                        color: white;
                        padding: 4px 8px;
                        border-radius: 4px;
                        font-size: 11px;
                        font-weight: 600;
                        text-transform: uppercase;
                    ">' . ucfirst($task['priority'] ?? 'medium') . '</span>
                </div>

                ' . ($task['description'] ? '
                <div class="task-description" style="
                    color: #4a5568;
                    margin-bottom: 12px;
                    line-height: 1.5;
                    font-size: 14px;
                ">' . htmlspecialchars($task['description']) . '</div>
                ' : '') . '

                <div class="task-meta" style="
                    display: flex;
                    flex-wrap: wrap;
                    gap: 12px;
                    font-size: 13px;
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
                        color: #3182ce;
                        font-weight: 600;
                    ">
                        <span>📅</span>
                        Due in ' . $daysUntilDue . ' day' . ($daysUntilDue > 1 ? 's' : '') . ' (Due: ' . date('M j, Y', strtotime($task['due_date'])) . ')
                    </span>
                </div>
            </div>';
        }

        $taskCards .= '</div>';
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
                ">📋 Task Summary Report</h1>
                <p style="
                    margin: 8px 0 0 0;
                    color: rgba(255, 255, 255, 0.9);
                    font-size: 16px;
                ">Hi ' . htmlspecialchars($userData['user_name']) . ', here are your overdue and upcoming tasks</p>
            </div>

            <div style="padding: 32px;">
                <p style="
                    margin: 0 0 24px 0;
                    color: #4a5568;
                    font-size: 16px;
                    line-height: 1.6;
                ">Please review and take action on the following tasks:</p>

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

function handleShareBoard($pdo, $method, $boardId) {
    global $emailNotifications;

    if ($method === 'GET') {
        sendResponse(['test' => 'handleShareBoard is working', 'method' => $method, 'boardId' => $boardId]);
    }

    try {
        if ($method !== 'POST') {
            sendResponse(['error' => 'Method not allowed'], 405);
        }

        if (!$boardId) {
            sendResponse(['error' => 'Board ID required'], 400);
        }

        $data = getRequestBody();
        validateRequired($data, ['user_ids']);

    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS board_shares (
            id INT AUTO_INCREMENT PRIMARY KEY,
            board_id INT NOT NULL,
            user_id INT NOT NULL,
            shared_by INT NOT NULL,
            shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_board_user (board_id, user_id),
            FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (shared_by) REFERENCES users(id) ON DELETE CASCADE
        )");
    } catch (PDOException $e) {

        sendResponse(['error' => 'Failed to initialize sharing system'], 500);
    }

    $stmt = $pdo->prepare("SELECT created_by, name FROM boards WHERE id = ?");
    $stmt->execute([$boardId]);
    $board = $stmt->fetch();

    if (!$board || ($board['created_by'] != $_SESSION['user_id'] && $board['created_by'] !== null)) {
        sendResponse(['error' => 'You can only share boards you created'], 403);
    }

    $currentUser = $emailNotifications->getUserEmail($_SESSION['user_id']);

    $userIds = $data['user_ids'];
    $sharedCount = 0;

    foreach ($userIds as $userId) {
        try {
            $stmt = $pdo->prepare("INSERT INTO board_shares (board_id, user_id, shared_by) VALUES (?, ?, ?)");
            $stmt->execute([(int)$boardId, (int)$userId, (int)$_SESSION['user_id']]);
            $sharedCount++;

            $recipient = $emailNotifications->getUserEmail($userId);
            if ($recipient && $recipient['email']) {
                $emailNotifications->sendShareNotification(
                    $recipient['email'],
                    $recipient['name'],
                    $currentUser['name'],
                    $currentUser['email'],
                    'board',
                    $board['name']
                );
            }
        } catch (PDOException $e) {

            if ($e->getCode() != 23000) {
                sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
            }
        }
    }

    sendResponse(['success' => true, 'message' => "Board shared with $sharedCount users"]);
    } catch (Exception $e) {

        sendResponse(['error' => 'Server error: ' . $e->getMessage()], 500);
    }
}

function handleShareTask($pdo, $method, $taskId) {
    global $emailNotifications;

    try {
        if ($method !== 'POST') {
            sendResponse(['error' => 'Method not allowed'], 405);
        }

        if (!$taskId) {
            sendResponse(['error' => 'Task ID required'], 400);
        }

        $data = getRequestBody();
        validateRequired($data, ['user_ids']);

    $stmt = $pdo->prepare("SELECT t.*, b.created_by as board_owner FROM tasks t 
                          JOIN boards b ON t.board_id = b.id 
                          WHERE t.id = ?");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch();

    if (!$task || ($task['user_id'] != $_SESSION['user_id'] && $task['board_owner'] != $_SESSION['user_id'])) {
        sendResponse(['error' => 'You can only share tasks you created or own'], 403);
    }

    $currentUser = $emailNotifications->getUserEmail($_SESSION['user_id']);

    $userIds = $data['user_ids'];
    $sharedCount = 0;

    foreach ($userIds as $userId) {
        try {
            $stmt = $pdo->prepare("INSERT INTO task_shares (task_id, user_id, shared_by) VALUES (?, ?, ?)");
            $stmt->execute([(int)$taskId, (int)$userId, (int)$_SESSION['user_id']]);
            $sharedCount++;

            $recipient = $emailNotifications->getUserEmail($userId);
            if ($recipient && $recipient['email']) {
                $emailNotifications->sendShareNotification(
                    $recipient['email'],
                    $recipient['name'],
                    $currentUser['name'],
                    $currentUser['email'],
                    'task',
                    $task['title']
                );
            }
        } catch (PDOException $e) {
            if ($e->getCode() != 23000) {
                throw $e;
            }
        }
    }

    sendResponse(['success' => true, 'message' => "Task shared with $sharedCount users"]);
    } catch (Exception $e) {

        sendResponse(['error' => 'Server error: ' . $e->getMessage()], 500);
    }
}

function handleUnshareBoard($pdo, $method, $boardId) {
    if ($method !== 'DELETE') {
        sendResponse(['error' => 'Method not allowed'], 405);
    }

    if (!$boardId) {
        sendResponse(['error' => 'Board ID required'], 400);
    }

    $data = getRequestBody();
    validateRequired($data, ['user_ids']);

    $stmt = $pdo->prepare("SELECT created_by FROM boards WHERE id = ?");
    $stmt->execute([$boardId]);
    $board = $stmt->fetch();

    if (!$board || ($board['created_by'] != $_SESSION['user_id'] && $board['created_by'] !== null)) {
        sendResponse(['error' => 'You can only unshare boards you created'], 403);
    }

    $userIds = $data['user_ids'];
    $stmt = $pdo->prepare("DELETE FROM board_shares WHERE board_id = ? AND user_id = ?");

    foreach ($userIds as $userId) {
        $stmt->execute([$boardId, $userId]);
    }

    sendResponse(['success' => true, 'message' => 'Board access removed']);
}

function handleUnshareTask($pdo, $method, $taskId) {
    if ($method !== 'DELETE') {
        sendResponse(['error' => 'Method not allowed'], 405);
    }

    if (!$taskId) {
        sendResponse(['error' => 'Task ID required'], 400);
    }

    $data = getRequestBody();
    validateRequired($data, ['user_ids']);

    $stmt = $pdo->prepare("SELECT t.*, b.created_by as board_owner FROM tasks t 
                          JOIN boards b ON t.board_id = b.id 
                          WHERE t.id = ?");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch();

    if (!$task || ($task['user_id'] != $_SESSION['user_id'] && $task['board_owner'] != $_SESSION['user_id'])) {
        sendResponse(['error' => 'You can only unshare tasks you created or own'], 403);
    }

    $userIds = $data['user_ids'];
    $stmt = $pdo->prepare("DELETE FROM task_shares WHERE task_id = ? AND user_id = ?");

    foreach ($userIds as $userId) {
        $stmt->execute([$taskId, $userId]);
    }

    sendResponse(['success' => true, 'message' => 'Task access removed']);
}

function handleCrmClients($pdo, $method) {
    switch ($method) {
        case 'GET':
            try {
                $status = $_GET['status'] ?? null;
                $type = $_GET['type'] ?? null;
                $search = $_GET['search'] ?? null;

                $where = [];
                $params = [];

                if ($search) {
                    $where[] = "(c.name LIKE ? OR c.email LIKE ?)";
                    $params[] = "%$search%";
                    $params[] = "%$search%";
                }

                if ($status) {
                    $where[] = "c.status = ?";
                    $params[] = $status;
                }

                if ($type) {
                    $where[] = "c.company_type = ?";
                    $params[] = $type;
                }

                $sql = "SELECT c.id, c.name, c.email, c.company_type, c.status, c.contact_name,
                               u.name as account_manager_name
                        FROM clients c
                        LEFT JOIN users u ON c.account_manager_id = u.id";

                if (!empty($where)) {
                    $sql .= " WHERE " . implode(" AND ", $where);
                }

                $sql .= " ORDER BY c.name";

                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                sendResponse($stmt->fetchAll());
            } catch (Exception $e) {
                sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
            }
            break;

        case 'POST':
            $data = getRequestBody();
            validateRequired($data, ['name', 'email']);

            $stmt = $pdo->prepare("
                INSERT INTO clients (
                    name, email, company_number, contact_name, contact_number, 
                    alternate_phone, url, address_1, address_2, city, state, 
                    zip_code, country, classification, status, company_type, 
                    company_category, account_manager_id, created_by, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['company_number'] ?? null,
                $data['contact_name'] ?? null,
                $data['contact_number'] ?? null,
                $data['alternate_phone'] ?? null,
                $data['url'] ?? null,
                $data['address_1'] ?? null,
                $data['address_2'] ?? null,
                $data['city'] ?? null,
                $data['state'] ?? null,
                $data['zip_code'] ?? null,
                $data['country'] ?? 'United States',
                $data['classification'] ?? null,
                $data['status'] ?? 'active',
                $data['company_type'] ?? 'lead',
                $data['company_category'] ?? 'Standard',
                $data['account_manager_id'] ?? null,
                getCurrentUser()['id'],
                $data['notes'] ?? null
            ]);

            $newId = $pdo->lastInsertId();
            sendResponse(['id' => $newId, 'success' => true, 'message' => 'Client created successfully']);
            break;
    }
}

function handleCrmClient($pdo, $method, $id) {
    if (!$id) {
        sendResponse(['error' => 'Client ID required'], 400);
    }

    switch ($method) {
        case 'GET':
            try {

                $stmt = $pdo->prepare("
                    SELECT c.id, c.name, c.email, c.company_type, c.status, c.company_category, 
                           c.contact_number, c.address_1, c.address_2, c.city, c.state, c.zip_code, 
                           c.country, c.classification, c.notes, c.created_at, c.updated_at,
                           c.account_manager_id, u.name as account_manager_name
                    FROM clients c 
                    LEFT JOIN users u ON c.account_manager_id = u.id
                    WHERE c.id = ?
                ");
                $stmt->execute([$id]);
                $client = $stmt->fetch();

                if (!$client) {
                    sendResponse(['error' => 'Client not found'], 404);
                }

                try {
                    $contacts = getClientContacts($pdo, $id);
                } catch (Exception $e) {
                    $contacts = [];
                }

                try {
                    $activities = getClientActivities($pdo, $id);
                } catch (Exception $e) {
                    $activities = [];
                }

                try {
                    $attachments = getClientAttachments($pdo, $id);
                } catch (Exception $e) {
                    $attachments = [];
                }

                try {
                    $todos = getClientTodos($pdo, $id);
                } catch (Exception $e) {
                    $todos = [];
                }

                try {
                    $tasks = getClientTasks($pdo, $id);
                } catch (Exception $e) {
                    $tasks = [];
                }

                $client['contacts'] = $contacts;
                $client['activities'] = $activities;
                $client['attachments'] = $attachments;
                $client['todos'] = $todos;
                $client['tasks'] = $tasks;

                sendResponse($client);
            } catch (Exception $e) {
                sendResponse(['error' => 'Error loading client: ' . $e->getMessage()], 500);
            }
            break;

        case 'PUT':
            $data = getRequestBody();
            validateRequired($data, ['name', 'email']);

            $stmt = $pdo->prepare("
                UPDATE clients SET 
                    name = ?, email = ?, company_number = ?, contact_name = ?, 
                    contact_number = ?, alternate_phone = ?, url = ?, address_1 = ?, 
                    address_2 = ?, city = ?, state = ?, zip_code = ?, country = ?, 
                    classification = ?, status = ?, company_type = ?, company_category = ?, 
                    account_manager_id = ?, notes = ?, last_activity = CURRENT_TIMESTAMP
                WHERE id = ?
            ");

            $stmt->execute([
                $data['name'],
                $data['email'],
                $data['company_number'] ?? null,
                $data['contact_name'] ?? null,
                $data['contact_number'] ?? null,
                $data['alternate_phone'] ?? null,
                $data['url'] ?? null,
                $data['address_1'] ?? null,
                $data['address_2'] ?? null,
                $data['city'] ?? null,
                $data['state'] ?? null,
                $data['zip_code'] ?? null,
                $data['country'] ?? 'United States',
                $data['classification'] ?? null,
                $data['status'] ?? 'active',
                $data['company_type'] ?? 'lead',
                $data['company_category'] ?? 'Standard',
                $data['account_manager_id'] ?? null,
                $data['notes'] ?? null,
                $id
            ]);

            sendResponse(['success' => true, 'message' => 'Client updated successfully']);
            break;

        case 'DELETE':
            $stmt = $pdo->prepare("DELETE FROM clients WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(['success' => true, 'message' => 'Client deleted successfully']);
            break;
    }
}

function handleCrmContacts($pdo, $method, $clientId) {
    switch ($method) {
        case 'GET':
            if ($clientId) {
                sendResponse(getClientContacts($pdo, $clientId));
            } else {
                sendResponse(['error' => 'Client ID required'], 400);
            }
            break;

        case 'POST':
            if (!$clientId) {
                sendResponse(['error' => 'Client ID required'], 400);
            }

            try {
                $data = getRequestBody();
                validateRequired($data, ['name']);

                $stmt = $pdo->prepare("
                    INSERT INTO client_contacts (client_id, name, email, phone, mobile_phone, position, is_primary, is_billing_contact)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");

                $stmt->execute([
                    $clientId,
                    $data['name'],
                    $data['email'] ?? null,
                    $data['phone'] ?? null,
                    $data['mobile_phone'] ?? null,
                    $data['position'] ?? null,
                    $data['is_primary'] ? 1 : 0,
                    $data['is_billing_contact'] ? 1 : 0
                ]);

                $newId = $pdo->lastInsertId();
                sendResponse(['id' => $newId, 'success' => true, 'message' => 'Contact created successfully']);
            } catch (Exception $e) {
                sendResponse(['error' => 'Failed to create contact: ' . $e->getMessage()], 500);
            }
            break;

        case 'PUT':
            $contactId = $_GET['contact_id'] ?? null;
            if (!$contactId) {
                sendResponse(['error' => 'Contact ID required'], 400);
            }

            try {
                $data = getRequestBody();
                validateRequired($data, ['name']);

                $stmt = $pdo->prepare("
                    UPDATE client_contacts 
                    SET name = ?, email = ?, phone = ?, mobile_phone = ?, position = ?, is_primary = ?, is_billing_contact = ?
                    WHERE id = ? AND client_id = ?
                ");

                $stmt->execute([
                    $data['name'],
                    $data['email'] ?? null,
                    $data['phone'] ?? null,
                    $data['mobile_phone'] ?? null,
                    $data['position'] ?? null,
                    $data['is_primary'] ? 1 : 0,
                    $data['is_billing_contact'] ? 1 : 0,
                    $contactId,
                    $clientId
                ]);

                if ($stmt->rowCount() > 0) {
                    sendResponse(['success' => true, 'message' => 'Contact updated successfully']);
                } else {
                    sendResponse(['error' => 'Contact not found or no changes made'], 404);
                }
            } catch (Exception $e) {
                sendResponse(['error' => 'Failed to update contact: ' . $e->getMessage()], 500);
            }
            break;

        case 'DELETE':
            $contactId = $_GET['contact_id'] ?? null;
            if (!$contactId) {
                sendResponse(['error' => 'Contact ID required'], 400);
            }

            try {
                $stmt = $pdo->prepare("DELETE FROM client_contacts WHERE id = ? AND client_id = ?");
                $stmt->execute([$contactId, $clientId]);

                if ($stmt->rowCount() > 0) {
                    sendResponse(['success' => true, 'message' => 'Contact deleted successfully']);
                } else {
                    sendResponse(['error' => 'Contact not found'], 404);
                }
            } catch (Exception $e) {
                sendResponse(['error' => 'Failed to delete contact: ' . $e->getMessage()], 500);
            }
            break;
    }
}

function handleCrmActivities($pdo, $method, $clientId) {
    switch ($method) {
        case 'GET':
            if ($clientId) {
                sendResponse(getClientActivities($pdo, $clientId));
            } else {
                sendResponse(['error' => 'Client ID required'], 400);
            }
            break;

        case 'POST':
            if (!$clientId) {
                sendResponse(['error' => 'Client ID required'], 400);
            }

            $data = getRequestBody();
            validateRequired($data, ['title', 'activity_type']);

            $stmt = $pdo->prepare("
                INSERT INTO client_activities (client_id, user_id, activity_type, title, description)
                VALUES (?, ?, ?, ?, ?)
            ");

            $stmt->execute([
                $clientId,
                getCurrentUser()['id'],
                $data['activity_type'],
                $data['title'],
                $data['description'] ?? null
            ]);

            $pdo->prepare("UPDATE clients SET last_activity = CURRENT_TIMESTAMP WHERE id = ?")->execute([$clientId]);

            $newId = $pdo->lastInsertId();
            sendResponse(['id' => $newId, 'success' => true, 'message' => 'Activity created successfully']);
            break;

        case 'PUT':
            $activityId = $_GET['activity_id'] ?? null;
            if (!$activityId || !$clientId) {
                sendResponse(['error' => 'Activity ID and Client ID required'], 400);
            }

            $data = getRequestBody();
            validateRequired($data, ['title']);

            $stmt = $pdo->prepare("
                UPDATE client_activities 
                SET activity_type = ?, title = ?, description = ?
                WHERE id = ? AND client_id = ?
            ");

            $stmt->execute([
                $data['activity_type'] ?? 'note',
                $data['title'],
                $data['description'] ?? null,
                $activityId,
                $clientId
            ]);

            sendResponse(['success' => true, 'message' => 'Activity updated successfully']);
            break;

        case 'DELETE':
            $activityId = $_GET['activity_id'] ?? null;
            if (!$activityId || !$clientId) {
                sendResponse(['error' => 'Activity ID and Client ID required'], 400);
            }

            $stmt = $pdo->prepare("DELETE FROM client_activities WHERE id = ? AND client_id = ?");
            $stmt->execute([$activityId, $clientId]);

            sendResponse(['success' => true, 'message' => 'Activity deleted successfully']);
            break;
    }
}

function handleCrmTodos($pdo, $method, $clientId) {
    switch ($method) {
        case 'GET':
            if ($clientId) {
                sendResponse(getClientTodos($pdo, $clientId));
            } else {
                sendResponse(['error' => 'Client ID required'], 400);
            }
            break;

        case 'POST':
            if (!$clientId) {
                sendResponse(['error' => 'Client ID required'], 400);
            }

            try {
                $data = getRequestBody();
                validateRequired($data, ['title']);

                $stmt = $pdo->prepare("
                    INSERT INTO client_todos (client_id, user_id, title, description, due_date, due_time, priority, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                ");

                $stmt->execute([
                    $clientId,
                    getCurrentUser()['id'],
                    $data['title'],
                    $data['description'] ?? null,
                    $data['due_date'] ?? null,
                    $data['due_time'] ?? null,
                    $data['priority'] ?? 'medium',
                    $data['status'] ?? 'pending'
                ]);

                $newId = $pdo->lastInsertId();
                sendResponse(['id' => $newId, 'success' => true, 'message' => 'Todo created successfully']);
            } catch (Exception $e) {
                sendResponse(['error' => 'Failed to create todo: ' . $e->getMessage()], 500);
            }
            break;

        case 'PUT':
            $todoId = $_GET['todo_id'] ?? null;
            if (!$todoId) {
                sendResponse(['error' => 'Todo ID required'], 400);
            }

            try {
                $data = getRequestBody();
                validateRequired($data, ['title']);

                $completedAt = null;
                if ($data['status'] === 'closed') {
                    $completedAt = date('Y-m-d H:i:s');
                }

                $stmt = $pdo->prepare("
                    UPDATE client_todos 
                    SET title = ?, description = ?, due_date = ?, due_time = ?, priority = ?, status = ?, is_completed = ?, completed_at = ?
                    WHERE id = ? AND client_id = ?
                ");

                $stmt->execute([
                    $data['title'],
                    $data['description'] ?? null,
                    $data['due_date'] ?? null,
                    $data['due_time'] ?? null,
                    $data['priority'] ?? 'medium',
                    $data['status'] ?? 'pending',
                    $data['is_completed'] ? 1 : 0,
                    $completedAt,
                    $todoId,
                    $clientId
                ]);

                if ($stmt->rowCount() > 0) {
                    sendResponse(['success' => true, 'message' => 'Todo updated successfully']);
                } else {
                    sendResponse(['error' => 'Todo not found or no changes made'], 404);
                }
            } catch (Exception $e) {
                sendResponse(['error' => 'Failed to update todo: ' . $e->getMessage()], 500);
            }
            break;

        case 'DELETE':
            $todoId = $_GET['todo_id'] ?? null;
            if (!$todoId) {
                sendResponse(['error' => 'Todo ID required'], 400);
            }

            try {
                $stmt = $pdo->prepare("DELETE FROM client_todos WHERE id = ? AND client_id = ?");
                $stmt->execute([$todoId, $clientId]);

                if ($stmt->rowCount() > 0) {
                    sendResponse(['success' => true, 'message' => 'Todo deleted successfully']);
                } else {
                    sendResponse(['error' => 'Todo not found'], 404);
                }
            } catch (Exception $e) {
                sendResponse(['error' => 'Failed to delete todo: ' . $e->getMessage()], 500);
            }
            break;
    }
}

function handleCrmAttachments($pdo, $method, $clientId) {
    switch ($method) {
        case 'GET':
            if ($clientId) {
                sendResponse(getClientAttachments($pdo, $clientId));
            } else {
                sendResponse(['error' => 'Client ID required'], 400);
            }
            break;

        case 'POST':
            if (!$clientId) {
                sendResponse(['error' => 'Client ID required'], 400);
            }

            try {

                if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                    sendResponse(['error' => 'File upload failed'], 400);
                }

                $file = $_FILES['file'];
                $title = $_POST['title'] ?? '';
                $description = $_POST['description'] ?? '';

                if (empty($title)) {
                    sendResponse(['error' => 'Title is required'], 400);
                }

                if ($file['size'] > 10 * 1024 * 1024) {
                    sendResponse(['error' => 'File size must be less than 10MB'], 400);
                }

                $allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'jpg', 'jpeg', 'png', 'gif'];
                $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

                if (!in_array($fileExtension, $allowedTypes)) {
                    sendResponse(['error' => 'File type not allowed'], 400);
                }
                
                // Validate MIME type for additional security
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mimeType = finfo_file($finfo, $file['tmp_name']);
                finfo_close($finfo);
                
                $allowedMimeTypes = [
                    'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
                    'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'text/plain', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                ];
                
                if (!in_array($mimeType, $allowedMimeTypes)) {
                    sendResponse(['error' => 'Invalid file MIME type'], 400);
                }

                $stmt = $pdo->prepare("SELECT name FROM clients WHERE id = ?");
                $stmt->execute([$clientId]);
                $client = $stmt->fetch();

                if (!$client) {
                    sendResponse(['error' => 'Client not found'], 404);
                }

                $clientFolder = 'uploads/crm/' . preg_replace('/[^a-zA-Z0-9]/', '_', $client['name']);
                $uploadDir = $clientFolder;

                if (!is_dir('uploads')) {
                    mkdir('uploads', 0755, true);
                }

                if (!is_dir('uploads/crm')) {
                    mkdir('uploads/crm', 0755, true);
                }

                if (!is_dir($uploadDir)) {
                    if (!mkdir($uploadDir, 0755, true)) {
                        sendResponse(['error' => 'Failed to create upload directory'], 500);
                    }
                }

                if (!is_writable($uploadDir)) {
                    sendResponse(['error' => 'Upload directory is not writable'], 500);
                }

                $timestamp = date('Y-m-d_H-i-s');
                $safeFilename = preg_replace('/[^a-zA-Z0-9._-]/', '_', $file['name']);
                $filename = $timestamp . '_' . $safeFilename;
                $filepath = $uploadDir . '/' . $filename;

                if (!move_uploaded_file($file['tmp_name'], $filepath)) {
                    $uploadError = error_get_last();
                    sendResponse(['error' => 'Failed to save file: ' . ($uploadError['message'] ?? 'Unknown error')], 500);
                }

                $stmt = $pdo->prepare("
                    INSERT INTO client_attachments (client_id, uploaded_by, filename, original_name, file_size, mime_type, description)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                ");

                $stmt->execute([
                    $clientId,
                    getCurrentUser()['id'],
                    $filename,
                    $file['name'], 
                    $file['size'],
                    $file['type'], 
                    $description
                ]);

                $newId = $pdo->lastInsertId();
                sendResponse(['id' => $newId, 'success' => true, 'message' => 'Attachment uploaded successfully']);

            } catch (Exception $e) {
                sendResponse(['error' => 'Failed to upload attachment: ' . $e->getMessage()], 500);
            }
            break;

        case 'DELETE':
            $attachmentId = $_GET['attachment_id'] ?? null;
            if (!$attachmentId || !$clientId) {
                sendResponse(['error' => 'Attachment ID and Client ID required'], 400);
            }

            try {

                $stmt = $pdo->prepare("SELECT filename FROM client_attachments WHERE id = ? AND client_id = ?");
                $stmt->execute([$attachmentId, $clientId]);
                $attachment = $stmt->fetch();

                if (!$attachment) {
                    sendResponse(['error' => 'Attachment not found'], 404);
                }

                $stmt = $pdo->prepare("SELECT name FROM clients WHERE id = ?");
                $stmt->execute([$clientId]);
                $client = $stmt->fetch();

                if ($client) {
                    $clientFolder = 'uploads/crm/' . preg_replace('/[^a-zA-Z0-9]/', '_', $client['name']);
                    $filepath = $clientFolder . '/' . $attachment['filename'];

                    if (file_exists($filepath)) {
                        unlink($filepath);
                    }
                }

                $stmt = $pdo->prepare("DELETE FROM client_attachments WHERE id = ? AND client_id = ?");
                $stmt->execute([$attachmentId, $clientId]);

                sendResponse(['success' => true, 'message' => 'Attachment deleted successfully']);

            } catch (Exception $e) {
                sendResponse(['error' => 'Failed to delete attachment: ' . $e->getMessage()], 500);
            }
            break;
    }
}

function handleCrmGroups($pdo, $method) {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->prepare("
                SELECT g.*, u.name as created_by_name, COUNT(gm.client_id) as member_count
                FROM client_groups g
                LEFT JOIN users u ON g.created_by = u.id
                LEFT JOIN client_group_members gm ON g.id = gm.group_id
                GROUP BY g.id
                ORDER BY g.name
            ");
            $stmt->execute();
            sendResponse($stmt->fetchAll());
            break;

        case 'POST':
            $data = getRequestBody();
            validateRequired($data, ['name']);

            $stmt = $pdo->prepare("
                INSERT INTO client_groups (name, description, created_by)
                VALUES (?, ?, ?)
            ");

            $stmt->execute([
                $data['name'],
                $data['description'] ?? null,
                getCurrentUser()['id']
            ]);

            $newId = $pdo->lastInsertId();
            sendResponse(['id' => $newId, 'success' => true, 'message' => 'Group created successfully']);
            break;
    }
}

function getClientContacts($pdo, $clientId) {
    $stmt = $pdo->prepare("SELECT * FROM client_contacts WHERE client_id = ? ORDER BY is_primary DESC, name");
    $stmt->execute([$clientId]);
    return $stmt->fetchAll();
}

function getClientActivities($pdo, $clientId) {
    $stmt = $pdo->prepare("
        SELECT a.*, u.name as user_name
        FROM client_activities a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.client_id = ?
        ORDER BY a.activity_date DESC
    ");
    $stmt->execute([$clientId]);
    return $stmt->fetchAll();
}

function getClientAttachments($pdo, $clientId) {
    $stmt = $pdo->prepare("
        SELECT a.*, u.name as uploaded_by_name
        FROM client_attachments a
        LEFT JOIN users u ON a.uploaded_by = u.id
        WHERE a.client_id = ?
        ORDER BY a.created_at DESC
    ");
    $stmt->execute([$clientId]);
    return $stmt->fetchAll();
}

function getClientTodos($pdo, $clientId) {
    $stmt = $pdo->prepare("
        SELECT t.*, u.name as user_name
        FROM client_todos t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.client_id = ?
        ORDER BY t.due_date ASC, t.priority DESC
    ");
    $stmt->execute([$clientId]);
    return $stmt->fetchAll();
}

function getClientTasks($pdo, $clientId) {
    $stmt = $pdo->prepare("
        SELECT t.*, s.name as stage_name, b.name as board_name, u.name as user_name
        FROM tasks t
        LEFT JOIN stages s ON t.stage_id = s.id
        LEFT JOIN boards b ON t.board_id = b.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.client_id = ? AND t.is_completed = FALSE
        ORDER BY t.due_date ASC, t.priority DESC
    ");
    $stmt->execute([$clientId]);
    return $stmt->fetchAll();
}

function handleCrmCsvImport() {
    global $pdo;
    
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        sendResponse(['error' => 'Method not allowed'], 405);
        return;
    }

    try {
        // Debug: Log received data
        error_log('CSV Import - POST data: ' . print_r($_POST, true));
        error_log('CSV Import - FILES data: ' . print_r($_FILES, true));
        
        // Check if file was uploaded
        if (!isset($_FILES['csv_file']) || $_FILES['csv_file']['error'] !== UPLOAD_ERR_OK) {
            sendResponse(['error' => 'No CSV file uploaded or upload error'], 400);
            return;
        }

        $file = $_FILES['csv_file'];
        
        // Validate file type
        $allowedTypes = ['text/csv', 'text/plain', 'application/csv'];
        if (!in_array($file['type'], $allowedTypes) && !str_ends_with($file['name'], '.csv')) {
            sendResponse(['error' => 'Invalid file type. Please upload a CSV file.'], 400);
            return;
        }

        // Validate file size (10MB max)
        if ($file['size'] > 10 * 1024 * 1024) {
            sendResponse(['error' => 'File size must be less than 10MB'], 400);
            return;
        }

        // Read CSV file
        $csvContent = file_get_contents($file['tmp_name']);
        if ($csvContent === false) {
            sendResponse(['error' => 'Failed to read CSV file'], 500);
            return;
        }

        // Parse CSV
        $lines = explode("\n", $csvContent);
        $lines = array_filter($lines, function($line) {
            return trim($line) !== '';
        });

        if (empty($lines)) {
            sendResponse(['error' => 'CSV file is empty'], 400);
            return;
        }

        // Get mapping from form data
        $mappings = [
            'company_name' => $_POST['map_company_name'] ?? null,
            'email' => $_POST['map_email'] ?? null,
            'phone' => $_POST['map_phone'] ?? null,
            'website' => $_POST['map_website'] ?? null,
            'address' => $_POST['map_address'] ?? null,
            'city' => $_POST['map_city'] ?? null,
            'state' => $_POST['map_state'] ?? null,
            'zip_code' => $_POST['map_zip_code'] ?? null,
            'classification' => $_POST['map_classification'] ?? null,
            'company_type' => $_POST['map_company_type'] ?? null,
        ];

        // Debug: Log mappings
        error_log('CSV Import - Mappings: ' . print_r($mappings, true));

        // Validate required mapping
        if (!$mappings['company_name']) {
            error_log('CSV Import - Company name mapping is missing');
            sendResponse(['error' => 'Company name mapping is required'], 400);
            return;
        }

        $skipFirstRow = isset($_POST['skip_first_row']) && $_POST['skip_first_row'] === '1';
        $startIndex = $skipFirstRow ? 1 : 0;

        $importedCount = 0;
        $errors = [];

        // Begin transaction
        $pdo->beginTransaction();

        try {
            for ($i = $startIndex; $i < count($lines); $i++) {
                $line = $lines[$i];
                $row = str_getcsv($line);
                
                if (count($row) < 1) continue;

                // Extract data based on mappings
                $clientData = [
                    'name' => $mappings['company_name'] !== null ? trim($row[$mappings['company_name']]) : '',
                    'email' => $mappings['email'] !== null ? trim($row[$mappings['email']]) : '',
                    'contact_number' => $mappings['phone'] !== null ? trim($row[$mappings['phone']]) : '',
                    'url' => $mappings['website'] !== null ? trim($row[$mappings['website']]) : '',
                    'address_1' => $mappings['address'] !== null ? trim($row[$mappings['address']]) : '',
                    'city' => $mappings['city'] !== null ? trim($row[$mappings['city']]) : '',
                    'state' => $mappings['state'] !== null ? trim($row[$mappings['state']]) : '',
                    'zip_code' => $mappings['zip_code'] !== null ? trim($row[$mappings['zip_code']]) : '',
                    'classification' => $mappings['classification'] !== null ? trim($row[$mappings['classification']]) : '',
                    'company_type' => $mappings['company_type'] !== null ? trim($row[$mappings['company_type']]) : 'customer',
                ];

                // Validate required fields
                if (empty($clientData['name'])) {
                    $errors[] = "Row " . ($i + 1) . ": Company name is required";
                    continue;
                }

                // Set default values
                $clientData['status'] = 'active';
                $clientData['company_category'] = 'Standard';
                $clientData['country'] = 'United States';

                // Insert client
                $stmt = $pdo->prepare("
                    INSERT INTO clients (
                        name, email, contact_number, url, address_1, city, state, 
                        zip_code, classification, company_type, status, company_category, 
                        country, created_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ");

                $stmt->execute([
                    $clientData['name'],
                    $clientData['email'] ?: null,
                    $clientData['contact_number'] ?: null,
                    $clientData['url'] ?: null,
                    $clientData['address_1'] ?: null,
                    $clientData['city'] ?: null,
                    $clientData['state'] ?: null,
                    $clientData['zip_code'] ?: null,
                    $clientData['classification'] ?: null,
                    $clientData['company_type'] ?: 'customer',
                    $clientData['status'],
                    $clientData['company_category'],
                    $clientData['country'],
                    getCurrentUser()['id']
                ]);

                $importedCount++;
            }

            // Commit transaction
            $pdo->commit();

            sendResponse([
                'success' => true,
                'imported_count' => $importedCount,
                'errors' => $errors
            ]);

        } catch (Exception $e) {
            // Rollback transaction
            $pdo->rollBack();
            sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
        }

    } catch (Exception $e) {
        sendResponse(['error' => 'Error processing CSV: ' . $e->getMessage()], 500);
    }
}

function handleCrmUsers($pdo, $method) {
    if ($method !== 'GET') {
        sendResponse(['error' => 'Method not allowed'], 405);
    }

    try {
        $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE is_active = 1 ORDER BY name");
        $stmt->execute();
        $users = $stmt->fetchAll();
        sendResponse($users);
    } catch (Exception $e) {
        sendResponse(['error' => 'Database error: ' . $e->getMessage()], 500);
    }
}
?>