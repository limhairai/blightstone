"""
Authentication handlers for Telegram bot
Handles linking Telegram accounts to existing user accounts
"""

from telegram import Update
from telegram.ext import ContextTypes
from services.supabase_service import SupabaseService
import logging

logger = logging.getLogger(__name__)

class AuthHandler:
    def __init__(self):
        self.supabase_service = SupabaseService()
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /start command"""
        user = update.effective_user
        telegram_id = user.id
        
        # Check if user is already linked
        telegram_user = self.supabase_service.get_user_by_telegram_id(telegram_id)
        
        if telegram_user:
            # User is already linked
            orgs = self.supabase_service.get_user_organizations(telegram_user.user_id)
            
            welcome_message = f"""
🚀 **Welcome back to AdHub Bot!**

👋 Hello {telegram_user.name or telegram_user.email}!

📊 **Your Organizations:** {len(orgs)}
🏢 **Total Businesses:** {sum(org.current_businesses_count for org in orgs)}

**Quick Commands:**
• `/organizations` - View your organizations
• `/help` - See all available commands
• `/wallet <org_id>` - Check wallet balance

Ready to manage your ad accounts! 🎯
            """
        else:
            # User needs to link their account
            welcome_message = f"""
🚀 **Welcome to AdHub Bot!**

👋 Hello {user.first_name}!

To get started, you need to link your Telegram account to your existing AdHub account.

**How to link your account:**
1. Use the command: `/link your-email@example.com`
2. Make sure you use the same email as your AdHub account

**Don't have an AdHub account yet?**
Visit our website to create one first, then come back here to link it.

Need help? Contact our support team.
            """
        
        await update.message.reply_text(welcome_message, parse_mode='Markdown')
    
    async def link_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /link command to link Telegram account to email"""
        if not context.args:
            await update.message.reply_text(
                "❌ **Usage:** `/link your-email@example.com`\n\n"
                "Please provide the email address associated with your AdHub account.",
                parse_mode='Markdown'
            )
            return
        
        email = context.args[0].lower().strip()
        telegram_id = update.effective_user.id
        
        # Validate email format (basic check)
        if '@' not in email or '.' not in email:
            await update.message.reply_text(
                "❌ **Invalid email format**\n\n"
                "Please provide a valid email address.",
                parse_mode='Markdown'
            )
            return
        
        # Check if this Telegram ID is already linked
        existing_user = self.supabase_service.get_user_by_telegram_id(telegram_id)
        if existing_user:
            await update.message.reply_text(
                f"❌ **Already Linked**\n\n"
                f"Your Telegram account is already linked to: {existing_user.email}\n\n"
                f"If you need to change this, please contact support.",
                parse_mode='Markdown'
            )
            return
        
        # Attempt to link the account
        success = self.supabase_service.link_telegram_user(telegram_id, email)
        
        if success:
            # Get the linked user data
            telegram_user = self.supabase_service.get_user_by_telegram_id(telegram_id)
            
            if telegram_user:
                orgs = self.supabase_service.get_user_organizations(telegram_user.user_id)
                
                success_message = f"""
✅ **Account Linked Successfully!**

📧 **Email:** {email}
👤 **Name:** {telegram_user.name or 'Not set'}
🏢 **Organizations:** {len(orgs)}

**Next Steps:**
• Use `/organizations` to see your organizations
• Use `/help` to see all available commands
• Use `/wallet <org_id>` to check balances

Welcome to AdHub Bot! 🎉
                """
                
                await update.message.reply_text(success_message, parse_mode='Markdown')
            else:
                await update.message.reply_text(
                    "✅ **Account linked, but there was an issue retrieving your data.**\n\n"
                    "Please try using `/start` again.",
                    parse_mode='Markdown'
                )
        else:
            await update.message.reply_text(
                f"❌ **Linking Failed**\n\n"
                f"Could not link your Telegram account to {email}.\n\n"
                f"**Possible reasons:**\n"
                f"• Email not found in our system\n"
                f"• Email already linked to another Telegram account\n"
                f"• Temporary system issue\n\n"
                f"Please check your email address or contact support.",
                parse_mode='Markdown'
            )
    
    async def unlink_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /unlink command"""
        telegram_id = update.effective_user.id
        
        # Check if user is linked
        telegram_user = self.supabase_service.get_user_by_telegram_id(telegram_id)
        
        if not telegram_user:
            await update.message.reply_text(
                "❌ **Not Linked**\n\n"
                "Your Telegram account is not linked to any AdHub account.",
                parse_mode='Markdown'
            )
            return
        
        # For security, unlinking should be done through support
        await update.message.reply_text(
            f"🔒 **Account Unlinking**\n\n"
            f"For security reasons, account unlinking must be done through our support team.\n\n"
            f"**Current linked email:** {telegram_user.email}\n\n"
            f"Please contact support to unlink your account.",
            parse_mode='Markdown'
        )
    
    async def whoami_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /whoami command to show current user info"""
        telegram_id = update.effective_user.id
        
        telegram_user = self.supabase_service.get_user_by_telegram_id(telegram_id)
        
        if not telegram_user:
            await update.message.reply_text(
                "❌ **Not Linked**\n\n"
                "Your Telegram account is not linked to any AdHub account.\n\n"
                "Use `/link your-email@example.com` to get started.",
                parse_mode='Markdown'
            )
            return
        
        # Get organizations
        orgs = self.supabase_service.get_user_organizations(telegram_user.user_id)
        
        info_message = f"""
👤 **Your Account Information**

📧 **Email:** {telegram_user.email}
👤 **Name:** {telegram_user.name or 'Not set'}
🆔 **User ID:** `{telegram_user.user_id}`
🔒 **Superuser:** {'Yes' if telegram_user.is_superuser else 'No'}

🏢 **Organizations:** {len(orgs)}
        """
        
        if orgs:
            info_message += "\n**Organization Details:**\n"
            for org in orgs:
                role = telegram_user.roles.get(org.id, 'member')
                status_emoji = "✅" if org.verification_status == "approved" else "⏳"
                wallet_balance = org.wallet_balance_cents / 100
                
                info_message += f"""
{status_emoji} **{org.name}**
   • Role: {role.title()}
   • Plan: {org.plan_id.title()}
   • Businesses: {org.current_businesses_count}
   • Wallet: ${wallet_balance:.2f}
   • ID: `{org.id}`
                """
        
        await update.message.reply_text(info_message, parse_mode='Markdown')

# Create handler instance
auth_handler = AuthHandler() 