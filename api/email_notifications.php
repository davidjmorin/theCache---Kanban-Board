<?php
require_once 'config.php';
require_once 'brevo_config.php';

class EmailNotifications {
    private $pdo;
    private $brevoApiKey;
    private $brevoUrl = 'https://api.brevo.com/v3/smtp/email';
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->brevoApiKey = getenv('BREVO_API_KEY') ?: 'your-brevo-api-key-here';
    }
    
    /**
     * Send email notification for task/board sharing
     */
    public function sendShareNotification($recipientEmail, $recipientName, $sharedBy, $sharedByEmail, $itemType, $itemName, $itemUrl = null) {
        $subject = "You've been shared a " . ucfirst($itemType);
        
        $message = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #007bff; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f8f9fa; }
                .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>You've been shared a " . ucfirst($itemType) . "</h2>
                </div>
                <div class='content'>
                    <p>Hello " . htmlspecialchars($recipientName) . ",</p>
                    <p><strong>" . htmlspecialchars($sharedBy) . "</strong> (" . htmlspecialchars($sharedByEmail) . ") has shared a " . $itemType . " with you.</p>
                    <p><strong>" . ucfirst($itemType) . ":</strong> " . htmlspecialchars($itemName) . "</p>";
        
        if ($itemUrl) {
            $message .= "<p><a href='" . htmlspecialchars($itemUrl) . "' class='button'>View " . ucfirst($itemType) . "</a></p>";
        }
        
        $message .= "
                    <p>You can now view and collaborate on this " . $itemType . ".</p>
                </div>
                <div class='footer'>
                    <p>This is an automated notification from your Kanban board.</p>
                </div>
            </div>
        </body>
        </html>";
        
        return $this->sendEmailViaBrevo($recipientEmail, $subject, $message);
    }
    
    /**
     * Send email notification for note updates on shared tasks
     */
    public function sendNoteUpdateNotification($taskOwnerEmail, $taskOwnerName, $noteAuthor, $noteAuthorEmail, $taskName, $noteContent, $taskUrl = null) {
        $subject = "Task Updated: " . $taskName;
        
        $message = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: #28a745; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background: #f8f9fa; }
                .note-box { background: white; border-left: 4px solid #28a745; padding: 15px; margin: 15px 0; }
                .button { display: inline-block; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 5px; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class='container'>
                <div class='header'>
                    <h2>Task Updated</h2>
                </div>
                <div class='content'>
                    <p>Hello " . htmlspecialchars($taskOwnerName) . ",</p>
                    <p>A note has been added to your task <strong>" . htmlspecialchars($taskName) . "</strong> by <strong>" . htmlspecialchars($noteAuthor) . "</strong> (" . htmlspecialchars($noteAuthorEmail) . ").</p>
                    
                    <div class='note-box'>
                        <strong>New Note:</strong><br>
                        " . nl2br(htmlspecialchars($noteContent)) . "
                    </div>";
        
        if ($taskUrl) {
            $message .= "<p><a href='" . htmlspecialchars($taskUrl) . "' class='button'>View Task</a></p>";
        }
        
        $message .= "
                    <p>You can view the full task and all notes in your Kanban board.</p>
                </div>
                <div class='footer'>
                    <p>This is an automated notification from your Kanban board.</p>
                </div>
            </div>
        </body>
        </html>";
        
        return $this->sendEmailViaBrevo($taskOwnerEmail, $subject, $message);
    }
    
    /**
     * Send email using Brevo API
     */
    private function sendEmailViaBrevo($to, $subject, $message) {
        return $this->sendEmailViaBrevoPublic($to, $subject, $message);
    }
    
    /**
     * Public method to send email via Brevo
     */
    public function sendEmailViaBrevoPublic($to, $subject, $message) {
        $data = [
            'sender' => [
                'name' => getenv('SENDER_NAME') ?: 'Kanban Board',
                'email' => getenv('ADMIN_EMAIL') ?: 'admin@localhost'
            ],
            'to' => [
                [
                    'email' => $to,
                    'name' => 'User'
                ]
            ],
            'subject' => $subject,
            'htmlContent' => $message
        ];
        
        $headers = [
            'Content-Type: application/json',
            'api-key: ' . $this->brevoApiKey
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->brevoUrl);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 201) {
            return true;
        } else {
            error_log("Brevo email failed: HTTP $httpCode - $response");
            return false;
        }
    }
    
    /**
     * Get user email by ID
     */
    public function getUserEmail($userId) {
        $stmt = $this->pdo->prepare("SELECT email, name FROM users WHERE id = ?");
        $stmt->execute([$userId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get task owner email
     */
    public function getTaskOwnerEmail($taskId) {
        $stmt = $this->pdo->prepare("
            SELECT u.email, u.name, u.id
            FROM tasks t 
            JOIN users u ON t.user_id = u.id 
            WHERE t.id = ?
        ");
        $stmt->execute([$taskId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
    
    /**
     * Get board owner email
     */
    public function getBoardOwnerEmail($boardId) {
        $stmt = $this->pdo->prepare("
            SELECT u.email, u.name 
            FROM boards b 
            JOIN users u ON b.user_id = u.id 
            WHERE b.id = ?
        ");
        $stmt->execute([$boardId]);
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }
}
?> 