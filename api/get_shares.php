<?php
require_once 'config.php';

$pdo = getConnection();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

session_start();

if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$endpoint = $_GET['endpoint'] ?? '';
$id = $_GET['id'] ?? null;

switch ($endpoint) {
    case 'task-shares':
        if ($method === 'GET' && $id) {
            $stmt = $pdo->prepare("
                SELECT ts.*, u.name as user_name, u.email as user_email, 
                       s.name as shared_by_name, s.email as shared_by_email
                FROM task_shares ts
                JOIN users u ON ts.user_id = u.id
                JOIN users s ON ts.shared_by = s.id
                WHERE ts.task_id = ?
            ");
            $stmt->execute([$id]);
            $shares = $stmt->fetchAll();
            
            header('Content-Type: application/json');
            echo json_encode($shares);
        }
        break;
        
    case 'board-shares':
        if ($method === 'GET' && $id) {
            $stmt = $pdo->prepare("
                SELECT bs.*, u.name as user_name, u.email as user_email,
                       s.name as shared_by_name, s.email as shared_by_email
                FROM board_shares bs
                JOIN users u ON bs.user_id = u.id
                JOIN users s ON bs.shared_by = s.id
                WHERE bs.board_id = ?
            ");
            $stmt->execute([$id]);
            $shares = $stmt->fetchAll();
            
            header('Content-Type: application/json');
            echo json_encode($shares);
        }
        break;
        
    default:
        http_response_code(404);
        echo json_encode(['error' => 'Endpoint not found']);
        break;
}
?> 