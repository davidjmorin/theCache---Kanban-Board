<?php
require_once 'config.php';

$pdo = getConnection();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

session_start();
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$path = trim($path, '/');
$pathParts = explode('/', $path);

if (!empty($pathParts) && $pathParts[0] === 'api') {
    array_shift($pathParts);
}

$endpoint = $pathParts[0] ?? '';
$id = $pathParts[1] ?? null;

if (!$id) {
    $id = $_GET['id'] ?? null;
}

switch ($endpoint) {
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
        case 'client-tasks':
            requireAuth();
            handleClientTasks($pdo, $method, $id);
            break;
    case 'checklist':
        requireAuth();
        handleChecklist($pdo, $method, $id);
        break;
    case 'board':
        requireAuth();
        handleBoard($pdo, $method);
        break;
    default:
        sendResponse(['error' => 'Endpoint not found'], 404);
}

function requireAuth() {
    if (!isset($_SESSION['user_id'])) {
        sendResponse(['error' => 'Authentication required', 'auth_required' => true], 401);
    }
    // Validate CSRF for state-changing operations
    validateCSRFForStateChanges();
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

function handleCompany($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            $stmt = $pdo->query("SELECT * FROM companies WHERE id = 1");
            $company = $stmt->fetch();
            if (!$company) {
                $company = ['id' => 1, 'name' => 'My Company', 'contact_name' => null, 'contact_number' => null, 'email' => null, 'url' => null];
            }
            sendResponse($company);
            break;
        case 'PUT':
            $data = getRequestBody();
            validateRequired($data, ['name']);

            $stmt = $pdo->prepare("UPDATE companies SET name = ?, contact_name = ?, contact_number = ?, email = ?, url = ?, updated_at = NOW() WHERE id = 1");
            $stmt->execute([
                $data['name'],
                $data['contact_name'] ?? null,
                $data['contact_number'] ?? null,
                $data['email'] ?? null,
                $data['url'] ?? null
            ]);

            sendResponse(['success' => true, 'message' => 'Company updated successfully']);
            break;
    }
}

function handleStages($pdo, $method, $id) {
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
                $stmt = $pdo->query("SELECT * FROM stages ORDER BY position");
                sendResponse($stmt->fetchAll());
            }
            break;
        case 'POST':
            $data = getRequestBody();
            validateRequired($data, ['name']);
            $color = $data['color'] ?? '#3498db';

            $stmt = $pdo->query("SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM stages");
            $position = $stmt->fetch()['next_position'];

            $stmt = $pdo->prepare("INSERT INTO stages (name, color, position) VALUES (?, ?, ?)");
            $stmt->execute([$data['name'], $color, $position]);

            $newId = $pdo->lastInsertId();
            sendResponse(['id' => $newId, 'success' => true, 'message' => 'Stage created successfully']);
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
                $stmt->execute([$data['name'], $data['color'] ?? '#3498db', $id]);
                sendResponse(['success' => true, 'message' => 'Stage updated successfully']);
            }
            break;
        case 'DELETE':
            if (!$id) {
                sendResponse(['error' => 'Stage ID required'], 400);
            }
            $stmt = $pdo->prepare("DELETE FROM stages WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(['success' => true, 'message' => 'Stage deleted successfully']);
            break;
    }
}

function handleTasks($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            if ($id) {
                $stmt = $pdo->prepare("
                    SELECT t.*, u.name as user_name, c.name as client_name,
                           GROUP_CONCAT(DISTINCT a.id, ':', a.original_name, ':', a.filename SEPARATOR '|') as attachments,
                           GROUP_CONCAT(DISTINCT cl.id, ':', cl.text, ':', cl.is_completed, ':', cl.position ORDER BY cl.position SEPARATOR '|') as checklist
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

                $task['attachments'] = [];
                if ($task['attachments']) {
                    foreach (explode('|', $task['attachments']) as $attachment) {
                        $parts = explode(':', $attachment, 3);
                        if (count($parts) === 3) {
                            $task['attachments'][] = [
                                'id' => $parts[0],
                                'original_name' => $parts[1],
                                'filename' => $parts[2]
                            ];
                        }
                    }
                }

                $originalChecklist = $task['checklist'];
                $task['checklist'] = [];
                if (!empty($originalChecklist)) {
                    foreach (explode('|', $originalChecklist) as $item) {
                        $parts = explode(':', $item, 4);
                        if (count($parts) === 4) {
                            $task['checklist'][] = [
                                'id' => $parts[0],
                                'text' => $parts[1],
                                'is_completed' => (bool)$parts[2],
                                'position' => $parts[3]
                            ];
                        }
                    }
                }

                sendResponse($task);
            } else {
                $stmt = $pdo->query("
                    SELECT t.*, u.name as user_name, c.name as client_name,
                           COUNT(DISTINCT a.id) as attachment_count,
                           COUNT(DISTINCT cl.id) as checklist_total,
                           SUM(CASE WHEN cl.is_completed = 1 THEN 1 ELSE 0 END) as checklist_completed,
                           GROUP_CONCAT(DISTINCT CONCAT(a.id, ':', a.original_name, ':', a.filename) SEPARATOR '|') as attachments
                    FROM tasks t
                    LEFT JOIN users u ON t.user_id = u.id
                    LEFT JOIN clients c ON t.client_id = c.id
                    LEFT JOIN attachments a ON t.id = a.task_id
                    LEFT JOIN checklist_items cl ON t.id = cl.task_id
                    GROUP BY t.id
                    ORDER BY t.stage_id, t.position
                ");
                $tasks = $stmt->fetchAll();
                error_log("Tasks loaded - count: " . count($tasks) . ", latest task card_color: " . ($tasks[count($tasks)-1]['card_color'] ?? 'NULL'));
                sendResponse($tasks);
            }
            break;
        case 'POST':
            $data = getRequestBody();
            validateRequired($data, ['title', 'stage_id']);

            error_log("Task creation attempt - Data: " . json_encode($data));

            $stmt = $pdo->prepare("SELECT COALESCE(MAX(position), 0) + 1 as next_position FROM tasks WHERE stage_id = ?");
            $stmt->execute([$data['stage_id']]);
            $position = $stmt->fetch()['next_position'];

            $stmt = $pdo->prepare("
                INSERT INTO tasks (title, description, notes, stage_id, user_id, client_id, created_by, position, start_date, due_date, card_color, priority) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $data['title'],
                $data['description'] ?? null,
                $data['notes'] ?? null,
                $data['stage_id'],
                $data['user_id'] ?? null,
                $data['client_id'] ?? null,
                $_SESSION['user_id'],
                $position,
                $data['start_date'] ?? null,
                $data['due_date'] ?? null,
                $data['card_color'] ?? '#1a202c',
                $data['priority'] ?? 'medium'
            ]);

            $taskId = $pdo->lastInsertId();

            if (!empty($data['checklist'])) {
                foreach ($data['checklist'] as $index => $item) {
                    if (!empty($item['text'])) {
                        $stmt = $pdo->prepare("INSERT INTO checklist_items (task_id, text, position) VALUES (?, ?, ?)");
                        $stmt->execute([$taskId, $item['text'], $index]);
                    }
                }
            }

            // Debug: Check what was actually saved
            $stmt = $pdo->prepare("SELECT * FROM tasks WHERE id = ?");
            $stmt->execute([$taskId]);
            $savedTask = $stmt->fetch();
            error_log("Task saved to database - ID: $taskId, card_color: " . ($savedTask['card_color'] ?? 'NULL'));

            sendResponse(['id' => $taskId, 'success' => true, 'message' => 'Task created successfully']);
            break;
        case 'PUT':
            if (!$id) {
                sendResponse(['error' => 'Task ID required'], 400);
            }

            try {
                $data = getRequestBody();

                error_log("Task update attempt - ID: $id, Data: " . json_encode($data));

                if (isset($data['stage_id']) && isset($data['position'])) {

                    $stmt = $pdo->prepare("UPDATE tasks SET stage_id = ?, position = ? WHERE id = ?");
                    $stmt->execute([$data['stage_id'], $data['position'], $id]);
                } else {

                    $stmt = $pdo->prepare("SELECT user_id FROM tasks WHERE id = ?");
                    $stmt->execute([$id]);
                    $currentTask = $stmt->fetch();
                    $oldUserId = $currentTask['user_id'];
                    $newUserId = $data['user_id'] ?? null;

                    $stmt = $pdo->prepare("
                        UPDATE tasks SET 
                            title = COALESCE(?, title),
                            description = COALESCE(?, description),
                            notes = COALESCE(?, notes),
                            stage_id = COALESCE(?, stage_id),
                            user_id = ?,
                            client_id = ?,
                            start_date = ?,
                            due_date = ?,
                            card_color = COALESCE(?, card_color),
                            priority = COALESCE(?, priority)
                        WHERE id = ?
                    ");
                    $stmt->execute([
                        $data['title'] ?? null,
                        $data['description'] ?? null,
                        $data['notes'] ?? null,
                        $data['stage_id'] ?? null,
                        $data['user_id'] ?? null,
                        $data['client_id'] ?? null,
                        $data['start_date'] ?? null,
                        $data['due_date'] ?? null,
                        $data['card_color'] ?? null,
                        $data['priority'] ?? null,
                        $id
                    ]);

                    if ($newUserId && $newUserId != $oldUserId && $newUserId != $_SESSION['user_id']) {
                        $taskTitle = $data['title'] ?? 'Untitled Task';
                        $message = "Task '$taskTitle' has been assigned to you";
                        createNotification($pdo, $newUserId, $id, $message, 'task_assigned');
                    }

                    if (isset($data['checklist'])) {
                        try {

                            $stmt = $pdo->prepare("DELETE FROM checklist_items WHERE task_id = ?");
                            $stmt->execute([$id]);

                            foreach ($data['checklist'] as $index => $item) {
                                if (!empty($item['text'])) {
                                    $stmt = $pdo->prepare("INSERT INTO checklist_items (task_id, text, is_completed, position) VALUES (?, ?, ?, ?)");
                                    $stmt->execute([$id, $item['text'], (int)($item['is_completed'] ?? false), $index]);
                                }
                            }
                        } catch (Exception $e) {
                            error_log("Checklist update error: " . $e->getMessage());
                            sendResponse(['error' => 'Failed to update checklist: ' . $e->getMessage()], 500);
                        }
                    }
                }

                sendResponse(['success' => true, 'message' => 'Task updated successfully']);
            } catch (Exception $e) {
                error_log("Task update error: " . $e->getMessage());
                sendResponse(['error' => 'Failed to update task: ' . $e->getMessage()], 500);
            }
            break;
        case 'DELETE':
            if (!$id) {
                sendResponse(['error' => 'Task ID required'], 400);
            }
            $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
            $stmt->execute([$id]);
            sendResponse(['success' => true, 'message' => 'Task deleted successfully']);
            break;
    }
}

function handleUsers($pdo, $method, $id) {
    switch ($method) {
        case 'GET':
            $userId = $_SESSION['user_id'];
            $isAdmin = $_SESSION['is_admin'] ?? false;
            
            if ($isAdmin) {
                $stmt = $pdo->query("SELECT * FROM users ORDER BY name");
                sendResponse($stmt->fetchAll());
            } else {
                $stmt = $pdo->prepare("
                    SELECT DISTINCT u.* 
                    FROM users u
                    LEFT JOIN tasks t ON u.id = t.user_id OR u.id = t.created_by
                    LEFT JOIN boards b ON t.board_id = b.id
                    LEFT JOIN board_shares bs ON b.id = bs.board_id
                    WHERE (b.created_by = ? OR bs.user_id = ? OR b.created_by IS NULL OR u.id = ?)
                    ORDER BY u.name
                ");
                $stmt->execute([$userId, $userId, $userId]);
                sendResponse($stmt->fetchAll());
            }
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
        case 'PUT':
            if (!$id) {
                sendResponse(['error' => 'User ID required'], 400);
            }
            $data = getRequestBody();
            validateRequired($data, ['name', 'email']);

            try {
                $stmt = $pdo->prepare("UPDATE users SET name = ?, email = ? WHERE id = ?");
                $stmt->execute([$data['name'], $data['email'], $id]);
                sendResponse(['success' => true, 'message' => 'User updated successfully']);
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
            $userId = $_SESSION['user_id'];
            $isAdmin = $_SESSION['is_admin'] ?? false;
            
            if ($id) {
                if ($isAdmin) {
                    $stmt = $pdo->prepare("SELECT * FROM clients WHERE id = ?");
                    $stmt->execute([$id]);
                    $client = $stmt->fetch();
                    if (!$client) {
                        sendResponse(['error' => 'Client not found'], 404);
                    }
                    sendResponse($client);
                } else {
                    $stmt = $pdo->prepare("
                        SELECT DISTINCT c.* 
                        FROM clients c
                        INNER JOIN tasks t ON c.id = t.client_id
                        WHERE c.id = ? AND (t.created_by = ? OR t.user_id = ?)
                    ");
                    $stmt->execute([$id, $userId, $userId]);
                    $client = $stmt->fetch();
                    if (!$client) {
                        sendResponse(['error' => 'Client not found'], 404);
                    }
                    sendResponse($client);
                }
            } else {
                if ($isAdmin) {
                    $stmt = $pdo->query("SELECT * FROM clients ORDER BY name");
                    sendResponse($stmt->fetchAll());
                } else {
                    $stmt = $pdo->prepare("
                        SELECT DISTINCT c.* 
                        FROM clients c
                        INNER JOIN tasks t ON c.id = t.client_id
                        WHERE t.created_by = ? OR t.user_id = ?
                        ORDER BY c.name
                    ");
                    $stmt->execute([$userId, $userId]);
                    sendResponse($stmt->fetchAll());
                }
            }
            break;
        case 'POST':
            $data = getRequestBody();
            validateRequired($data, ['name', 'contact_name', 'contact_number']);

            try {
                $stmt = $pdo->prepare("INSERT INTO clients (name, contact_name, contact_number, email, url) VALUES (?, ?, ?, ?, ?)");
                $stmt->execute([
                    $data['name'],
                    $data['contact_name'],
                    $data['contact_number'],
                    $data['email'] ?? null,
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
            validateRequired($data, ['name', 'contact_name', 'contact_number']);

            try {
                $stmt = $pdo->prepare("UPDATE clients SET name = ?, contact_name = ?, contact_number = ?, email = ?, url = ? WHERE id = ?");
                $stmt->execute([
                    $data['name'],
                    $data['contact_name'],
                    $data['contact_number'],
                    $data['email'] ?? null,
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

function handleNotes($pdo, $method, $id) {
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

        case 'POST':
            if (!isset($_FILES['file']) || !isset($_POST['task_id'])) {
                sendResponse(['error' => 'File and task_id required'], 400);
            }

            $taskId = $_POST['task_id'];
            $file = $_FILES['file'];

            if ($file['error'] !== UPLOAD_ERR_OK) {
                sendResponse(['error' => 'File upload failed'], 400);
            }

            $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
            $filename = uniqid() . '.' . $extension;
            $uploadPath = '../uploads/' . $filename;

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

                $filePath = '../uploads/' . $attachment['filename'];
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
        case 'GET':
            if (!$id) {
                sendResponse(['error' => 'Checklist item ID required'], 400);
            }
            $stmt = $pdo->prepare("SELECT * FROM checklist_items WHERE id = ?");
            $stmt->execute([$id]);
            $item = $stmt->fetch();
            if (!$item) {
                sendResponse(['error' => 'Checklist item not found'], 404);
            }
            sendResponse($item);
            break;
        case 'PUT':
            if (!$id) {
                sendResponse(['error' => 'Checklist item ID required'], 400);
            }
            $data = getRequestBody();

            $stmt = $pdo->prepare("UPDATE checklist_items SET is_completed = ? WHERE id = ?");
            $stmt->execute([$data['is_completed'] ?? false, $id]);
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
        default:
            sendResponse(['error' => 'Method not allowed'], 405);
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

function handleBoard($pdo, $method) {
    if ($method === 'GET') {

        $lastUpdate = $_GET['last_update'] ?? null;
        $isUpdateCheck = isset($_GET['last_update']);

        if ($isUpdateCheck) {
            $hasUpdates = false;

            if ($lastUpdate && $lastUpdate !== 'null') {
                try {

                    $lastUpdateTime = new DateTime($lastUpdate);

                    $stmt = $pdo->prepare("
                        SELECT COUNT(*) as count FROM tasks 
                        WHERE updated_at > ? OR created_at > ?
                    ");
                    $stmt->execute([$lastUpdate, $lastUpdate]);
                    $taskUpdates = $stmt->fetch()['count'] > 0;

                    $stmt = $pdo->prepare("
                        SELECT COUNT(*) as count FROM stages 
                        WHERE updated_at > ? OR created_at > ?
                    ");
                    $stmt->execute([$lastUpdate, $lastUpdate]);
                    $stageUpdates = $stmt->fetch()['count'] > 0;

                    $stmt = $pdo->prepare("
                        SELECT COUNT(*) as count FROM companies 
                        WHERE updated_at > ? OR created_at > ?
                    ");
                    $stmt->execute([$lastUpdate, $lastUpdate]);
                    $companyUpdates = $stmt->fetch()['count'] > 0;

                    $hasUpdates = $taskUpdates || $stageUpdates || $companyUpdates;
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

        $stmt = $pdo->query("SELECT * FROM companies WHERE id = 1");
        $company = $stmt->fetch() ?: ['id' => 1, 'name' => 'My Company'];

        $stmt = $pdo->query("
            SELECT s.*, COUNT(t.id) as task_count
            FROM stages s
            LEFT JOIN tasks t ON s.id = t.stage_id
            GROUP BY s.id
            ORDER BY s.position
        ");
        $stages = $stmt->fetchAll();

        $userId = $_SESSION['user_id'];
        $isAdmin = $_SESSION['is_admin'] ?? false;

        if ($isAdmin) {

            $stmt = $pdo->query("
                SELECT t.*, u.name as user_name, c.name as client_name,
                       COUNT(DISTINCT a.id) as attachment_count,
                       COUNT(DISTINCT cl.id) as checklist_total,
                       COUNT(DISTINCT CASE WHEN cl.is_completed = 1 THEN cl.id END) as checklist_completed
                FROM tasks t
                LEFT JOIN users u ON t.user_id = u.id
                LEFT JOIN clients c ON t.client_id = c.id
                LEFT JOIN attachments a ON t.id = a.task_id
                LEFT JOIN checklist_items cl ON t.id = cl.task_id
                GROUP BY t.id
                ORDER BY t.stage_id, t.position
            ");
        } else {

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
                WHERE t.created_by = ? OR t.user_id = ?
                GROUP BY t.id
                ORDER BY t.stage_id, t.position
            ");
            $stmt->execute([$userId, $userId]);
        }
        $tasks = $stmt->fetchAll();

        if ($isAdmin) {
            $stmt = $pdo->query("SELECT * FROM users ORDER BY name");
            $users = $stmt->fetchAll();
        } else {
            $stmt = $pdo->prepare("
                SELECT DISTINCT u.* 
                FROM users u
                LEFT JOIN tasks t ON u.id = t.user_id OR u.id = t.created_by
                LEFT JOIN boards b ON t.board_id = b.id
                LEFT JOIN board_shares bs ON b.id = bs.board_id
                WHERE (b.created_by = ? OR bs.user_id = ? OR b.created_by IS NULL OR u.id = ?)
                ORDER BY u.name
            ");
            $stmt->execute([$userId, $userId, $userId]);
            $users = $stmt->fetchAll();
        }

        if ($isAdmin) {
            $stmt = $pdo->query("SELECT * FROM clients ORDER BY name");
            $clients = $stmt->fetchAll();
        } else {
            $stmt = $pdo->prepare("
                SELECT DISTINCT c.* 
                FROM clients c
                INNER JOIN tasks t ON c.id = t.client_id
                WHERE t.created_by = ? OR t.user_id = ?
                ORDER BY c.name
            ");
            $stmt->execute([$userId, $userId]);
            $clients = $stmt->fetchAll();
        }

        sendResponse([
            'company' => $company,
            'stages' => $stages,
            'tasks' => $tasks,
            'users' => $users,
            'clients' => $clients
        ]);
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
?>