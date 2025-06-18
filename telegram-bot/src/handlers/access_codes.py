"""
Access Code System for AdHub Telegram Bot
Inspired by BullX - Secure authentication via access codes generated from web app
"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from src.services.supabase_service import SupabaseService
import logging
import secrets
import string
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

class AccessCodeManager:
    def __init__(self):
        self.supabase_service = SupabaseService()
        self.webapp_url = "https://adhub.tech"  # Your web app URL
        self.bot_username = os.getenv("BOT_USERNAME", "adhubtechbot")  # Your bot username
    
    def generate_access_code(self, length: int = 8) -> str:
        """Generate a secure access code"""
        # Use uppercase letters and numbers like BullX
        characters = string.ascii_uppercase + string.digits
        return ''.join(secrets.choice(characters) for _ in range(length))
    
    async def create_access_code(self, user_id: str, organization_id: str, 
                               max_uses: int = 1, expires_hours: int = 24,
                               code_type: str = "user_invite") -> Dict[str, Any]:
        """Create an access code for user/group invitation"""
        try:
            access_code = self.generate_access_code()
            expires_at = datetime.utcnow() + timedelta(hours=expires_hours)
            
            code_data = {
                "code": access_code,
                "created_by_user_id": user_id,
                "organization_id": organization_id,
                "code_type": code_type,  # 'user_invite', 'group_invite', 'admin_invite'
                "max_uses": max_uses,
                "current_uses": 0,
                "expires_at": expires_at.isoformat(),
                "is_active": True
            }
            
            response = (
                self.supabase_service.client.table("access_codes")
                .insert(code_data)
                .execute()
            )
            
            if response.data:
                logger.info(f"Created access code {access_code} for org {organization_id}")
                return response.data[0]
            else:
                raise Exception("Failed to create access code")
                
        except Exception as e:
            logger.error(f"Error creating access code: {e}")
            raise e
    
    async def validate_access_code(self, code: str) -> Optional[Dict[str, Any]]:
        """Validate an access code"""
        try:
            response = (
                self.supabase_service.client.table("access_codes")
                .select("*, organizations(name)")
                .eq("code", code.upper())
                .eq("is_active", True)
                .single()
                .execute()
            )
            
            if not response.data:
                return None
            
            code_data = response.data
            
            # Check if expired
            expires_at = datetime.fromisoformat(code_data["expires_at"].replace('Z', '+00:00'))
            if datetime.utcnow().replace(tzinfo=expires_at.tzinfo) > expires_at:
                return None
            
            # Check if max uses exceeded
            if code_data["current_uses"] >= code_data["max_uses"]:
                return None
            
            return code_data
            
        except Exception as e:
            logger.error(f"Error validating access code {code}: {e}")
            return None
    
    async def redeem_access_code(self, code: str, telegram_id: int, 
                               telegram_username: str = None) -> Dict[str, Any]:
        """Redeem an access code and link user"""
        try:
            # Validate code first
            code_data = await self.validate_access_code(code)
            if not code_data:
                return {"success": False, "error": "Invalid or expired access code"}
            
            # Check if user is already linked
            existing_user = self.supabase_service.get_user_by_telegram_id(telegram_id)
            if existing_user:
                return {"success": False, "error": "Your Telegram is already linked to an AdHub account"}
            
            # Get organization info
            org_id = code_data["organization_id"]
            org_name = code_data["organizations"]["name"]
            
            # Create or link user account
            user_data = await self.create_user_from_code(
                code_data, telegram_id, telegram_username
            )
            
            if not user_data:
                return {"success": False, "error": "Failed to create user account"}
            
            # Increment code usage
            await self.increment_code_usage(code)
            
            # Log the redemption
            await self.log_code_redemption(code, telegram_id, user_data["id"])
            
            return {
                "success": True,
                "user_id": user_data["id"],
                "organization_id": org_id,
                "organization_name": org_name,
                "code_type": code_data["code_type"]
            }
            
        except Exception as e:
            logger.error(f"Error redeeming access code {code}: {e}")
            return {"success": False, "error": "System error occurred"}
    
    async def create_user_from_code(self, code_data: Dict[str, Any], 
                                  telegram_id: int, telegram_username: str = None) -> Optional[Dict[str, Any]]:
        """Create user account from access code redemption"""
        try:
            # Generate temporary email if needed
            temp_email = f"telegram_{telegram_id}@adhub.temp"
            display_name = telegram_username or f"User_{telegram_id}"
            
            # Create user profile
            user_data = {
                "email": temp_email,
                "name": display_name,
                "telegram_id": telegram_id,
                "telegram_username": telegram_username,
                "created_via": "access_code",
                "source_code": code_data["code"]
            }
            
            response = (
                self.supabase_service.client.table("profiles")
                .insert(user_data)
                .execute()
            )
            
            if not response.data:
                return None
            
            user_id = response.data[0]["id"]
            
            # Add user to organization with appropriate role
            role = "member"  # Default role, can be upgraded later
            if code_data["code_type"] == "admin_invite":
                role = "admin"
            
            member_data = {
                "user_id": user_id,
                "organization_id": code_data["organization_id"],
                "role": role,
                "invited_by": code_data["created_by_user_id"],
                "joined_via": "access_code"
            }
            
            (
                self.supabase_service.client.table("organization_members")
                .insert(member_data)
                .execute()
            )
            
            return response.data[0]
            
        except Exception as e:
            logger.error(f"Error creating user from code: {e}")
            return None
    
    async def increment_code_usage(self, code: str) -> bool:
        """Increment the usage count of an access code"""
        try:
            response = (
                self.supabase_service.client.table("access_codes")
                .update({"current_uses": "current_uses + 1"})
                .eq("code", code.upper())
                .execute()
            )
            
            return bool(response.data)
            
        except Exception as e:
            logger.error(f"Error incrementing code usage: {e}")
            return False
    
    async def log_code_redemption(self, code: str, telegram_id: int, user_id: str) -> bool:
        """Log access code redemption"""
        try:
            log_data = {
                "access_code": code,
                "telegram_id": telegram_id,
                "user_id": user_id,
                "redeemed_at": datetime.utcnow().isoformat()
            }
            
            response = (
                self.supabase_service.client.table("access_code_redemptions")
                .insert(log_data)
                .execute()
            )
            
            return bool(response.data)
            
        except Exception as e:
            logger.error(f"Error logging code redemption: {e}")
            return False
    
    async def handle_start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /start command with potential access code"""
        telegram_id = update.effective_user.id
        telegram_username = update.effective_user.username
        
        # Check if user is already linked
        existing_user = self.supabase_service.get_user_by_telegram_id(telegram_id)
        if existing_user:
            # User already linked, show main menu
            from src.handlers.interactive_menus import InteractiveMenus
            interactive_menus = InteractiveMenus()
            await interactive_menus.show_main_menu(update, context)
            return
        
        # Check if access code provided
        if context.args and len(context.args) > 0:
            access_code = context.args[0].upper()
            await self.process_access_code(update, context, access_code)
        else:
            await self.show_welcome_screen(update, context)
    
    async def process_access_code(self, update: Update, context: ContextTypes.DEFAULT_TYPE, 
                                access_code: str) -> None:
        """Process access code redemption"""
        telegram_id = update.effective_user.id
        telegram_username = update.effective_user.username
        
        # Show processing message
        processing_msg = await update.message.reply_text(
            "🔄 **Processing your access code...**\n\n"
            f"Code: `{access_code}`",
            parse_mode='Markdown'
        )
        
        # Redeem the code
        result = await self.redeem_access_code(access_code, telegram_id, telegram_username)
        
        if result["success"]:
            # Success! Show welcome message
            keyboard = [
                [InlineKeyboardButton("🎯 Open Dashboard", callback_data="menu_main")],
                [InlineKeyboardButton("🌐 Visit Web App", url=self.webapp_url)],
                [InlineKeyboardButton("❓ Get Help", callback_data="menu_help")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            success_message = f"✅ **Access Granted to AdHub!** ⚡\n\n"
            success_message += f"🎉 **Congratulations!** Your access code has been redeemed.\n\n"
            success_message += f"🏢 **Organization:** {result['organization_name']}\n"
            success_message += f"👤 **Account Type:** {result['code_type'].replace('_', ' ').title()}\n\n"
            success_message += f"🚀 **Enjoy the most advanced ad account management system.**\n"
            success_message += f"Multi-wallet, multi-platform, lightning fast.\n\n"
            success_message += f"🎯 **Ready to start managing your ad accounts!**"
            
            await processing_msg.edit_text(
                success_message,
                parse_mode='Markdown',
                reply_markup=reply_markup
            )
            
            logger.info(f"User {telegram_id} successfully redeemed code {access_code}")
            
        else:
            # Error occurred
            keyboard = [
                [InlineKeyboardButton("🔄 Try Again", callback_data="action_enter_code")],
                [InlineKeyboardButton("🌐 Get Access Code", url=f"{self.webapp_url}/invite")],
                [InlineKeyboardButton("❓ Get Help", url=f"{self.webapp_url}/support")]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            
            error_message = f"❌ **Access Code Invalid**\n\n"
            error_message += f"**Error:** {result['error']}\n\n"
            error_message += f"**Common issues:**\n"
            error_message += f"• Code has expired\n"
            error_message += f"• Code has been used up\n"
            error_message += f"• Code was typed incorrectly\n\n"
            error_message += f"**Need a new code?** Get one from your AdHub dashboard."
            
            await processing_msg.edit_text(
                error_message,
                parse_mode='Markdown',
                reply_markup=reply_markup
            )
    
    async def show_welcome_screen(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Show welcome screen for new users (like BullX)"""
        keyboard = [
            [InlineKeyboardButton("🔑 Enter Access Code", callback_data="action_enter_code")],
            [InlineKeyboardButton("🌐 Get Access Code", url=f"{self.webapp_url}/invite")],
            [InlineKeyboardButton("❓ What is AdHub?", callback_data="action_about_adhub")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        welcome_message = f"👋 **Welcome to AdHub, please set up access to the bot.**\n\n"
        welcome_message += f"**Go to AdHub Web App > Get Invite Code**\n\n"
        welcome_message += f"🎯 Set your access code and `/start <code>` to continue ➡️"
        
        await update.message.reply_text(
            welcome_message,
            parse_mode='Markdown',
            reply_markup=reply_markup
        )
    
    async def handle_enter_code_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle manual code entry"""
        message = f"🔑 **Enter Your Access Code**\n\n"
        message += f"Please send your access code in the format:\n"
        message += f"`/start YOUR_CODE_HERE`\n\n"
        message += f"**Example:**\n"
        message += f"`/start ABC123XY`\n\n"
        message += f"📱 **Don't have a code?** Get one from your AdHub dashboard."
        
        keyboard = [
            [InlineKeyboardButton("🌐 Get Access Code", url=f"{self.webapp_url}/invite")],
            [InlineKeyboardButton("❓ Help", url=f"{self.webapp_url}/support")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.callback_query.edit_message_text(
            message,
            parse_mode='Markdown',
            reply_markup=reply_markup
        )
    
    async def show_about_adhub(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Show information about AdHub"""
        keyboard = [
            [InlineKeyboardButton("🌐 Visit Website", url=self.webapp_url)],
            [InlineKeyboardButton("🔑 Enter Access Code", callback_data="action_enter_code")],
            [InlineKeyboardButton("⬅️ Back", callback_data="action_welcome")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        about_message = f"🎯 **About AdHub**\n\n"
        about_message += f"🚀 **The most advanced ad account management platform**\n\n"
        about_message += f"**Features:**\n"
        about_message += f"💰 Multi-wallet management\n"
        about_message += f"📊 Real-time account monitoring\n"
        about_message += f"💳 Instant payments & top-ups\n"
        about_message += f"📈 Advanced analytics\n"
        about_message += f"🔒 Enterprise-grade security\n"
        about_message += f"⚡ Lightning-fast operations\n\n"
        about_message += f"**Ready to get started?**\n"
        about_message += f"Get your access code from the web app!"
        
        await update.callback_query.edit_message_text(
            about_message,
            parse_mode='Markdown',
            reply_markup=reply_markup
        )
    
    async def handle_callback_query(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> bool:
        """Handle access code related callback queries"""
        if not update.callback_query or not update.callback_query.data:
            return False
        
        data = update.callback_query.data
        
        if data == "action_enter_code":
            await self.handle_enter_code_callback(update, context)
            return True
        elif data == "action_about_adhub":
            await self.show_about_adhub(update, context)
            return True
        elif data == "action_welcome":
            await self.show_welcome_screen(update, context)
            return True
        
        return False

# Global access code manager instance
access_code_manager = AccessCodeManager() 