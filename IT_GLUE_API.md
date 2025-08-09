# IT Glue API Integration for Assets

This document outlines the API endpoints available for IT Glue integration with the CRM assets functionality.

## Base URL
```
https://your-domain.com/api.php?endpoint=assets
```

## Authentication
All API requests require authentication. Include your session cookie or API key in the request headers.

## Endpoints

### 1. Get Assets for a Client
**GET** `/api.php?endpoint=assets&client_id={client_id}`

Returns all assets for a specific client.

**Response:**
```json
[
  {
    "id": 1,
    "client_id": 123,
    "name": "Main Server",
    "type": "Server",
    "model": "Dell PowerEdge R740",
    "serial_number": "DELL123456789",
    "status": "active",
    "location": "Server Room A",
    "ip_address": "192.168.1.100",
    "purchase_date": "2023-01-15",
    "warranty_expiry": "2026-01-15",
    "notes": "Primary application server",
    "it_glue_id": "glue_asset_123",
    "created_by": 1,
    "created_by_name": "John Doe",
    "created_at": "2023-01-15T10:30:00Z",
    "updated_at": "2023-01-15T10:30:00Z"
  }
]
```

### 2. Get Specific Asset
**GET** `/api.php?endpoint=assets&id={asset_id}`

Returns details for a specific asset.

**Response:**
```json
{
  "id": 1,
  "client_id": 123,
  "name": "Main Server",
  "type": "Server",
  "model": "Dell PowerEdge R740",
  "serial_number": "DELL123456789",
  "status": "active",
  "location": "Server Room A",
  "ip_address": "192.168.1.100",
  "purchase_date": "2023-01-15",
  "warranty_expiry": "2026-01-15",
  "notes": "Primary application server",
  "it_glue_id": "glue_asset_123",
  "created_by": 1,
  "created_by_name": "John Doe",
  "created_at": "2023-01-15T10:30:00Z",
  "updated_at": "2023-01-15T10:30:00Z"
}
```

### 3. Create Asset
**POST** `/api.php?endpoint=assets`

Creates a new asset for a client.

**Request Body:**
```json
{
  "client_id": 123,
  "name": "New Laptop",
  "type": "Laptop",
  "model": "Dell Latitude 5520",
  "serial_number": "DELL987654321",
  "status": "active",
  "location": "Office 101",
  "ip_address": "192.168.1.50",
  "purchase_date": "2023-06-01",
  "warranty_expiry": "2026-06-01",
  "notes": "Assigned to John Smith",
  "it_glue_id": "glue_asset_456"
}
```

**Response:**
```json
{
  "id": 2,
  "client_id": 123,
  "name": "New Laptop",
  "type": "Laptop",
  "model": "Dell Latitude 5520",
  "serial_number": "DELL987654321",
  "status": "active",
  "location": "Office 101",
  "ip_address": "192.168.1.50",
  "purchase_date": "2023-06-01",
  "warranty_expiry": "2026-06-01",
  "notes": "Assigned to John Smith",
  "it_glue_id": "glue_asset_456",
  "created_by": 1,
  "created_by_name": "John Doe",
  "created_at": "2023-06-01T14:30:00Z",
  "updated_at": "2023-06-01T14:30:00Z"
}
```

### 4. Update Asset
**PUT** `/api.php?endpoint=assets&id={asset_id}`

Updates an existing asset.

**Request Body:**
```json
{
  "name": "Updated Server Name",
  "type": "Server",
  "model": "Dell PowerEdge R740",
  "serial_number": "DELL123456789",
  "status": "maintenance",
  "location": "Server Room A",
  "ip_address": "192.168.1.100",
  "purchase_date": "2023-01-15",
  "warranty_expiry": "2026-01-15",
  "notes": "Under maintenance - updated notes",
  "it_glue_id": "glue_asset_123"
}
```

**Response:**
```json
{
  "id": 1,
  "client_id": 123,
  "name": "Updated Server Name",
  "type": "Server",
  "model": "Dell PowerEdge R740",
  "serial_number": "DELL123456789",
  "status": "maintenance",
  "location": "Server Room A",
  "ip_address": "192.168.1.100",
  "purchase_date": "2023-01-15",
  "warranty_expiry": "2026-01-15",
  "notes": "Under maintenance - updated notes",
  "it_glue_id": "glue_asset_123",
  "created_by": 1,
  "created_by_name": "John Doe",
  "created_at": "2023-01-15T10:30:00Z",
  "updated_at": "2023-06-01T15:45:00Z"
}
```

### 5. Delete Asset
**DELETE** `/api.php?endpoint=assets&id={asset_id}`

Deletes an asset.

**Response:**
```json
{
  "success": true,
  "message": "Asset deleted successfully"
}
```

## Asset Types
Supported asset types:
- Desktop
- Laptop
- Server
- Router
- Switch
- Firewall
- Access Point
- Printer
- Scanner
- UPS
- NAS
- Other

## Asset Statuses
Supported asset statuses:
- active
- inactive
- maintenance
- retired

## IT Glue Integration
The `it_glue_id` field allows you to store the corresponding IT Glue asset ID for synchronization purposes. This field is optional and can be used to maintain a link between your CRM assets and IT Glue assets.

## Error Responses
All endpoints return appropriate HTTP status codes and error messages:

```json
{
  "error": "Error message description"
}
```

Common error codes:
- 400: Bad Request (missing required fields)
- 401: Unauthorized (authentication required)
- 404: Not Found (asset or client not found)
- 405: Method Not Allowed (unsupported HTTP method)
- 500: Internal Server Error

## Example Usage

### cURL Example - Create Asset
```bash
curl -X POST https://your-domain.com/api.php?endpoint=assets \
  -H "Content-Type: application/json" \
  -H "Cookie: PHPSESSID=your_session_id" \
  -d '{
    "client_id": 123,
    "name": "Network Switch",
    "type": "Switch",
    "model": "Cisco Catalyst 2960",
    "serial_number": "CISCO123456",
    "status": "active",
    "location": "Network Closet",
    "ip_address": "192.168.1.1",
    "notes": "Core network switch"
  }'
```

### cURL Example - Update Asset
```bash
curl -X PUT https://your-domain.com/api.php?endpoint=assets&id=1 \
  -H "Content-Type: application/json" \
  -H "Cookie: PHPSESSID=your_session_id" \
  -d '{
    "name": "Updated Switch Name",
    "type": "Switch",
    "status": "maintenance",
    "notes": "Scheduled maintenance on Friday"
  }'
```

## Rate Limiting
Please be mindful of API rate limits. We recommend implementing appropriate delays between requests to avoid overwhelming the server.

## Support
For technical support or questions about the API integration, please contact your system administrator or refer to the main application documentation.
