<?php
/**
 * API Configuration Example
 * 
 * Copy this file to api-config.php and update with your actual API keys
 * 
 * This file should be included in your main api.php file
 */

// Google API Configuration
// Get your API key from: https://console.cloud.google.com/
// Enable these APIs:
// - Places API
// - Geocoding API (optional)
// - Maps JavaScript API (for frontend)

// Option 1: Set as environment variable (recommended)
// Add this to your server environment or .env file:
// GOOGLE_API_KEY=your_google_api_key_here

// Option 2: Set directly in this file (less secure)
// define('GOOGLE_API_KEY', 'your_google_api_key_here');

// Option 3: Set in your web server configuration
// Apache: SetEnv GOOGLE_API_KEY your_key_here
// Nginx: fastcgi_param GOOGLE_API_KEY your_key_here

/**
 * Example .env file content:
 * 
 * GOOGLE_API_KEY=AIzaSyC_your_actual_api_key_here
 * 
 * Make sure to:
 * 1. Enable the required APIs in Google Cloud Console
 * 2. Set up proper restrictions (HTTP referrers, IP addresses)
 * 3. Monitor usage to stay within free tier limits
 */

/**
 * Google API Setup Instructions:
 * 
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing one
 * 3. Enable these APIs:
 *    - Places API
 *    - Geocoding API (optional)
 *    - Maps JavaScript API (for frontend)
 * 4. Create credentials (API Key)
 * 5. Set up restrictions:
 *    - HTTP referrers: your-domain.com/*
 *    - IP addresses: your server IP
 * 6. Copy the API key and set it as environment variable
 * 
 * Free Tier Limits:
 * - Places API: 1,000 requests/day
 * - Geocoding API: 2,500 requests/day
 * - Maps JavaScript API: 25,000 map loads/day
 */

// Example of how to include this in your main api.php file:
/*
// At the top of api.php, add:
if (file_exists('api-config.php')) {
    require_once 'api-config.php';
}
*/

?>
