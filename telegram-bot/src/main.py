"""
AdHub Telegram Bot - Main Entry Point
Connects to your existing Supabase database and Dolphin Cloud API
"""

import logging
import asyncio
import os
from telegram import Update, BotCommand
from telegram.ext import (
    Application, 
    CommandHandler, 
    CallbackQueryHandler,
    MessageHandler,
    filters,
    ContextTypes
)

from config import bot_settings
from handlers.auth import auth_handler
from handlers.accounts import accounts_handler
from handlers.wallet import wallet_handler
from handlers.admin import ADMIN_COMMANDS
from services.supabase_service import SupabaseService
from services.dolphin_service import DolphinCloudAPI

# Enable logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=getattr(logging, os.getenv('LOG_LEVEL', 'INFO'))
)
logger = logging.getLogger(__name__)

# Initialize services
supabase_service = SupabaseService()
dolphin_api = DolphinCloudAPI()

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Help command handler"""
    telegram_id = update.effective_user.id
    telegram_user = supabase_service.get_user_by_telegram_id(telegram_id)
    
    if not telegram_user:
        help_message = """
❓ **AdHub Bot Help**

**Getting Started:**
• `/start` - Welcome message and setup
• `/link <email>` - Link your AdHub account
• `/help` - Show this help message

**Need an account?**
Visit our website to create an AdHub account first, then come back to link it!
        """
    else:
        help_message = f"""
❓ **AdHub Bot Help**

**Account Management:**
• `/organizations` - List your organizations
• `/businesses <org_id>` - List businesses in organization  
• `/accounts <business_id>` - List ad accounts for business
• `/whoami` - Show your account information

**Balance & Wallet:**
• `/wallet <org_id>` - Check organization wallet balance
• `/balance <account_id>` - Check specific ad account balance
• `/topup <account_id> <amount>` - Top up ad account

**Utilities:**
• `/sync <business_id>` - Sync account data from Dolphin Cloud
• `/help` - Show this help message

**Quick Tips:**
• Use organization/business IDs from the list commands
• Only organization owners/admins can top up accounts
• All balances are in USD
        """
        
        # Check if user is admin
        admin_user_ids = os.getenv('ADMIN_USER_IDS', '').split(',')
        user_id = str(update.effective_user.id)
        
        if user_id in admin_user_ids:
            help_message += """

**Admin Commands:**
• `/admin_stats` - System statistics
• `/admin_list_clients` - List all clients
• `/admin_register_client` - Show client registration instructions
• `/admin_invite_client <email>` - Get invitation message

**Business Manager Management:**
• `/admin_sync_bms` - Discover Business Managers
• `/admin_add_bm <org_id> <bm_id> "name"` - Assign BM to organization
• `/admin_list_bms <org_id>` - List organization's BMs
• `/admin_remove_bm <org_id> <bm_id>` - Remove BM assignment

**Group Management:**
• `/admin_add_group <org_id> [name]` - Assign current group
• `/admin_check_group` - Check current group assignment
• `/admin_list_groups <org_id>` - List organization's groups
• `/admin_remove_group <org_id>` - Remove current group
            """
    
    await update.message.reply_text(help_message, parse_mode='Markdown')

async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Log the error and send a telegram message to notify the developer."""
    logger.error(msg="Exception while handling an update:", exc_info=context.error)

async def admin_middleware(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle admin commands with permission check"""
    command = update.message.text.split()[0][1:]  # Remove '/' prefix
    
    # Check if user is admin
    admin_user_ids = os.getenv('ADMIN_USER_IDS', '').split(',')
    user_id = str(update.effective_user.id)
    
    if user_id not in admin_user_ids:
        await update.message.reply_text(
            "❌ **Admin Access Required**\n\n"
            "This command requires administrator privileges.",
            parse_mode='Markdown'
        )
        return
    
    # Execute admin command
    if command in ADMIN_COMMANDS:
        await ADMIN_COMMANDS[command](update, context)
    else:
        await update.message.reply_text(
            f"❌ **Unknown Admin Command**: `/{command}`",
            parse_mode='Markdown'
        )

async def unknown_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle unknown commands"""
    await update.message.reply_text(
        "❓ **Unknown Command**\n\n"
        "I don't recognize that command.\n"
        "Use `/help` to see available commands.",
        parse_mode='Markdown'
    )



def main() -> None:
    """Start the bot."""
    token = bot_settings.TELEGRAM_BOT_TOKEN
    
    if not token:
        logger.error("TELEGRAM_BOT_TOKEN not found in environment variables")
        return
    
    # Create the Application
    application = Application.builder().token(token).build()
    
    # Add command handlers
    # Authentication
    application.add_handler(CommandHandler("start", auth_handler.start_command))
    application.add_handler(CommandHandler("link", auth_handler.link_command))
    application.add_handler(CommandHandler("unlink", auth_handler.unlink_command))
    application.add_handler(CommandHandler("whoami", auth_handler.whoami_command))
    
    # Account Management
    application.add_handler(CommandHandler("organizations", accounts_handler.list_organizations))
    application.add_handler(CommandHandler("businesses", accounts_handler.list_businesses))
    application.add_handler(CommandHandler("accounts", accounts_handler.list_accounts))
    application.add_handler(CommandHandler("sync", accounts_handler.sync_business))
    
    # Wallet Management
    application.add_handler(CommandHandler("wallet", wallet_handler.wallet_balance))
    application.add_handler(CommandHandler("balance", wallet_handler.check_account_balance))
    application.add_handler(CommandHandler("topup", wallet_handler.topup_account))
    
    # Admin Commands (with permission check)
    for command_name in ADMIN_COMMANDS.keys():
        application.add_handler(CommandHandler(command_name, admin_middleware))
    
    # Utility handlers
    application.add_handler(CommandHandler("help", help_command))
    
    # Handle unknown commands
    application.add_handler(MessageHandler(filters.COMMAND, unknown_command))
    
    # Error handler
    application.add_error_handler(error_handler)
    
    logger.info("Starting AdHub Telegram Bot...")
    logger.info(f"Bot name: {bot_settings.BOT_NAME}")
    
    # Run the bot until the user presses Ctrl-C
    application.run_polling(allowed_updates=Update.ALL_TYPES)

if __name__ == '__main__':
    main() 