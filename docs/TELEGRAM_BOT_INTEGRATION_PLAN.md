# 🤖 Telegram Bot Integration - Connected Account Model

## 📋 Overview

This document outlines the improved approach for integrating AdHub's Telegram bot using a "Connected Account" model instead of the previous access codes system. This approach ensures all bot users are properly authenticated web app users first, while supporting multi-organization access.

## 🎯 Key Principles

### ✅ What We Want
- **Proper user flow** - Users must sign up on web app first
- **Personal codes** - Each user gets their own code, not org-level
- **Multi-org support** - One bot account accesses all user's organizations
- **Better security** - Codes tied to authenticated web app users
- **No admin involvement** - Self-service for users
- **Audit trail** - Complete tracking of connections and usage

### ❌ What We're Avoiding
- Anonymous bot signups
- Admin-managed access codes
- Org-level codes that don't scale
- Users bypassing main onboarding flow

## 🔄 User Flow

```mermaid
graph TD
    A[User Signs Up on Web App] --> B[Complete Onboarding]
    B --> C[User Settings Page]
    C --> D[Connect Telegram Bot]
    D --> E[Generate Personal Access Code]
    E --> F[User Opens Telegram Bot]
    F --> G[/start PERSONAL_CODE]
    G --> H[Bot Links to User Account]
    H --> I[Access All Organizations]
    I --> J[Select Organization Context]
    J --> K[Full Bot Features Available]
```

## 🗄️ Database Schema

### New Tables

```sql
-- User-specific access codes (not org-specific)
CREATE TABLE IF NOT EXISTS public.telegram_access_codes (
    code_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    code TEXT UNIQUE NOT NULL,
    telegram_user_id BIGINT UNIQUE, -- Once linked, becomes permanent
    telegram_username TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'linked', 'expired', 'revoked')),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
    linked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bot session management
CREATE TABLE IF NOT EXISTS public.telegram_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    telegram_user_id BIGINT NOT NULL,
    current_organization_id UUID REFERENCES public.organizations(organization_id),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bot activity logging
CREATE TABLE IF NOT EXISTS public.telegram_activity_log (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES public.profiles(profile_id) ON DELETE CASCADE,
    telegram_user_id BIGINT NOT NULL,
    organization_id UUID REFERENCES public.organizations(organization_id),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Schema Updates

```sql
-- Add telegram fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS telegram_id BIGINT UNIQUE,
ADD COLUMN IF NOT EXISTS telegram_username TEXT,
ADD COLUMN IF NOT EXISTS telegram_connected_at TIMESTAMPTZ;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_telegram_access_codes_profile_id ON public.telegram_access_codes(profile_id);
CREATE INDEX IF NOT EXISTS idx_telegram_access_codes_telegram_user_id ON public.telegram_access_codes(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_profile_id ON public.telegram_sessions(profile_id);
CREATE INDEX IF NOT EXISTS idx_telegram_sessions_telegram_user_id ON public.telegram_sessions(telegram_user_id);
```

## 🖥️ Web App Integration

### User Settings Page

New section in user settings:

```typescript
// components/settings/TelegramIntegration.tsx
interface TelegramIntegrationProps {
  user: UserProfile;
}

export function TelegramIntegration({ user }: TelegramIntegrationProps) {
  const [accessCode, setAccessCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'pending' | 'connected'>('disconnected');
  
  const generateAccessCode = async () => {
    // Generate personal access code
    // POST /api/telegram/generate-code
  };
  
  const revokeAccess = async () => {
    // Revoke telegram access
    // POST /api/telegram/revoke
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>🤖 Telegram Bot Integration</CardTitle>
        <CardDescription>
          Connect your Telegram account to manage your AdHub organizations on the go
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'disconnected' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Get instant access to your account balances, submit topup requests, and monitor your ad accounts directly from Telegram.
            </p>
            <Button onClick={generateAccessCode}>
              Connect Telegram Bot
            </Button>
          </div>
        )}
        
        {status === 'pending' && accessCode && (
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium">📱 Connection Instructions</h4>
              <ol className="mt-2 text-sm space-y-1">
                <li>1. Open Telegram</li>
                <li>2. Find @adhubtechbot</li>
                <li>3. Send: <code>/start {accessCode}</code></li>
              </ol>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Code expires in 24 hours
              </span>
              <Button variant="outline" onClick={generateAccessCode}>
                Generate New Code
              </Button>
            </div>
          </div>
        )}
        
        {status === 'connected' && (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-sm">
                Connected as @{user.telegram_username}
              </span>
            </div>
            <Button variant="destructive" onClick={revokeAccess}>
              Disconnect Bot
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

## 🤖 Bot Implementation

### Connection Flow

```python
# telegram-bot/src/handlers/connection.py
class ConnectionHandler:
    async def handle_start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        telegram_id = update.effective_user.id
        telegram_username = update.effective_user.username
        
        # Check if user is already connected
        existing_connection = await self.get_existing_connection(telegram_id)
        if existing_connection:
            await self.show_main_menu(update, context, existing_connection)
            return
        
        # Check if access code provided
        if context.args and len(context.args) > 0:
            access_code = context.args[0].upper()
            await self.process_connection(update, context, access_code)
        else:
            await self.show_connection_instructions(update, context)
    
    async def process_connection(self, update: Update, context: ContextTypes.DEFAULT_TYPE, code: str):
        telegram_id = update.effective_user.id
        telegram_username = update.effective_user.username
        
        # Validate and link access code
        result = await self.backend_api.link_telegram_account(
            code=code,
            telegram_id=telegram_id,
            telegram_username=telegram_username
        )
        
        if result['success']:
            user_profile = result['user_profile']
            organizations = result['organizations']
            
            # Success message
            await update.message.reply_text(
                f"✅ **Connected to AdHub!**\n\n"
                f"Welcome back, {user_profile['name']}! 👋\n\n"
                f"You have access to {len(organizations)} organization(s)."
            )
            
            # Show organization selector if multiple orgs
            if len(organizations) > 1:
                await self.show_organization_selector(update, context, organizations)
            else:
                await self.set_organization_context(update, context, organizations[0])
        else:
            await update.message.reply_text(
                f"❌ **Connection Failed**\n\n"
                f"Error: {result['error']}\n\n"
                f"Please generate a new code from your AdHub settings."
            )
```

### Multi-Organization Support

```python
# telegram-bot/src/handlers/organization.py
class OrganizationHandler:
    async def show_organization_selector(self, update: Update, context: ContextTypes.DEFAULT_TYPE, organizations: List[Dict]):
        keyboard = []
        for i, org in enumerate(organizations):
            keyboard.append([
                InlineKeyboardButton(
                    f"🏢 {org['name']}", 
                    callback_data=f"select_org_{org['id']}"
                )
            ])
        
        keyboard.append([
            InlineKeyboardButton("❓ Help", callback_data="help")
        ])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        message = "🏢 **Select Organization**\n\n"
        message += "Choose which organization you'd like to manage:"
        
        await update.message.reply_text(
            message,
            parse_mode='Markdown',
            reply_markup=reply_markup
        )
    
    async def switch_organization(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        telegram_id = update.effective_user.id
        
        # Get user's organizations
        organizations = await self.backend_api.get_user_organizations(telegram_id)
        
        if len(organizations) <= 1:
            await update.message.reply_text(
                "You only have access to one organization."
            )
            return
        
        await self.show_organization_selector(update, context, organizations)
```

## 🔐 Security Features

### Access Code Generation

```python
# backend/app/api/endpoints/telegram.py
@router.post("/generate-code")
async def generate_telegram_access_code(
    current_user: dict = Depends(get_current_user)
):
    """Generate a personal access code for telegram bot connection"""
    supabase = get_supabase_client()
    
    try:
        # Revoke any existing pending codes
        await supabase.table("telegram_access_codes").update({
            "status": "revoked"
        }).eq("profile_id", current_user["profile_id"]).eq("status", "pending").execute()
        
        # Generate new code
        access_code = generate_secure_code(8)
        
        # Insert new code
        code_data = {
            "profile_id": current_user["profile_id"],
            "code": access_code,
            "status": "pending",
            "expires_at": (datetime.utcnow() + timedelta(hours=24)).isoformat()
        }
        
        response = await supabase.table("telegram_access_codes").insert(code_data).execute()
        
        return {
            "success": True,
            "code": access_code,
            "expires_at": code_data["expires_at"]
        }
        
    except Exception as e:
        logger.error(f"Error generating access code: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate access code")
```

### Connection Validation

```python
@router.post("/link-account")
async def link_telegram_account(
    code: str,
    telegram_id: int,
    telegram_username: str = None
):
    """Link telegram account using access code"""
    supabase = get_supabase_client()
    
    try:
        # Validate code
        code_response = await supabase.table("telegram_access_codes").select(
            "*, profiles(*)"
        ).eq("code", code.upper()).eq("status", "pending").single().execute()
        
        if not code_response.data:
            return {"success": False, "error": "Invalid or expired code"}
        
        code_data = code_response.data
        
        # Check expiration
        if datetime.fromisoformat(code_data["expires_at"]) < datetime.utcnow():
            return {"success": False, "error": "Code has expired"}
        
        # Update profiles table with telegram info
        await supabase.table("profiles").update({
            "telegram_id": telegram_id,
            "telegram_username": telegram_username,
            "telegram_connected_at": datetime.utcnow().isoformat()
        }).eq("profile_id", code_data["profile_id"]).execute()
        
        # Mark code as linked
        await supabase.table("telegram_access_codes").update({
            "status": "linked",
            "telegram_user_id": telegram_id,
            "telegram_username": telegram_username,
            "linked_at": datetime.utcnow().isoformat()
        }).eq("code_id", code_data["code_id"]).execute()
        
        # Get user's organizations
        orgs_response = await supabase.table("organization_members").select(
            "*, organizations(*)"
        ).eq("user_id", code_data["profile_id"]).execute()
        
        organizations = [member["organizations"] for member in orgs_response.data]
        
        return {
            "success": True,
            "user_profile": code_data["profiles"],
            "organizations": organizations
        }
        
    except Exception as e:
        logger.error(f"Error linking telegram account: {e}")
        return {"success": False, "error": "System error occurred"}
```

## 📊 Features Available in Bot

### Core Features
- **Balance Checking** - View wallet and account balances
- **Topup Requests** - Submit funding requests for ad accounts
- **Account Monitoring** - Check ad account status and spend
- **Organization Switching** - Switch between multiple organizations
- **Transaction History** - View recent transactions
- **Alerts** - Get notifications for low balances, failed campaigns

### Command Structure
```
/start [CODE] - Connect account or show main menu
/balance - Show wallet and account balances
/topup - Submit a topup request
/accounts - List ad accounts and their status
/org - Switch organization (if multiple)
/transactions - View recent transactions
/help - Show available commands
/settings - Bot preferences
```

## 🔍 Monitoring & Analytics

### Activity Tracking
- All bot actions logged to `telegram_activity_log`
- User engagement metrics
- Popular commands and features
- Error tracking and debugging

### Security Monitoring
- Failed connection attempts
- Unusual activity patterns
- Code generation frequency
- Access revocation tracking

## 🚀 Implementation Phases

### Phase 1: Database & Backend (Week 1)
- [ ] Create database tables
- [ ] Implement backend API endpoints
- [ ] Add telegram fields to profiles
- [ ] Create access code generation system

### Phase 2: Web App Integration (Week 2)
- [ ] Add telegram section to user settings
- [ ] Implement connection flow UI
- [ ] Add status tracking and management
- [ ] Create revocation functionality

### Phase 3: Bot Core Features (Week 3)
- [ ] Implement connection handler
- [ ] Add organization selection
- [ ] Create session management
- [ ] Implement basic commands (balance, accounts)

### Phase 4: Advanced Features (Week 4)
- [ ] Add topup request functionality
- [ ] Implement transaction history
- [ ] Add notification system
- [ ] Create admin monitoring tools

### Phase 5: Testing & Launch (Week 5)
- [ ] Comprehensive testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Production deployment

## 🎯 Success Metrics

### User Adoption
- % of web app users who connect telegram
- Daily/weekly active bot users
- Feature usage distribution

### Engagement
- Commands per user per day
- Session duration
- User retention rates

### Business Impact
- Reduced support tickets
- Faster topup request processing
- Improved user satisfaction scores

---

## 📝 Notes for Future Implementation

### Technical Considerations
- Use Redis for session management and caching
- Implement rate limiting for bot commands
- Add webhook support for real-time notifications
- Consider bot API limits and scaling

### UX Improvements
- Rich message formatting with buttons
- Inline keyboards for quick actions
- Progress indicators for long operations
- Error handling with helpful suggestions

### Security Enhancements
- Two-factor authentication for sensitive operations
- IP whitelisting for bot server
- Encrypted storage of sensitive data
- Regular security audits

---

**Status: 📋 Ready for Implementation**  
**Priority: 🔸 Medium (Post-Production Launch)**  
**Estimated Effort: 5 weeks**  
**Dependencies: Production web app, stable API** 