<?php
require_once 'api/config.php';

try {
    $pdo = getConnection();
    
    echo "🔧 Fixing Tasks Without Owners\n";
    echo "==============================\n\n";
    
    // Check for tasks without owners
    $stmt = $pdo->prepare("SELECT id, title, user_id FROM tasks WHERE user_id IS NULL");
    $stmt->execute();
    $tasksWithoutOwners = $stmt->fetchAll();
    
    if (empty($tasksWithoutOwners)) {
        echo "✅ All tasks have owners!\n";
        exit;
    }
    
    echo "📋 Found " . count($tasksWithoutOwners) . " tasks without owners:\n";
    foreach ($tasksWithoutOwners as $task) {
        echo "- Task ID: {$task['id']}, Title: {$task['title']}\n";
    }
    
    echo "\n🔧 Fixing tasks...\n";
    
    // Get the first available user as default owner
    $stmt = $pdo->prepare("SELECT id, name FROM users WHERE is_active != 0 ORDER BY id LIMIT 1");
    $stmt->execute();
    $defaultUser = $stmt->fetch();
    
    if (!$defaultUser) {
        echo "❌ No active users found to assign as default owner\n";
        exit;
    }
    
    echo "👤 Using default owner: {$defaultUser['name']} (ID: {$defaultUser['id']})\n\n";
    
    // Update tasks without owners
    $stmt = $pdo->prepare("UPDATE tasks SET user_id = ? WHERE user_id IS NULL");
    $stmt->execute([$defaultUser['id']]);
    $updatedCount = $stmt->rowCount();
    
    echo "✅ Updated {$updatedCount} tasks with default owner\n";
    
    // Verify the fix
    $stmt = $pdo->prepare("SELECT COUNT(*) as count FROM tasks WHERE user_id IS NULL");
    $stmt->execute();
    $remaining = $stmt->fetch()['count'];
    
    if ($remaining == 0) {
        echo "✅ All tasks now have owners!\n";
    } else {
        echo "⚠️  {$remaining} tasks still have no owner\n";
    }
    
    echo "\n📊 Summary:\n";
    echo "- Tasks fixed: {$updatedCount}\n";
    echo "- Default owner: {$defaultUser['name']}\n";
    echo "- Remaining tasks without owners: {$remaining}\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
?> 