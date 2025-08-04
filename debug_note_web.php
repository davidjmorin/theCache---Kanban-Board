<?php
require_once 'api/config.php';

try {
    $pdo = getConnection();
    
    echo "🔍 Debugging Web Interface Note Addition\n";
    echo "=======================================\n\n";
    
    // Simulate the exact web interface process
    $_SERVER['REQUEST_METHOD'] = 'POST';
    $_SERVER['REQUEST_URI'] = '/api.php?endpoint=notes';
    
    // Start session as David (Personal)
    session_start();
    $_SESSION['user_id'] = 13; // David (Personal)
    $_SESSION['is_admin'] = true;
    
    echo "👤 Logged in as User ID: " . $_SESSION['user_id'] . " (David Personal)\n";
    
    // Simulate the exact POST data from web interface
    $postData = [
        'task_id' => 45, // "Testing Email on Share"
        'note_text' => 'Debug test note from web interface',
        'note_type' => 'call'
    ];
    
    echo "📝 Simulating note addition:\n";
    echo "- Task ID: " . $postData['task_id'] . "\n";
    echo "- Note text: " . $postData['note_text'] . "\n";
    echo "- Note type: " . $postData['note_type'] . "\n\n";
    
    // Check task details first
    $stmt = $pdo->prepare("SELECT id, title, user_id FROM tasks WHERE id = ?");
    $stmt->execute([$postData['task_id']]);
    $task = $stmt->fetch();
    
    echo "📋 Task Details:\n";
    echo "- ID: " . $task['id'] . "\n";
    echo "- Title: " . $task['title'] . "\n";
    echo "- Owner: " . ($task['user_id'] ? "User " . $task['user_id'] : "No owner") . "\n\n";
    
    // Check current user
    $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $currentUser = $stmt->fetch();
    
    echo "👤 Current User:\n";
    echo "- ID: " . $currentUser['id'] . "\n";
    echo "- Name: " . $currentUser['name'] . "\n";
    echo "- Email: " . $currentUser['email'] . "\n\n";
    
    // Check task owner
    if ($task['user_id']) {
        $stmt = $pdo->prepare("SELECT id, name, email FROM users WHERE id = ?");
        $stmt->execute([$task['user_id']]);
        $taskOwner = $stmt->fetch();
        
        echo "👤 Task Owner:\n";
        echo "- ID: " . $taskOwner['id'] . "\n";
        echo "- Name: " . $taskOwner['name'] . "\n";
        echo "- Email: " . $taskOwner['email'] . "\n\n";
    }
    
    // Now test the actual API call
    echo "🔄 Testing API call...\n";
    
    // Include the API file
    require_once 'api.php';
    
    // Simulate the request body
    $_POST = $postData;
    
    // Call the notes handler
    handleNotes($pdo, 'POST', null);
    
    echo "✅ API call completed\n";
    echo "Check the error logs for any notification debug messages\n";
    
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
}
?> 