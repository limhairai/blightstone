# AdHub Telegram Bot Setup Guide

This guide will help you set up and run the AdHub Telegram bot for managing your agency operations.

## 🚀 Quick Start

### 1. Create a Telegram Bot

1. Open Telegram and message [@BotFather](https://t.me/botfather)
2. Send `/newbot`
3. Choose a name for your bot (e.g., "AdHub Manager")
4. Choose a username for your bot (e.g., "adhub_manager_bot")
5. Copy the bot token (looks like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Configure Environment Variables

Create or update your `.env` file in the backend directory:

```bash
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Optional: Admin user IDs (comma-separated)
ADMIN_USER_IDS=123456789,987654321

# Optional: Team lead user IDs  
TEAM_LEAD_USER_IDS=555666777,888999000

# Your existing Supabase config
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### 3. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 4. Configure User Access

Edit `backend/bot/utils/auth.py` and add your Telegram user ID to the `USER_ROLES` dictionary:

```python
USER_ROLES = {
    # Replace with your actual Telegram user ID
    YOUR_TELEGRAM_USER_ID: {"role": "admin", "team": "admin", "name": "Your Name"},
    
    # Add team members
    123456789: {"role": "team_lead", "team": "team1", "name": "Team 1 Lead"},
    # ... more users
}
```

**How to find your Telegram user ID:**
1. Message [@userinfobot](https://t.me/userinfobot) on Telegram
2. It will reply with your user ID

### 5. Run the Bot

```bash
cd backend
python run_bot.py
```

You should see output like:
```
🤖 AdHub Telegram Bot
==================================================
📱 Bot Token: ✅ Set
👥 Admin Users: 1
🌐 Webhook Mode: ❌ Polling Mode
==================================================

🚀 Starting bot...
📝 Note: Add your Telegram user ID to the USER_ROLES in bot/utils/auth.py
💡 Send /start to the bot after adding your user ID
```

### 6. Test the Bot

1. Find your bot on Telegram (search for the username you created)
2. Send `/start`
3. You should receive a welcome message with available commands

## 📋 Available Commands

### 👑 Admin Commands
- `/stats` - System statistics
- `/applications` - View all applications  
- `/assign_team <app_id> <team_name>` - Assign application to team
- `/export_data` - Export system data
- `/system_status` - Check system health

### 👨‍💼 Team Lead Commands
- `/my_applications` - View team's applications
- `/update_status <app_id> <status>` - Update application status
- `/request_documents <app_id> [doc_type]` - Request client documents
- `/team_stats` - Team performance statistics
- `/workload` - Team workload overview

### 👤 General Commands
- `/start` - Initialize bot
- `/help` - Show detailed help
- `/my_status` - View your account info

## 🔧 Configuration

### Team Structure

Teams are configured in `backend/bot/utils/auth.py`:

```python
TEAMS = {
    "team1": {
        "name": "Meta Specialists",
        "description": "Facebook/Meta advertising specialists",
        "capacity": 20,
        "members": ["Team 1 Lead", "Team 1 Member 1"]
    },
    # Add more teams...
}
```

### User Roles

Three user roles are available:

1. **Admin** - Full system access
2. **Team Lead** - Team management and application updates
3. **Team Member** - View team applications and basic stats

### Application Statuses

Valid application statuses:
- `received` - New application received
- `document_prep` - Preparing documents
- `submitted` - Submitted to platform
- `under_review` - Under platform review
- `approved` - Application approved
- `rejected` - Application rejected
- `need_documents` - Additional documents required

## 🛠️ Development

### Adding New Commands

1. Create handler function in appropriate file:
   - `backend/bot/handlers/admin.py` - Admin commands
   - `backend/bot/handlers/team_lead.py` - Team lead commands

2. Register command in `backend/bot/main.py`:
```python
application.add_handler(CommandHandler("your_command", your_handler_function))
```

3. Add to bot commands menu in `BOT_COMMANDS` list

### Database Integration

Currently uses mock data. To integrate with real database:

1. Update functions in `backend/bot/utils/database.py`
2. Replace mock data with actual Supabase queries
3. Update connection settings in `backend/bot/config.py`

### Production Deployment

For production, set up webhook mode:

```bash
# In your .env file
WEBHOOK_URL=https://your-domain.com/webhook
WEBHOOK_PORT=8443
```

## 🐛 Troubleshooting

### Bot Not Responding
- Check if bot token is correct
- Verify your user ID is in `USER_ROLES`
- Check bot logs for errors

### Permission Denied
- Make sure your user ID is correctly added to `USER_ROLES`
- Verify role assignment (admin, team_lead, team_member)

### Commands Not Working
- Ensure commands are typed exactly (case-sensitive)
- Check if you have the required role for the command
- Use `/help` to see available commands for your role

### Installation Issues
- Make sure Python 3.8+ is installed
- Install dependencies: `pip install -r requirements.txt`
- Check for any missing environment variables

## 📚 Example Usage

### Admin Workflow
```
/stats                           # Check system overview
/applications                    # View recent applications
/assign_team app_001 team1       # Assign application to team
/system_status                   # Check system health
```

### Team Lead Workflow
```
/my_applications                 # View team's applications
/update_status app_001 approved  # Update application status
/request_documents app_002       # Request additional documents
/team_stats                      # Check team performance
/workload                        # Check team capacity
```

## 🔄 Integration with Existing System

The bot is designed to work alongside your existing web application:

1. **Shared Database** - Bot reads/writes to same Supabase database
2. **Real-time Updates** - Changes in bot reflect in web app and vice versa
3. **Role Sync** - User roles can be synced between systems
4. **API Integration** - Bot can call your existing API endpoints

## 🎯 Next Steps

1. **Set up the bot** following this guide
2. **Test basic functionality** with mock data
3. **Integrate with your database** by updating database functions
4. **Add team members** to the bot
5. **Customize commands** for your specific workflow
6. **Deploy to production** with webhook mode

## 📞 Support

If you encounter issues:
1. Check the logs for error messages
2. Verify environment variables are set correctly
3. Ensure user permissions are configured properly
4. Test with a simple `/start` command first 