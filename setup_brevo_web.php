<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brevo Email Setup</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input[type="text"] {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            font-size: 16px;
        }
        .btn {
            background: #007bff;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
        }
        .btn:hover {
            background: #0056b3;
        }
        .success {
            background: #d4edda;
            color: #155724;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .error {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .info {
            background: #d1ecf1;
            color: #0c5460;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .prerequisites {
            background: #fff3cd;
            color: #856404;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔧 Brevo Email Integration Setup</h1>
            <p>Configure email notifications for your Kanban board</p>
        </div>

        <div class="prerequisites">
            <h3>📋 Prerequisites</h3>
            <ol>
                <li><strong>Brevo Account:</strong> <a href="https://www.brevo.com/" target="_blank">Sign up at Brevo</a></li>
                <li><strong>API Key:</strong> Go to Settings → API Keys → Create new key with "SMTP" permissions</li>
            </ol>
        </div>

        <?php
        if ($_POST['action'] ?? false) {
            $apiKey = trim($_POST['api_key'] ?? '');
            $action = $_POST['action'];
            
            if (empty($apiKey)) {
                echo '<div class="error">❌ Please enter your Brevo API key</div>';
            } else {
                try {
                    switch ($action) {
                        case 'env':
                            $envContent = "BREVO_API_KEY=$apiKey\n";
                            $result = file_put_contents('.env', $envContent);
                            if ($result !== false) {
                                echo '<div class="success">✅ .env file created successfully!</div>';
                            } else {
                                echo '<div class="error">❌ Failed to create .env file. Check file permissions.</div>';
                            }
                            break;
                            
                        case 'config':
                            $configContent = "<?php\n// Brevo API Configuration\nputenv('BREVO_API_KEY=\"$apiKey\"');\n?>";
                            $result = file_put_contents('api/brevo_config.php', $configContent);
                            if ($result !== false) {
                                echo '<div class="success">✅ brevo_config.php updated successfully!</div>';
                            } else {
                                echo '<div class="error">❌ Failed to update brevo_config.php. Check file permissions.</div>';
                            }
                            break;
                            
                        case 'both':
                            $envContent = "BREVO_API_KEY=$apiKey\n";
                            $configContent = "<?php\n// Brevo API Configuration\nputenv('BREVO_API_KEY=\"$apiKey\"');\n?>";
                            
                            $envResult = file_put_contents('.env', $envContent);
                            $configResult = file_put_contents('api/brevo_config.php', $configContent);
                            
                            if ($envResult !== false && $configResult !== false) {
                                echo '<div class="success">✅ Both .env file and brevo_config.php updated successfully!</div>';
                            } else {
                                echo '<div class="error">❌ Some files failed to update. Check file permissions.</div>';
                            }
                            break;
                    }
                    
                    echo '<div class="info">🧪 To test the integration, visit: <a href="test_email.php">test_email.php</a></div>';
                    echo '<div class="info">📧 Email notifications will be sent for task sharing, board sharing, and note updates.</div>';
                    
                } catch (Exception $e) {
                    echo '<div class="error">❌ Error: ' . htmlspecialchars($e->getMessage()) . '</div>';
                }
            }
        }
        ?>

        <form method="POST">
            <div class="form-group">
                <label for="api_key">Brevo API Key:</label>
                <input type="text" id="api_key" name="api_key" placeholder="xkeysib-your-api-key-here" required>
            </div>
            
            <div class="form-group">
                <label>Configuration Options:</label>
                <div style="margin-top: 10px;">
                    <button type="submit" name="action" value="env" class="btn">Create .env File</button>
                    <button type="submit" name="action" value="config" class="btn">Update Config File</button>
                    <button type="submit" name="action" value="both" class="btn">Do Both (Recommended)</button>
                </div>
            </div>
        </form>

        <div class="info">
            <h3>🔑 How to Get Your API Key</h3>
            <ol>
                <li>Login to your <a href="https://www.brevo.com/" target="_blank">Brevo account</a></li>
                <li>Go to <strong>Settings</strong> → <strong>API Keys</strong></li>
                <li>Click <strong>Create new API key</strong></li>
                <li>Select <strong>SMTP</strong> permissions</li>
                <li>Copy the generated API key</li>
                <li>Paste it in the field above</li>
            </ol>
        </div>

        <div class="info">
            <h3>📧 What This Sets Up</h3>
            <ul>
                <li><strong>Task Sharing:</strong> Email notifications when tasks are shared</li>
                <li><strong>Board Sharing:</strong> Email notifications when boards are shared</li>
                <li><strong>Note Updates:</strong> Email notifications when notes are added to shared tasks</li>
            </ul>
        </div>
    </div>
</body>
</html> 