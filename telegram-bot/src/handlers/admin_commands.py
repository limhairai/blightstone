"""
Admin command handlers for the Telegram bot
"""

import logging
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from services.backend_api import BackendAPI
from utils.auth import require_admin
from utils.formatting import format_currency, get_account_status_emoji
from datetime import datetime

logger = logging.getLogger(__name__)

@require_admin
async def admin_sync_bms(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Sync Business Manager data from Dolphin Cloud via Backend API"""
    try:
        await update.message.reply_text("🔄 Syncing ad accounts from Dolphin Cloud...")
        
        # Use backend API to sync from Dolphin Cloud
        backend_api = BackendAPI()
        result = await backend_api.sync_from_dolphin_cloud()
        
        if result.get("status") == "success":
            synced_accounts = result.get("synced_accounts", 0)
            total_accounts = result.get("total_accounts", 0)
            total_cabs = result.get("total_cabs", 0)
            
            message = f"""✅ **Dolphin Cloud Sync Complete**

📊 **Results:**
• Synced Accounts: {synced_accounts}
• Total Accounts: {total_accounts}
• Total CABs: {total_cabs}

🕐 Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"""
            
            await update.message.reply_text(message, parse_mode='Markdown')
        else:
            await update.message.reply_text("❌ Failed to sync from Dolphin Cloud. Check backend logs.")
            
    except Exception as e:
        logger.error(f"Error in admin_sync_bms: {e}")
        await update.message.reply_text(f"❌ Error syncing data: {str(e)}")

@require_admin
async def admin_sync_spend(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Sync spend data from Dolphin Cloud via Backend API"""
    try:
        await update.message.reply_text("🔄 Syncing spend data from Dolphin Cloud...")
        
        # Use backend API to sync spend data
        backend_api = BackendAPI()
        result = await backend_api.sync_spend_data()
        
        if result.get("status") == "success":
            synced_accounts = result.get("synced_accounts", 0)
            total_cabs = result.get("total_cabs", 0)
            
            message = f"""✅ **Spend Data Sync Complete**

📊 **Results:**
• Updated Accounts: {synced_accounts}
• Total CABs: {total_cabs}

🕐 Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"""
            
            await update.message.reply_text(message, parse_mode='Markdown')
        else:
            await update.message.reply_text("❌ Failed to sync spend data. Check backend logs.")
            
    except Exception as e:
        logger.error(f"Error in admin_sync_spend: {e}")
        await update.message.reply_text(f"❌ Error syncing spend data: {str(e)}")

@require_admin
async def admin_account_status(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show account status summary from backend"""
    try:
        await update.message.reply_text("📊 Fetching account status...")
        
        # Get account data from backend
        backend_api = BackendAPI()
        accounts = await backend_api.get_ad_accounts_inventory()
        
        if not accounts:
            await update.message.reply_text("❌ No accounts found or error fetching data.")
            return
        
        # Calculate summary stats
        total_accounts = len(accounts)
        total_balance = sum(float(acc.get("balance", 0)) for acc in accounts)
        total_spend = sum(float(acc.get("spend_7d", 0)) for acc in accounts)
        
        # Status breakdown
        status_counts = {}
        for acc in accounts:
            status = acc.get("status", "unknown")
            status_counts[status] = status_counts.get(status, 0) + 1
        
        # Format status breakdown
        status_text = ""
        for status, count in status_counts.items():
            emoji = get_account_status_emoji(status)
            status_text += f"{emoji} {status.title()}: {count}\n"
        
        message = f"""📊 **Account Status Summary**

**Total Accounts:** {total_accounts}
**Total Balance:** {format_currency(total_balance)}
**7-Day Spend:** {format_currency(total_spend)}

**Status Breakdown:**
{status_text}

🕐 Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"""
        
        await update.message.reply_text(message, parse_mode='Markdown')
        
    except Exception as e:
        logger.error(f"Error in admin_account_status: {e}")
        await update.message.reply_text(f"❌ Error fetching account status: {str(e)}")

@require_admin
async def admin_help(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Show admin help menu"""
    help_text = """🔧 **Admin Commands**

**Data Sync:**
• `/admin_sync_bms` - Sync accounts from Dolphin Cloud
• `/admin_sync_spend` - Sync spend data from Dolphin Cloud

**Monitoring:**
• `/admin_account_status` - Show account status summary
• `/admin_help` - Show this help menu

**Payment Management:**
• `/pay <org_id> <amount>` - Create payment for organization
• `/payment_status` - Show recent payments
• `/payment_help` - Payment system help

**Organization Management:**
• Use the web dashboard for detailed organization management
• Backend API: {backend_api.base_url if 'backend_api' in locals() else 'Not configured'}

**Access Codes:**
• Use the web dashboard to generate and manage access codes"""
    
    await update.message.reply_text(help_text, parse_mode='Markdown')

# Command mappings for the main bot
ADMIN_COMMAND_HANDLERS = {
    "admin_sync_bms": admin_sync_bms,
    "admin_sync_spend": admin_sync_spend,
    "admin_account_status": admin_account_status,
    "admin_help": admin_help,
} 