# 🤖 AdHub Telegram Bot Setup Guide

This guide will help you set up your Telegram bot to work with your existing AdHub platform.

## 📋 Prerequisites

1. **Existing AdHub Platform**: Your backend and database should be running
2. **Telegram Bot Token**: Get one from [@BotFather](https://t.me/BotFather)
3. **Supabase Access**: Same database as your main platform
4. **Dolphin Cloud API Token**: For Meta ad account management

## 🚀 Quick Setup

### Step 1: Environment Configuration

1. Copy the environment file:
   ```bash
   cp env.example .env
   ```

2. Fill in your environment variables:
   ```bash
   # Required
   TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key

   # Optional (add when ready)
   DOLPHIN_CLOUD_TOKEN=your_dolphin_cloud_token
   PAYMENT_CREDENTIAL_ID=your_payment_credential_id
   ```

### Step 2: Database Migration

Run the database migration to add Telegram integration:

```bash
# Apply the migration to your Supabase database
# You can copy the SQL from: supabase/migrations/20250115000000_add_telegram_integration.sql
# And run it in your Supabase SQL editor
```

### Step 3: Install Dependencies

```bash
cd telegram-bot
pip install -r requirements.txt
```

### Step 4: Test Setup

```bash
python test_setup.py
```

This will verify:
- ✅ Environment variables are set
- ✅ Supabase connection works
- ✅ Telegram bot token is valid
- ✅ Dolphin Cloud API (if configured)

### Step 5: Start the Bot

```bash
python run_bot.py
```

## 🔗 Linking User Accounts

### For Users:
1. Start a chat with your bot
2. Send `/start` to see welcome message
3. Use `/link your-email@example.com` to connect their AdHub account
4. Users must use the same email as their AdHub account

### For Admins:
- Superusers in your AdHub platform automatically get admin access
- Regular organization members get access to their organization's data only

## 📱 Bot Commands

### Authentication
- `/start` - Welcome and setup
- `/link <email>` - Link AdHub account
- `/whoami` - Show account info

### Account Management
- `/organizations` - List user's organizations
- `/businesses <org_id>` - List businesses in organization
- `/accounts <business_id>` - List ad accounts for business

### Balance & Wallet
- `/wallet <org_id>` - Check wallet balance
- `/balance <account_id>` - Check ad account balance
- `/topup <account_id> <amount>` - Top up ad account

### Utilities
- `/sync <business_id>` - Sync from Dolphin Cloud
- `/help` - Show help

## 🔧 Configuration Options

### Alert Thresholds
```bash
DEFAULT_CRITICAL_THRESHOLD_DAYS=1    # Alert when < 1 day of spend left
DEFAULT_WARNING_THRESHOLD_DAYS=3     # Warning when < 3 days left
ALERT_CHECK_INTERVAL_MINUTES=60      # Check every hour
```

### Admin Users
```bash
SUPER_ADMIN_TELEGRAM_IDS=123456789,987654321  # Telegram IDs with full access
```

## 🐛 Troubleshooting

### Common Issues

1. **"Supabase connection failed"**
   - Check your `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - Ensure the database migration was applied

2. **"telegram_id column missing"**
   - Run the database migration SQL in Supabase
   - Check that the `profiles` table was updated

3. **"Bot token invalid"**
   - Get a new token from [@BotFather](https://t.me/BotFather)
   - Make sure there are no extra spaces in your `.env` file

4. **"Linking failed"**
   - User must use exact email from their AdHub account
   - Email is case-sensitive
   - Check that the user exists in your `profiles` table

### Getting Help

1. Check logs when running the bot
2. Run `python test_setup.py` to diagnose issues
3. Verify your database schema matches the migration

## 🚀 Next Steps

Once your bot is running:

1. **Test with your own account**: Link your email and test commands
2. **Add team members**: Have them link their accounts
3. **Configure Dolphin Cloud**: Add your API token for real account data
4. **Set up alerts**: Configure balance thresholds
5. **Create organization groups**: Invite clients to their dedicated groups

## 📊 Architecture

```
Telegram Bot ← → Supabase Database (same as web app)
     ↓
Dolphin Cloud API ← → Meta Business Manager
```

- **Single Database**: Bot uses same Supabase database as your web app
- **Real-time Data**: Dolphin Cloud provides live Meta account data
- **Secure**: Users must link existing accounts, no separate registration
- **Role-based**: Permissions match your existing organization structure

## 🔐 Security Notes

- Bot uses your existing user authentication system
- No separate user management needed
- Organization permissions are preserved
- Sensitive operations require appropriate roles
- All transactions are logged in your existing system

---

Need help? Check the main README or contact support! 