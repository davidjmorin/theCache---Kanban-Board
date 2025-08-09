<?php
// Brevo API Configuration
require_once __DIR__ . '/env_loader.php';

// Set the API key from environment variable
$apiKey = getenv('BREVO_API_KEY');
if (!$apiKey) {
    error_log('BREVO_API_KEY environment variable not set');
}
?>