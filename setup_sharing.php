<?php
require_once 'api/config.php';

try {
    $pdo = getConnection();
    
    $sql = file_get_contents('api/setup_sharing_tables.sql');
    $pdo->exec($sql);
    
    echo "✅ Sharing tables created successfully!\n";
    echo "📧 Email notification system is ready.\n";
    echo "\nFeatures added:\n";
    echo "- Task sharing with email notifications\n";
    echo "- Board sharing with email notifications\n";
    echo "- Note update notifications for shared tasks\n";
    
} catch (Exception $e) {
    echo "❌ Error setting up sharing tables: " . $e->getMessage() . "\n";
}
?> 