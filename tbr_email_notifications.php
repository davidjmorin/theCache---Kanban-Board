<?php
/**
 * TBR Meeting Email Notifications
 * 
 * This script sends email notifications for TBR meetings:
 * - 1 week before scheduled meetings
 * - 1 day before scheduled meetings
 * 
 * Run this script via cronjob:
 * - For 1 week notifications: 0 9 * * * /usr/bin/php /var/www/kanban/tbr_email_notifications.php --type=week
 * - For 1 day notifications: 0 9 * * * /usr/bin/php /var/www/kanban/tbr_email_notifications.php --type=day
 */

require_once 'api/config.php';
require_once 'api/email_notifications.php';

$options = getopt('', ['type:']);
$notificationType = $options['type'] ?? '';

if (!in_array($notificationType, ['week', 'day'])) {
    echo "Usage: php tbr_email_notifications.php --type=week|day\n";
    exit(1);
}

try {
    $pdo = getConnection();
    $emailNotifications = new EmailNotifications($pdo);
} catch (Exception $e) {
    error_log("TBR Email Notifications: Database connection failed: " . $e->getMessage());
    exit(1);
}

$startDate = '';
$endDate = '';

if ($notificationType === 'week') {
    $startDate = date('Y-m-d', strtotime('+1 day')); // Start from tomorrow
    $endDate = date('Y-m-d', strtotime('+7 days')); // End 7 days from now
} else {
    $startDate = date('Y-m-d', strtotime('+1 day'));
    $endDate = date('Y-m-d', strtotime('+1 day'));
}

echo "Processing TBR meetings from $startDate to $endDate ($notificationType notification)\n";

$stmt = $pdo->prepare("
    SELECT 
        m.*,
        c.name as client_name,
        c.email as client_email,
        c.contact_name as client_contact_name,
        u.name as account_manager_name,
        u.email as account_manager_email,
        creator.name as created_by_name,
        creator.email as created_by_email
    FROM tbr_meetings m
    LEFT JOIN clients c ON m.client_id = c.id
    LEFT JOIN users u ON m.account_manager_id = u.id
    LEFT JOIN users creator ON m.created_by = creator.id
    WHERE m.meeting_date >= ? 
    AND m.meeting_date <= ?
    AND m.status = 'scheduled'
    ORDER BY m.meeting_date, m.id
");

$stmt->execute([$startDate, $endDate]);
$meetings = $stmt->fetchAll(PDO::FETCH_ASSOC);

if (empty($meetings)) {
    echo "No TBR meetings found for $startDate to $endDate\n";
    exit(0);
}

echo "Found " . count($meetings) . " TBR meetings for $startDate to $endDate\n";

$successCount = 0;
$errorCount = 0;
$skippedCount = 0;

foreach ($meetings as $meeting) {
    try {
        $stmt = $pdo->prepare("
            SELECT a.*, u.name as user_name, u.email as user_email
            FROM tbr_attendees a
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.meeting_id = ?
        ");
        $stmt->execute([$meeting['id']]);
        $attendees = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        $recipients = [];
        
        if (!empty($meeting['account_manager_email'])) {
            $recipients[] = [
                'email' => $meeting['account_manager_email'],
                'name' => $meeting['account_manager_name'] ?? 'Account Manager'
            ];
        }
        
        if (!empty($meeting['client_email'])) {
            $recipients[] = [
                'email' => $meeting['client_email'],
                'name' => $meeting['client_contact_name'] ?? $meeting['client_name'] ?? 'Client'
            ];
        }
        
        if (!empty($meeting['created_by_email'])) {
            $recipients[] = [
                'email' => $meeting['created_by_email'],
                'name' => $meeting['created_by_name'] ?? 'Meeting Creator'
            ];
        }
        
        foreach ($attendees as $attendee) {
            if (!empty($attendee['email'])) {
                $recipients[] = [
                    'email' => $attendee['email'],
                    'name' => $attendee['name'] ?? $attendee['user_name'] ?? 'Attendee'
                ];
            }
        }
        
        $uniqueRecipients = [];
        $seenEmails = [];
        foreach ($recipients as $recipient) {
            if (!in_array($recipient['email'], $seenEmails)) {
                $uniqueRecipients[] = $recipient;
                $seenEmails[] = $recipient['email'];
            }
        }
        
        if (empty($uniqueRecipients)) {
            echo "No recipients found for meeting ID {$meeting['id']}\n";
            $skippedCount++;
            continue;
        }
        
        foreach ($uniqueRecipients as $recipient) {
            $emailSent = sendTbrMeetingNotification(
                $emailNotifications,
                $recipient['email'],
                $recipient['name'],
                $meeting,
                $attendees,
                $notificationType
            );
            
            if ($emailSent) {
                $successCount++;
                echo "Email sent to {$recipient['email']} for meeting ID {$meeting['id']}\n";
            } else {
                $errorCount++;
                echo "Failed to send email to {$recipient['email']} for meeting ID {$meeting['id']}\n";
            }
        }
        
    } catch (Exception $e) {
        $errorCount++;
        error_log("TBR Email Notifications: Error processing meeting ID {$meeting['id']}: " . $e->getMessage());
        echo "Error processing meeting ID {$meeting['id']}: " . $e->getMessage() . "\n";
    }
}

echo "\nSummary:\n";
echo "Successfully sent: $successCount emails\n";
echo "Failed to send: $errorCount emails\n";
echo "Skipped (no recipients): $skippedCount emails\n";
echo "Total meetings processed: " . count($meetings) . "\n";

/**
 * Send TBR meeting notification email
 */
function sendTbrMeetingNotification($emailNotifications, $recipientEmail, $recipientName, $meeting, $attendees, $notificationType) {
    $meetingDate = new DateTime($meeting['meeting_date']);
    $today = new DateTime();
    $daysUntilMeeting = $today->diff($meetingDate)->days;
    
    $subject = "TBR Meeting Reminder: {$meeting['client_name']} - {$meeting['meeting_type']}";
    
    $meetingDateFormatted = date('l, F j, Y', strtotime($meeting['meeting_date']));
    $meetingTime = 'TBD'; // You might want to add a time field to the database
    
    $attendeeList = '';
    if (!empty($attendees)) {
        $attendeeNames = [];
        foreach ($attendees as $attendee) {
            $name = $attendee['name'] ?? $attendee['user_name'] ?? 'Unknown';
            $email = $attendee['email'] ?? '';
            if ($email) {
                $attendeeNames[] = "$name ($email)";
            } else {
                $attendeeNames[] = $name;
            }
        }
        $attendeeList = implode(', ', $attendeeNames);
    }
    
    $message = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f8f9fa; }
            .meeting-details { background: white; border-left: 4px solid #007bff; padding: 15px; margin: 15px 0; }
            .button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
            .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            .urgent { background: #dc3545; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2>TBR Meeting Reminder</h2>
            </div>
            <div class='content'>
                <p>Hello " . htmlspecialchars($recipientName) . ",</p>
                
                <p>This is a reminder that you have a <strong>TBR meeting</strong> scheduled in <strong>$daysUntilMeeting day" . ($daysUntilMeeting > 1 ? 's' : '') . "</strong>.</p>
                
                <div class='meeting-details'>
                    <h3>Meeting Details</h3>
                    <p><strong>Client:</strong> " . htmlspecialchars($meeting['client_name']) . "</p>
                    <p><strong>Meeting Type:</strong> " . htmlspecialchars($meeting['meeting_type']) . "</p>
                    <p><strong>Date:</strong> $meetingDateFormatted</p>
                    <p><strong>Primary Contact:</strong> " . htmlspecialchars($meeting['primary_contact'] ?? 'Not specified') . "</p>
                    <p><strong>Account Manager:</strong> " . htmlspecialchars($meeting['account_manager_name'] ?? 'Not assigned') . "</p>";
    
    if (!empty($attendeeList)) {
        $message .= "<p><strong>Attendees:</strong> " . htmlspecialchars($attendeeList) . "</p>";
    }
    
    if (!empty($meeting['notes'])) {
        $message .= "<p><strong>Notes:</strong> " . nl2br(htmlspecialchars($meeting['notes'])) . "</p>";
    }
    
    if (!empty($meeting['recommendations'])) {
        $message .= "<p><strong>Recommendations:</strong> " . nl2br(htmlspecialchars($meeting['recommendations'])) . "</p>";
    }
    
    $message .= "
                </div>
                
                <p>Please ensure you have all necessary materials prepared for this meeting.</p>
                
                <p>If you need to reschedule or have any questions, please contact the meeting organizer.</p>
            </div>
            <div class='footer'>
                <p>This is an automated reminder from your Kanban board.</p>
                <p>Meeting ID: " . $meeting['id'] . "</p>
            </div>
        </div>
    </body>
    </html>";
    
    return $emailNotifications->sendEmailViaBrevoPublic($recipientEmail, $subject, $message);
}

if (!method_exists($emailNotifications, 'sendEmailViaBrevo')) {
    echo "Warning: sendEmailViaBrevo method not found in EmailNotifications class\n";
}
?>
