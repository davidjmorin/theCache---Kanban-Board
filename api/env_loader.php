<?php
/**
 * Environment Variable Loader
 * Loads environment variables from .env file
 */
function loadEnvFile($envPath = null) {
    if ($envPath === null) {
        $envPath = __DIR__ . '/../.env';
    }
    
    if (file_exists($envPath)) {
        $envFile = file_get_contents($envPath);
        $lines = explode("\n", $envFile);
        foreach ($lines as $line) {
            $line = trim($line);
            if (!empty($line) && strpos($line, '=') !== false && strpos($line, '#') !== 0) {
                list($key, $value) = explode('=', $line, 2);
                // Set in $_ENV array for compatibility
                $_ENV[$key] = $value;
                // Set using putenv for getenv() access
                putenv("$key=$value");
            }
        }
        return true;
    }
    return false;
}

// Auto-load environment variables when this file is included
loadEnvFile();
?> 