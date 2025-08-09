<?php
/**
 * API Configuration File
 * 
 * Loads API keys from environment variables
 * 
 * Configuration is loaded from .env file - add your API keys there
 */

// Load environment variables
require_once __DIR__ . '/api/env_loader.php';

// Google API Configuration from environment variables
define('GOOGLE_API_KEY', getenv('GOOGLE_API_KEY') ?: '');

/**
 * To get your Google API key:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a project or select existing one
 * 3. Enable these APIs:
 *    - Places API
 *    - Geocoding API (optional)
 *    - Maps JavaScript API
 * 4. Create credentials (API Key)
 * 5. Copy the API key and paste it above
 * 
 * Make sure to:
 * - Enable the required APIs
 * - Set up proper restrictions
 * - Monitor usage to stay within free tier limits
 */

?>
