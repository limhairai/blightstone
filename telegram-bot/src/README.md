# AdHub Telegram Bot

A Telegram bot for managing your agency operations without needing the web interface.

## 🚀 Quick Setup

### 1. Create Telegram Bot
1. Message [@BotFather](https://t.me/botfather) on Telegram
2. Send `/newbot` and follow instructions
3. Copy your bot token

### 2. Configure Environment
Add to your `.env` file:
```bash
TELEGRAM_BOT_TOKEN=your_bot_token_here
```

### 3. Add Your User ID
1. Message [@userinfobot](https://t.me/userinfobot) to get your Telegram user ID
2. Edit `bot/utils/auth.py` and add your ID:
```python
USER_ROLES = {
    YOUR_USER_ID: {"role": "admin", "team": "admin", "name": "Your Name"},
}
```

### 4. Install Dependencies
```bash
pip install python-telegram-bot==20.7
```

### 5. Run the Bot
```bash
python run_bot.py
```

## 📋 Commands

### Admin Commands
- `/stats` - System statistics
- `/applications` - View applications
- `/assign_team <app_id> <team>` - Assign to team
- `/system_status` - System health

### Team Lead Commands  
- `/my_applications` - Team's applications
- `/update_status <app_id> <status>` - Update status
- `/team_stats` - Team performance
- `/workload` - Team capacity

### General Commands
- `/start` - Welcome message
- `/help` - Detailed help
- `/my_status` - Your info

## 🔧 Configuration

### Teams
Edit `bot/utils/auth.py` to configure teams:
```python
TEAMS = {
    "team1": {
        "name": "Meta Specialists",
        "capacity": 20,
        "members": ["Lead Name"]
    }
}
```

### Valid Statuses
- `received` - New application
- `document_prep` - Preparing docs
- `submitted` - Submitted to platform
- `under_review` - Platform reviewing
- `approved` - Approved
- `rejected` - Rejected
- `need_documents` - Need more docs

## 🎯 Features

✅ **Real-time Operations** - Manage applications instantly  
✅ **Team Management** - Assign and track team workload  
✅ **Status Updates** - Update application statuses  
✅ **Statistics** - View performance metrics  
✅ **Document Requests** - Request client documents  
✅ **Role-based Access** - Admin, Team Lead, Team Member roles  
✅ **Interactive Buttons** - Click buttons for quick actions  
✅ **Mobile Friendly** - Works on any device with Telegram  

## 🔄 Workflow Example

1. **New Application Received**
   - Admin gets notified via `/stats`
   - Assigns to team: `/assign_team app_001 team1`

2. **Team Processes Application**
   - Team lead checks: `/my_applications`
   - Updates status: `/update_status app_001 document_prep`
   - Requests docs: `/request_documents app_001 business_license`

3. **Application Approved**
   - Update final status: `/update_status app_001 approved`
   - Track team performance: `/team_stats`

## 📱 Why Use Telegram Bot?

- **Always Available** - No need to open web browser
- **Instant Notifications** - Get updates immediately  
- **Mobile First** - Works perfectly on phones
- **Team Collaboration** - Multiple team members can use it
- **Simple Interface** - Easy commands, no complex UI
- **Reliable** - Telegram's infrastructure handles delivery

This bot allows you to run your agency operations entirely through Telegram while you build out the full web interface! 