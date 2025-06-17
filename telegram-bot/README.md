# AdHub Telegram Bot

A standalone Telegram bot for managing your ad agency operations without needing a web interface.

## 🎯 **Why Telegram Bot First?**

- **Real user feedback** before building complex UI
- **Faster iteration** - No frontend development needed  
- **Mobile-first** - Works perfectly on phones
- **Always available** - No need to open browsers
- **Team collaboration** - Multiple users simultaneously
- **Cost effective** - Minimal hosting requirements

## 🚀 **Quick Start**

### 1. Create Your Bot
```bash
# Message @BotFather on Telegram
# Send: /newbot
# Follow instructions and copy your token
```

### 2. Setup Environment
```bash
# Create .env file
cp .env.example .env

# Add your bot token
TELEGRAM_BOT_TOKEN=your_token_here
```

### 3. Install & Run
```bash
# Install dependencies
pip install -r requirements.txt

# Run the bot
python run_bot.py
```

### 4. Configure Access
```bash
# Get your Telegram user ID from @userinfobot
# Edit src/utils/auth.py and add your ID:

USER_ROLES = {
    YOUR_USER_ID: {"role": "admin", "team": "admin", "name": "Your Name"},
}
```

## 📋 **Features**

### **Admin Commands**
- `/stats` - System overview with interactive buttons
- `/applications` - View and manage all applications  
- `/assign_team <app_id> <team>` - Assign applications to teams
- `/export_data` - Export system data
- `/system_status` - Check system health

### **Team Lead Commands**
- `/my_applications` - View team's applications
- `/update_status <app_id> <status>` - Update application status
- `/request_documents <app_id> [type]` - Request client documents
- `/team_stats` - Team performance metrics
- `/workload` - Team capacity overview

### **General Commands**
- `/start` - Welcome and setup
- `/help` - Detailed command help
- `/my_status` - Your account information

## 🏗️ **Architecture**

```
telegram-bot/
├── src/
│   ├── main.py              # Bot application entry point
│   ├── config.py            # Configuration and settings
│   ├── handlers/
│   │   ├── admin.py         # Admin command handlers
│   │   └── team_lead.py     # Team lead command handlers
│   └── utils/
│       ├── auth.py          # User authentication & roles
│       ├── database.py      # Database operations
│       └── formatting.py    # Message formatting utilities
├── requirements.txt         # Python dependencies
├── run_bot.py              # Bot runner script
├── Dockerfile              # Container deployment
└── README.md               # This file
```

## 🔧 **Configuration**

### **Teams Setup**
Edit `src/utils/auth.py`:
```python
TEAMS = {
    "team1": {
        "name": "Meta Specialists",
        "description": "Facebook/Meta advertising specialists", 
        "capacity": 20,
        "members": ["Lead Name", "Member 1", "Member 2"]
    },
    "team2": {
        "name": "Growth Team",
        "description": "Growth and scaling specialists",
        "capacity": 20, 
        "members": ["Lead Name", "Member 1"]
    }
}
```

### **User Roles**
```python
USER_ROLES = {
    123456789: {"role": "admin", "team": "admin", "name": "Admin User"},
    987654321: {"role": "team_lead", "team": "team1", "name": "Team 1 Lead"},
    876543210: {"role": "team_member", "team": "team1", "name": "Team 1 Member"},
}
```

## 📊 **Application Workflow**

### **Current Flow (Internal)**
1. **New Application** → Admin notified via `/stats`
2. **Assignment** → `/assign_team app_001 team1` 
3. **Processing** → Team lead: `/my_applications`
4. **Status Updates** → `/update_status app_001 document_prep`
5. **Document Requests** → `/request_documents app_001 business_license`
6. **Completion** → `/update_status app_001 approved`

### **Future Flow (With Clients)**
1. **Client Submission** → Typeform → Webhook → Bot
2. **Group Creation** → Bot creates client + team group
3. **Team Notification** → Admin chat notified
4. **Processing** → Same as above
5. **Client Updates** → Status sent to client group

## 🌐 **Deployment**

### **Development (Local)**
```bash
python run_bot.py
# Uses polling mode - no hosting needed
```

### **Production (Hosted)**

**Option 1: Render**
```bash
# Connect GitHub repo
# Set environment variables
# Deploy automatically
```

**Option 2: Railway**
```bash
railway login
railway init
railway add
railway deploy
```

**Option 3: Docker**
```bash
docker build -t adhub-bot .
docker run -d --env-file .env adhub-bot
```

### **Environment Variables**
```bash
# Required
TELEGRAM_BOT_TOKEN=your_bot_token

# Optional
WEBHOOK_URL=https://your-domain.com/webhook  # For production
WEBHOOK_PORT=8443
SUPABASE_URL=your_supabase_url              # When integrating DB
SUPABASE_KEY=your_supabase_key
```

## 🔄 **Integration Roadmap**

### **Phase 1: Internal Operations** ✅
- [x] Basic bot setup
- [x] Admin commands
- [x] Team management  
- [x] Mock data integration
- [x] Role-based access

### **Phase 2: Client Integration** 🚧
- [ ] Typeform webhook integration
- [ ] Group chat management
- [ ] Document upload handling
- [ ] Client notifications

### **Phase 3: Advanced Features** 📋
- [ ] Database integration (replace mock data)
- [ ] Analytics and reporting
- [ ] Automated workflows
- [ ] Performance monitoring
- [ ] Multi-language support

## 📱 **Client Application Options**

### **Option 1: Typeform + Group Chat** (Recommended)
```
Client → Typeform → Bot → Creates Group → Team processes
```
**Pros:** Structured data + conversational follow-up

### **Option 2: Direct Group Chat**
```
Client → Group Chat → Bot processes → Team notified
```
**Pros:** Simple, immediate
**Cons:** Less structured

### **Option 3: Bot DM**
```
Client → Bot DM → Guided form → Team notified
```
**Pros:** Private, structured
**Cons:** More complex to build

## 💡 **Why This Approach Works**

**Real-world Examples:**
- **Zapier** started with manual processes
- **Stripe** began with simple tools
- **Airbnb** used basic internal tools first

**Benefits:**
- **Validate workflows** before building complex UI
- **Faster time to market** - Start operations immediately
- **Lower development cost** - No frontend initially
- **Better product-market fit** - Build what users actually need
- **Team adoption** - Everyone already uses Telegram

## 🎯 **Success Metrics**

Track these to measure bot effectiveness:
- **Response time** - How quickly team responds
- **Processing time** - Application completion speed  
- **Team utilization** - Workload distribution
- **Client satisfaction** - Feedback from groups
- **Error rates** - Failed operations

## 🔗 **Related Projects**

- **Frontend** - `/frontend/` - Next.js web application
- **Backend** - `/backend/` - FastAPI for web app
- **Shared** - `/shared/` - Common utilities and types

## 📞 **Support**

- Check logs for error messages
- Verify environment variables
- Test with `/start` command first
- Ensure user permissions are set correctly

---

**This bot allows you to run your entire agency through Telegram while you build the full web application!** 