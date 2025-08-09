<?php
require_once 'api/config.php';

try {
    $pdo = getConnection();
    
    echo "🔍 Checking Recent Tasks\n";
    echo "=======================\n\n";
    
    echo "📋 All Tasks:\n";
    $stmt = $pdo->prepare("SELECT id, title, user_id, created_at FROM tasks ORDER BY id DESC");
    $stmt->execute();
    $tasks = $stmt->fetchAll();
    
    if (empty($tasks)) {
        echo "❌ No tasks found\n";
    } else {
        foreach ($tasks as $task) {
            $owner = $task['user_id'] ? "User " . $task['user_id'] : "No owner";
            echo "✅ Task ID: {$task['id']}, Title: {$task['title']}, Owner: {$owner}, Created: {$task['created_at']}\n";
        }
    }
    
    echo "\n📝 Recent Notes:\n";
    $stmt = $pdo->prepare("SELECT tn.*, t.title as task_title, u.name as user_name FROM task_notes tn JOIN tasks t ON tn.task_id = t.id JOIN users u ON tn.user_id = u.id ORDER BY tn.created_at DESC LIMIT 10");
    $stmt->execute();
    $notes = $stmt->fetchAll();
    
    if (empty($notes)) {
        echo "❌ No notes found\n";
    } else {
        foreach ($notes as $note) {
            echo "✅ Note ID: {$note['id']}, Task: {$note['task_title']}, User: {$note['user_name']}, Text: " . substr($note['note_text'], 0, 50) . "...\n";
        }
    }
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?> 