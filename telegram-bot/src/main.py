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
from handlers.payments import PaymentHandler
from handlers.interactive_menus import InteractiveMenus
from handlers.access_codes import access_code_manager
from handlers.application_commands import application_handler
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
payment_handler = PaymentHandler()
interactive_menus = InteractiveMenus()

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Enhanced start command with access code support (like BullX)"""
    await access_code_manager.handle_start_command(update, context)

async def menu_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show the main interactive menu"""
    await interactive_menus.show_main_menu(update, context)

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show help menu with buttons"""
    await interactive_menus.show_help_menu(update, context)

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
    # Main interface
    application.add_handler(CommandHandler("start", start_command))
    application.add_handler(CommandHandler("menu", menu_command))
    
    # Authentication (still available via commands)
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
    
    # Payment Management
    application.add_handler(CommandHandler("pay", payment_handler.wallet_topup))
    application.add_handler(CommandHandler("payment_status", payment_handler.check_payment_status))
    application.add_handler(CommandHandler("payment_help", payment_handler.payment_help))
    
    # Application Management
    application.add_handler(CommandHandler("apply", application_handler.start_application))
    application.add_handler(CommandHandler("applications", application_handler.list_applications))
    
    # Access code callback handlers (check first)
    application.add_handler(CallbackQueryHandler(access_code_manager.handle_callback_query))
    
    # Interactive menu callback handlers
    application.add_handler(CallbackQueryHandler(interactive_menus.handle_callback))
    
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