<?php
require_once 'api/config.php';

try {
    $pdo = getConnection();
    
    echo "🔍 Checking Database Data\n";
    echo "========================\n\n";
    
    // Check users
    echo "👥 Users:\n";
    $stmt = $pdo->prepare("SELECT id, name, email FROM users ORDER BY id");
    $stmt->execute();
    $users = $stmt->fetchAll();
    
    if (empty($users)) {
        echo "❌ No users found\n";
    } else {
        foreach ($users as $user) {
            echo "✅ User ID: {$user['id']}, Name: {$user['name']}, Email: {$user['email']}\n";
        }
    }
    
    echo "\n📋 Tasks:\n";
    $stmt = $pdo->prepare("SELECT id, title, user_id FROM tasks ORDER BY id LIMIT 5");
    $stmt->execute();
    $tasks = $stmt->fetchAll();
    
    if (empty($tasks)) {
        echo "❌ No tasks found\n";
    } else {
        foreach ($tasks as $task) {
            echo "✅ Task ID: {$task['id']}, Title: {$task['title']}, Owner: {$task['user_id']}\n";
        }
    }
    
    echo "\n🔗 Task Shares:\n";
    $stmt = $pdo->prepare("SELECT task_id, user_id, shared_by FROM task_shares");
    $stmt->execute();
    $shares = $stmt->fetchAll();
    
    if (empty($shares)) {
        echo "ℹ️  No task shares found\n";
    } else {
        foreach ($shares as $share) {
            echo "✅ Task {$share['task_id']} shared with user {$share['user_id']} by {$share['shared_by']}\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?> 