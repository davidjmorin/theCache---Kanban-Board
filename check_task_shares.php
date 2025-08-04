<?php
require_once 'api/config.php';

try {
    $pdo = getConnection();
    
    echo "🔍 Checking Task 45 Shares\n";
    echo "=========================\n\n";
    
    $taskId = 45;
    
    // Check all shares for this task
    $stmt = $pdo->prepare("
        SELECT ts.*, u.name as user_name, u.email as user_email, s.name as shared_by_name
        FROM task_shares ts
        JOIN users u ON ts.user_id = u.id
        JOIN users s ON ts.shared_by = s.id
        WHERE ts.task_id = ?
    ");
    $stmt->execute([$taskId]);
    $shares = $stmt->fetchAll();
    
    echo "📋 Task 45 Shares:\n";
    if (empty($shares)) {
        echo "❌ No shares found\n";
    } else {
        foreach ($shares as $share) {
            echo "✅ Shared with: {$share['user_name']} ({$share['user_email']}) by {$share['shared_by_name']}\n";
        }
    }
    
    echo "\n👥 All Users:\n";
    $stmt = $pdo->prepare("SELECT id, name, email FROM users ORDER BY id");
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    foreach ($users as $user) {
        echo "- User {$user['id']}: {$user['name']} ({$user['email']})\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?> 