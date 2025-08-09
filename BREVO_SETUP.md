# Brevo Email Integration Setup

## Overview
This Kanban board now includes email notifications for:
- Task sharing notifications
- Board sharing notifications  
- Note update notifications for shared tasks

## Setup Instructions

### 1. Get Your Brevo API Key
1. Sign up/login to [Brevo](https://www.brevo.com/)
2. Go to Settings → API Keys
3. Create a new API key with "SMTP" permissions
4. Copy your API key

### 2. Configure the API Key

**Option A: .env File (Recommended)**
Create a `.env` file in the root directory:
```
BREVO_API_KEY=your-actual-brevo-api-key
```

**Option B: Environment Variable**
```bash
export BREVO_API_KEY="your-actual-brevo-api-key"
```

**Option C: Direct Configuration (Not Recommended)**
Edit `api/brevo_config.php` and replace:
```php
putenv('BREVO_API_KEY=your-brevo-api-key-here');
```
with:
```php
putenv('BREVO_API_KEY=your-actual-brevo-api-key');
```

### 3. Test the Integration
Run the test script:
```bash
php test_brevo_api.php
```

The application now automatically loads environment variables from the `.env` file using the `api/env_loader.php` utility.

### 4. Features

#### Task Sharing
- When you share a task with someone, they receive an email notification
- Email includes task name and who shared it with them

#### Board Sharing  
- When you share a board with someone, they receive an email notification
- Email includes board name and who shared it with them

#### Note Updates
- When someone adds a note to a shared task, the task owner receives an email
- Email includes the note content and who added it

### 5. Email Templates
The emails are beautifully formatted with:
- Professional HTML styling
- Clear headers and content sections
- Action buttons (when applicable)
- Responsive design

### 6. Troubleshooting
- Check the server error logs for email delivery issues
- Verify your Brevo API key is correct
- Ensure your Brevo account has sufficient email credits
- Test with a valid email address

### 7. Security Notes
- ✅ API key is now stored securely in `.env` file
- ✅ `.env` file is added to `.gitignore` to prevent accidental commits
- ✅ Environment variables are loaded automatically by the application
- ✅ Hardcoded API keys have been removed from all files
- Use environment variables or .env files for production
- Never commit your actual API key to version control 