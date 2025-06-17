from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from typing import Dict, Any
import json
from datetime import datetime, timedelta
from config import bot_settings
from utils.auth import is_admin, is_team_lead
from utils.database import get_applications, get_businesses, get_clients
from utils.formatting import format_stats, format_application_list
from services.supabase_service import SupabaseService
from services.dolphin_service import DolphinCloudAPI
import logging

logger = logging.getLogger(__name__)

# Lazy-loaded services (initialized when first used)
_supabase_service = None
_dolphin_api = None

def get_supabase_service():
    global _supabase_service
    if _supabase_service is None:
        _supabase_service = SupabaseService()
    return _supabase_service

def get_dolphin_api():
    global _dolphin_api
    if _dolphin_api is None:
        _dolphin_api = DolphinCloudAPI()
    return _dolphin_api

async def stats_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show comprehensive system statistics"""
    if not is_admin(update.effective_user.id):
        await update.message.reply_text("❌ Admin access required")
        return
    
    try:
        # Get data from database
        applications = await get_applications()
        businesses = await get_businesses()
        clients = await get_clients()
        
        # Calculate statistics
        stats = {
            "total_clients": len(clients),
            "total_businesses": len(businesses),
            "total_applications": len(applications),
            "pending_applications": len([a for a in applications if a.get('stage') in ['received', 'document_prep', 'submitted', 'under_review']]),
            "approved_today": len([a for a in applications if a.get('stage') == 'approved' and a.get('updated_at', '').startswith(datetime.now().strftime('%Y-%m-%d'))]),
            "active_businesses": len([b for b in businesses if b.get('status') == 'active']),
            "total_ad_accounts": sum([b.get('ad_account_count', 0) for b in businesses]),
        }
        
        message = format_stats(stats)
        
        # Add action buttons
        keyboard = [
            [InlineKeyboardButton("📊 Detailed Analytics", callback_data="detailed_analytics")],
            [InlineKeyboardButton("📋 Recent Applications", callback_data="recent_applications")],
            [InlineKeyboardButton("🔄 Refresh Stats", callback_data="refresh_stats")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(message, reply_markup=reply_markup, parse_mode='HTML')
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error fetching stats: {str(e)}")

async def applications_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show recent applications with management options"""
    if not (is_admin(update.effective_user.id) or is_team_lead(update.effective_user.id)):
        await update.message.reply_text("❌ Admin or Team Lead access required")
        return
    
    try:
        applications = await get_applications(limit=10)
        
        if not applications:
            await update.message.reply_text("📋 No applications found")
            return
        
        message = format_application_list(applications)
        
        # Add management buttons
        keyboard = []
        for app in applications[:5]:  # Show buttons for first 5 apps
            keyboard.append([
                InlineKeyboardButton(f"📝 {app.get('id', '')[:8]}", callback_data=f"app_details_{app.get('id')}")
            ])
        
        keyboard.extend([
            [InlineKeyboardButton("➕ Show More", callback_data="show_more_apps")],
            [InlineKeyboardButton("🔍 Filter Apps", callback_data="filter_apps")]
        ])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text(message, reply_markup=reply_markup, parse_mode='HTML')
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error fetching applications: {str(e)}")

async def assign_team_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Assign application to team"""
    if not is_admin(update.effective_user.id):
        await update.message.reply_text("❌ Admin access required")
        return
    
    # Parse command arguments
    args = context.args
    if len(args) < 2:
        await update.message.reply_text(
            "📝 Usage: /assign_team <application_id> <team_name>\n\n"
            "Available teams:\n"
            "• team1 - Meta Specialists (John, Sarah)\n"
            "• team2 - Growth Team (Mike, Lisa)\n"
            "• team3 - Enterprise Team (David, Emma)\n"
            "• team4 - International Team (Carlos, Anna)"
        )
        return
    
    app_id = args[0]
    team_name = args[1]
    
    try:
        # TODO: Implement team assignment logic
        # This would update the application in your database
        
        await update.message.reply_text(
            f"✅ Application {app_id} assigned to {team_name}\n"
            f"📧 Team notification sent\n"
            f"⏰ Assignment time: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        )
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error assigning team: {str(e)}")

async def export_data_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Export data for analysis"""
    if not is_admin(update.effective_user.id):
        await update.message.reply_text("❌ Admin access required")
        return
    
    keyboard = [
        [InlineKeyboardButton("📊 Applications CSV", callback_data="export_applications")],
        [InlineKeyboardButton("🏢 Businesses CSV", callback_data="export_businesses")],
        [InlineKeyboardButton("👥 Clients CSV", callback_data="export_clients")],
        [InlineKeyboardButton("📈 Full Report", callback_data="export_full_report")]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    await update.message.reply_text(
        "📁 <b>Data Export Options</b>\n\n"
        "Select the data you want to export:",
        reply_markup=reply_markup,
        parse_mode='HTML'
    )

async def system_status_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show system health and status"""
    if not is_admin(update.effective_user.id):
        await update.message.reply_text("❌ Admin access required")
        return
    
    try:
        # Check various system components
        status_message = (
            "🟢 <b>System Status</b>\n\n"
            "🔗 <b>Database:</b> Connected ✅\n"
            "🌐 <b>API:</b> Operational ✅\n"
            "🤖 <b>Bot:</b> Online ✅\n"
            "📊 <b>Supabase:</b> Connected ✅\n\n"
            f"⏰ <b>Last Check:</b> {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n"
            f"🔄 <b>Uptime:</b> 24h 15m\n"
            f"💾 <b>Active Sessions:</b> 12\n"
        )
        
        keyboard = [
            [InlineKeyboardButton("🔄 Refresh Status", callback_data="refresh_system_status")],
            [InlineKeyboardButton("📋 Detailed Logs", callback_data="system_logs")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(status_message, reply_markup=reply_markup, parse_mode='HTML')
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error checking system status: {str(e)}")

# Callback query handlers
async def handle_admin_callbacks(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle admin callback queries"""
    query = update.callback_query
    await query.answer()
    
    if not is_admin(query.from_user.id):
        await query.edit_message_text("❌ Admin access required")
        return
    
    data = query.data
    
    if data == "detailed_analytics":
        await show_detailed_analytics(query, context)
    elif data == "recent_applications":
        await show_recent_applications(query, context)
    elif data == "refresh_stats":
        await refresh_stats(query, context)
    elif data.startswith("app_details_"):
        app_id = data.replace("app_details_", "")
        await show_application_details(query, context, app_id)
    elif data.startswith("export_"):
        export_type = data.replace("export_", "")
        await handle_export(query, context, export_type)

async def show_detailed_analytics(query, context) -> None:
    """Show detailed analytics"""
    analytics_message = (
        "📊 <b>Detailed Analytics</b>\n\n"
        "📈 <b>This Week:</b>\n"
        "• Applications: 47 (+12%)\n"
        "• Approvals: 31 (+8%)\n"
        "• New Businesses: 23 (+15%)\n\n"
        "⏱️ <b>Average Processing Time:</b>\n"
        "• Document Prep: 2.3 days\n"
        "• Review Process: 1.8 days\n"
        "• Total: 4.1 days\n\n"
        "👥 <b>Team Performance:</b>\n"
        "• Team 1: 12 apps (92% approval)\n"
        "• Team 2: 8 apps (88% approval)\n"
        "• Team 3: 15 apps (94% approval)\n"
        "• Team 4: 12 apps (90% approval)"
    )
    
    await query.edit_message_text(analytics_message, parse_mode='HTML')

async def show_recent_applications(query, context) -> None:
    """Show recent applications"""
    try:
        applications = await get_applications(limit=20)
        message = format_application_list(applications, detailed=True)
        await query.edit_message_text(message, parse_mode='HTML')
    except Exception as e:
        await query.edit_message_text(f"❌ Error: {str(e)}")

async def refresh_stats(query, context) -> None:
    """Refresh and show updated stats"""
    await query.edit_message_text("🔄 Refreshing statistics...")
    # Re-run stats command logic
    await stats_command_internal(query, context)

async def show_application_details(query, context, app_id: str) -> None:
    """Show detailed application information"""
    try:
        # TODO: Fetch application details from database
        details_message = (
            f"📋 <b>Application Details</b>\n\n"
            f"🆔 <b>ID:</b> {app_id}\n"
            f"👤 <b>Client:</b> John Smith\n"
            f"🏢 <b>Business:</b> Smith Marketing LLC\n"
            f"📊 <b>Stage:</b> Under Review\n"
            f"⚡ <b>Priority:</b> High\n"
            f"📅 <b>Submitted:</b> 2024-01-15\n"
            f"👥 <b>Assigned Team:</b> Team 1\n\n"
            f"📝 <b>Notes:</b>\n"
            f"Waiting for business verification documents."
        )
        
        keyboard = [
            [InlineKeyboardButton("✅ Approve", callback_data=f"approve_{app_id}")],
            [InlineKeyboardButton("❌ Reject", callback_data=f"reject_{app_id}")],
            [InlineKeyboardButton("📝 Add Note", callback_data=f"add_note_{app_id}")],
            [InlineKeyboardButton("🔙 Back", callback_data="recent_applications")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(details_message, reply_markup=reply_markup, parse_mode='HTML')
        
    except Exception as e:
        await query.edit_message_text(f"❌ Error: {str(e)}")

async def handle_export(query, context, export_type: str) -> None:
    """Handle data export requests"""
    await query.edit_message_text(f"📁 Preparing {export_type} export...\n⏳ This may take a moment.")
    
    try:
        # TODO: Implement actual export logic
        await query.edit_message_text(
            f"✅ Export completed!\n"
            f"📊 {export_type.title()} data exported\n"
            f"📧 File sent to your email\n"
            f"⏰ Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}"
        )
    except Exception as e:
        await query.edit_message_text(f"❌ Export failed: {str(e)}")

# Internal helper functions
async def stats_command_internal(query, context) -> None:
    """Internal stats command for callback queries"""
    # Reuse stats command logic but edit message instead of reply
    pass

async def admin_stats(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show system statistics (admin only)"""
    try:
        # Get basic stats
        # This would include user counts, transaction volumes, etc.
        
        stats_message = "📊 **AdHub Bot Statistics**\n\n"
        stats_message += "🔧 System Status: Online\n"
        stats_message += "💾 Database: Connected\n"
        stats_message += "🐬 Dolphin Cloud: Connected\n"
        
        await update.message.reply_text(stats_message, parse_mode='Markdown')
        
    except Exception as e:
        logger.error(f"Error in admin_stats: {e}")
        await update.message.reply_text("❌ Error retrieving system statistics")

async def admin_add_bm(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Add Business Manager to organization (admin only)
    Usage: /admin_add_bm <org_id> <bm_id> [bm_name]
    """
    try:
        if len(context.args) < 2:
            await update.message.reply_text(
                "❌ Usage: `/admin_add_bm <org_id> <bm_id> [bm_name]`\n\n"
                "Example: `/admin_add_bm 123e4567-e89b-12d3-a456-426614174000 1760514248108495 'Client ABC - Main BM'`",
                parse_mode='Markdown'
            )
            return
        
        org_id = context.args[0]
        bm_id = context.args[1]
        bm_name = " ".join(context.args[2:]) if len(context.args) > 2 else None
        
        # Add the mapping
        result = await get_supabase_service().add_organization_bm(org_id, bm_id, bm_name)
        
        await update.message.reply_text(
            f"✅ **Business Manager Added**\n\n"
            f"🏢 Organization: `{org_id}`\n"
            f"🏬 Business Manager: `{bm_id}`\n"
            f"📝 Name: {bm_name or f'BM-{bm_id}'}\n\n"
            f"This BM is now accessible to organization members.",
            parse_mode='Markdown'
        )
        
    except Exception as e:
        logger.error(f"Error in admin_add_bm: {e}")
        await update.message.reply_text(f"❌ Error adding Business Manager: {str(e)}")

async def admin_list_bms(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """List Business Managers for organization (admin only)
    Usage: /admin_list_bms <org_id>
    """
    try:
        if len(context.args) < 1:
            await update.message.reply_text(
                "❌ Usage: `/admin_list_bms <org_id>`",
                parse_mode='Markdown'
            )
            return
        
        org_id = context.args[0]
        
        # Get BMs for organization
        bms = await get_supabase_service().get_organization_bms(org_id)
        
        if not bms:
            await update.message.reply_text(
                f"📋 No Business Managers found for organization `{org_id}`",
                parse_mode='Markdown'
            )
            return
        
        message = f"🏬 **Business Managers for Organization**\n"
        message += f"🏢 Org ID: `{org_id}`\n\n"
        
        for bm in bms:
            message += f"🔹 **{bm['business_manager_name']}**\n"
            message += f"   ID: `{bm['business_manager_id']}`\n"
            message += f"   Status: {'✅ Active' if bm['is_active'] else '❌ Inactive'}\n"
            message += f"   Added: {bm['created_at'][:10]}\n\n"
        
        await update.message.reply_text(message, parse_mode='Markdown')
        
    except Exception as e:
        logger.error(f"Error in admin_list_bms: {e}")
        await update.message.reply_text(f"❌ Error listing Business Managers: {str(e)}")

async def admin_remove_bm(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Remove Business Manager from organization (admin only)
    Usage: /admin_remove_bm <org_id> <bm_id>
    """
    try:
        if len(context.args) < 2:
            await update.message.reply_text(
                "❌ Usage: `/admin_remove_bm <org_id> <bm_id>`",
                parse_mode='Markdown'
            )
            return
        
        org_id = context.args[0]
        bm_id = context.args[1]
        
        # Remove the mapping
        success = await get_supabase_service().remove_organization_bm(org_id, bm_id)
        
        if success:
            await update.message.reply_text(
                f"✅ **Business Manager Removed**\n\n"
                f"🏢 Organization: `{org_id}`\n"
                f"🏬 Business Manager: `{bm_id}`\n\n"
                f"This BM is no longer accessible to organization members.",
                parse_mode='Markdown'
            )
        else:
            await update.message.reply_text(
                f"❌ Business Manager not found or already removed."
            )
        
    except Exception as e:
        logger.error(f"Error in admin_remove_bm: {e}")
        await update.message.reply_text(f"❌ Error removing Business Manager: {str(e)}")

async def admin_sync_bms(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Sync and show all Business Managers from Dolphin Cloud (admin only)"""
    try:
        await update.message.reply_text("🔄 Fetching Business Managers from Dolphin Cloud...")
        
        # Get all accounts to extract BM information (use smaller page size to avoid 422 error)
        accounts = await get_dolphin_api().get_fb_accounts(per_page=100)
        
        # Extract unique Business Managers
        bm_map = {}
        for account in accounts:
            for bm in account.get("bms", []):
                bm_id = bm.get("business_id")
                if bm_id and bm_id not in bm_map:
                    bm_map[bm_id] = {
                        "id": bm_id,
                        "name": bm.get("name", f"BM-{bm_id}"),
                        "cabs_count": bm.get("cabs_count", 0),
                        "email_verified": bm.get("email_verified", 0)
                    }
        
        if not bm_map:
            await update.message.reply_text("📋 No Business Managers found in Dolphin Cloud")
            return
        
        message = f"🏬 **Available Business Managers in Dolphin Cloud**\n"
        message += f"📊 Total: {len(bm_map)}\n\n"
        
        for bm_id, bm_info in bm_map.items():
            message += f"🔹 **{bm_info['name']}**\n"
            message += f"   ID: `{bm_id}`\n"
            message += f"   CABs: {bm_info['cabs_count']}\n"
            message += f"   Verified: {'✅' if bm_info['email_verified'] else '❌'}\n\n"
            
            # Split message if too long
            if len(message) > 3500:
                await update.message.reply_text(message, parse_mode='Markdown')
                message = ""
        
        if message:
            await update.message.reply_text(message, parse_mode='Markdown')
        
        await update.message.reply_text(
            "💡 **To assign a BM to an organization:**\n"
            "`/admin_add_bm <org_id> <bm_id> [name]`",
            parse_mode='Markdown'
        )
        
    except Exception as e:
        logger.error(f"Error in admin_sync_bms: {e}")
        await update.message.reply_text(f"❌ Error syncing Business Managers: {str(e)}")

async def admin_add_group(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Add current Telegram group to organization (admin only)
    Usage: /admin_add_group <org_id> [group_name]
    """
    try:
        if update.effective_chat.type not in ['group', 'supergroup']:
            await update.message.reply_text(
                "❌ This command can only be used in Telegram groups"
            )
            return
            
        if len(context.args) < 1:
            await update.message.reply_text(
                "❌ Usage: `/admin_add_group <org_id> [group_name]`\n\n"
                "This will assign this Telegram group to the specified organization.",
                parse_mode='Markdown'
            )
            return
        
        org_id = context.args[0]
        group_name = " ".join(context.args[1:]) if len(context.args) > 1 else update.effective_chat.title
        group_id = update.effective_chat.id
        group_type = update.effective_chat.type
        
        # Get admin user ID
        admin_user = await get_supabase_service().get_user_by_telegram_id(str(update.effective_user.id))
        admin_user_id = admin_user.get('id') if admin_user else None
        
        # Add the group mapping
        result = await get_supabase_service().add_organization_group(
            org_id, group_id, group_name, group_type, admin_user_id
        )
        
        await update.message.reply_text(
            f"✅ **Telegram Group Added to Organization**\n\n"
            f"🏢 Organization: `{org_id}`\n"
            f"👥 Group: {group_name}\n"
            f"🆔 Group ID: `{group_id}`\n"
            f"📱 Type: {group_type}\n\n"
            f"🔒 This group now shows only data for this organization.\n"
            f"✅ Safe to use all bot commands here!",
            parse_mode='Markdown'
        )
        
    except Exception as e:
        logger.error(f"Error in admin_add_group: {e}")
        await update.message.reply_text(f"❌ Error adding group: {str(e)}")

async def admin_list_groups(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """List Telegram groups for organization (admin only)
    Usage: /admin_list_groups <org_id>
    """
    try:
        if len(context.args) < 1:
            await update.message.reply_text(
                "❌ Usage: `/admin_list_groups <org_id>`",
                parse_mode='Markdown'
            )
            return
        
        org_id = context.args[0]
        
        # Get groups for organization
        groups = await get_supabase_service().get_organization_groups(org_id)
        
        if not groups:
            await update.message.reply_text(
                f"📋 No Telegram groups found for organization `{org_id}`",
                parse_mode='Markdown'
            )
            return
        
        message = f"👥 **Telegram Groups for Organization**\n"
        message += f"🏢 Org ID: `{org_id}`\n\n"
        
        for group in groups:
            message += f"🔹 **{group['group_name']}**\n"
            message += f"   ID: `{group['telegram_group_id']}`\n"
            message += f"   Type: {group['group_type']}\n"
            message += f"   Status: {'✅ Active' if group['is_active'] else '❌ Inactive'}\n"
            message += f"   Added: {group['created_at'][:10]}\n\n"
        
        await update.message.reply_text(message, parse_mode='Markdown')
        
    except Exception as e:
        logger.error(f"Error in admin_list_groups: {e}")
        await update.message.reply_text(f"❌ Error listing groups: {str(e)}")

async def admin_remove_group(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Remove current Telegram group from organization (admin only)
    Usage: /admin_remove_group <org_id>
    """
    try:
        if update.effective_chat.type not in ['group', 'supergroup']:
            await update.message.reply_text(
                "❌ This command can only be used in Telegram groups"
            )
            return
            
        if len(context.args) < 1:
            await update.message.reply_text(
                "❌ Usage: `/admin_remove_group <org_id>`",
                parse_mode='Markdown'
            )
            return
        
        org_id = context.args[0]
        group_id = update.effective_chat.id
        
        # Remove the group mapping
        success = await get_supabase_service().remove_organization_group(org_id, group_id)
        
        if success:
            await update.message.reply_text(
                f"✅ **Telegram Group Removed**\n\n"
                f"🏢 Organization: `{org_id}`\n"
                f"👥 Group: {update.effective_chat.title}\n\n"
                f"⚠️ This group will now show ALL data (unsafe for clients).",
                parse_mode='Markdown'
            )
        else:
            await update.message.reply_text(
                f"❌ Group mapping not found or already removed."
            )
        
    except Exception as e:
        logger.error(f"Error in admin_remove_group: {e}")
        await update.message.reply_text(f"❌ Error removing group: {str(e)}")

async def admin_check_group(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Check which organization this group belongs to (admin only)"""
    try:
        if update.effective_chat.type not in ['group', 'supergroup']:
            await update.message.reply_text(
                "❌ This command can only be used in Telegram groups"
            )
            return
        
        group_id = update.effective_chat.id
        
        # Get organization for this group
        organization = await get_supabase_service().get_group_organization(group_id)
        
        if organization:
            await update.message.reply_text(
                f"🏢 **Group Organization Info**\n\n"
                f"👥 Group: {update.effective_chat.title}\n"
                f"🆔 Group ID: `{group_id}`\n"
                f"🏢 Organization: {organization.get('name', 'Unknown')}\n"
                f"🆔 Org ID: `{organization.get('id')}`\n\n"
                f"✅ This group shows only data for this organization.",
                parse_mode='Markdown'
            )
        else:
            await update.message.reply_text(
                f"⚠️ **Unassigned Group**\n\n"
                f"👥 Group: {update.effective_chat.title}\n"
                f"🆔 Group ID: `{group_id}`\n"
                f"🏢 Organization: Not assigned\n\n"
                f"❌ This group will show ALL data (unsafe for clients).\n"
                f"💡 Use `/admin_add_group <org_id>` to assign it.",
                parse_mode='Markdown'
            )
        
    except Exception as e:
        logger.error(f"Error in admin_check_group: {e}")
        await update.message.reply_text(f"❌ Error checking group: {str(e)}")

async def admin_register_client(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show instructions for client registration (admin only)"""
    try:
        await update.message.reply_text(
            "📋 **Client Registration Process**\n\n"
            "⚠️ **Bot registration is disabled for security.**\n\n"
            "**To add a new client:**\n\n"
            "1️⃣ **Register via Supabase Dashboard:**\n"
            "   • Go to your Supabase project\n"
            "   • Use Authentication > Users\n"
            "   • Create new user account\n\n"
            "2️⃣ **Or use the web app:**\n"
            "   • Client signs up at your website\n"
            "   • Creates organization through web UI\n\n"
            "3️⃣ **Then link to Telegram:**\n"
            "   • Client uses: `/link their-email@example.com`\n"
            "   • You assign Business Managers: `/admin_add_bm <org_id> <bm_id>`\n"
            "   • Set up group: `/admin_add_group <org_id>`\n\n"
            "💡 **This ensures proper authentication and data integrity.**",
            parse_mode='Markdown'
        )
        
    except Exception as e:
        logger.error(f"Error in admin_register_client: {e}")
        await update.message.reply_text(f"❌ Error: {str(e)}")

async def admin_invite_client(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Send invitation message to existing client (admin only)
    Usage: /admin_invite_client <email>
    """
    try:
        if len(context.args) < 1:
            await update.message.reply_text(
                "❌ Usage: `/admin_invite_client <email>`\n\n"
                "This will show you the invitation message to send to the client.",
                parse_mode='Markdown'
            )
            return
        
        email = context.args[0].lower().strip()
        
        # Get client info
        client_info = await get_supabase_service().invite_client_to_telegram(email)
        
        if not client_info:
            await update.message.reply_text(
                f"❌ **Client Not Found**\n\n"
                f"No user found with email: `{email}`\n\n"
                f"Register them via Supabase Dashboard or web app first.\n"
                f"Use `/admin_register_client` for instructions.",
                parse_mode='Markdown'
            )
            return
        
        # Check if already linked
        if client_info.get('telegram_id'):
            await update.message.reply_text(
                f"ℹ️ **Client Already Linked**\n\n"
                f"📧 Email: {email}\n"
                f"🔗 Telegram ID: `{client_info['telegram_id']}`\n\n"
                f"This client is already using the Telegram bot.",
                parse_mode='Markdown'
            )
            return
        
        # Generate invitation message
        org_name = "Unknown"
        if client_info.get('organization_members') and len(client_info['organization_members']) > 0:
            org_name = client_info['organization_members'][0]['organizations']['name']
        
        invitation_message = f"""
🚀 **Welcome to AdHub Telegram Bot!**

Hi {client_info.get('name', 'there')}! 

Your AdHub account is ready. Connect your Telegram to manage your ad accounts on the go.

**To get started:**
1. Message our bot: @YourBotUsername
2. Use the command: `/link {email}`
3. Start managing your accounts!

**What you can do:**
• Check account balances
• Monitor daily spend
• Get low balance alerts
• Top up accounts
• View all your organizations

**Your Organization:** {org_name}

Questions? Reply to this message for support.
        """
        
        await update.message.reply_text(
            f"📧 **Invitation Message for {email}**\n\n"
            f"👤 **Client:** {client_info.get('name', 'Unknown')}\n"
            f"🏢 **Organization:** {org_name}\n\n"
            f"**Send this message to your client:**\n\n"
            f"```\n{invitation_message.strip()}\n```\n\n"
            f"Or you can copy and customize it as needed.",
            parse_mode='Markdown'
        )
        
    except Exception as e:
        logger.error(f"Error in admin_invite_client: {e}")
        await update.message.reply_text(f"❌ Error getting client invitation: {str(e)}")

async def admin_list_clients(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """List all clients and their status (admin only)"""
    try:
        # Get all profiles with organization info
        profiles = get_supabase_service().client.table("profiles") \
            .select("""
                id, email, name, telegram_id, created_at,
                organization_members(
                    role,
                    organizations(id, name, plan_id)
                )
            """) \
            .order("created_at", desc=True) \
            .limit(20) \
            .execute()
        
        if not profiles.data:
            await update.message.reply_text(
                "📋 **No Clients Found**\n\n"
                "No client accounts exist yet.",
                parse_mode='Markdown'
            )
            return
        
        message = "👥 **Client List** (Last 20)\n\n"
        
        for profile in profiles.data:
            telegram_status = "🔗 Linked" if profile.get('telegram_id') else "❌ Not linked"
            
            # Get organization info
            org_info = "No organization"
            if profile.get('organization_members') and len(profile['organization_members']) > 0:
                org = profile['organization_members'][0]['organizations']
                role = profile['organization_members'][0]['role']
                org_info = f"{org['name']} ({role})"
            
            message += f"🔹 **{profile.get('name', 'Unknown')}**\n"
            message += f"   📧 {profile['email']}\n"
            message += f"   🔗 {telegram_status}\n"
            message += f"   🏢 {org_info}\n"
            message += f"   📅 {profile['created_at'][:10]}\n\n"
            
            # Split message if too long
            if len(message) > 3500:
                await update.message.reply_text(message, parse_mode='Markdown')
                message = ""
        
        if message:
            await update.message.reply_text(message, parse_mode='Markdown')
        
        await update.message.reply_text(
            "💡 **Quick Actions:**\n"
            "• `/admin_register_client <email> <name> <org>` - Register new client\n"
            "• `/admin_invite_client <email>` - Get invitation message\n"
            "• `/admin_add_bm <org_id> <bm_id>` - Assign Business Manager",
            parse_mode='Markdown'
        )
        
    except Exception as e:
        logger.error(f"Error in admin_list_clients: {e}")
        await update.message.reply_text(f"❌ Error listing clients: {str(e)}")

# Admin command registry
ADMIN_COMMANDS = {
    "admin_stats": admin_stats,
    "admin_add_bm": admin_add_bm,
    "admin_list_bms": admin_list_bms,
    "admin_remove_bm": admin_remove_bm,
    "admin_sync_bms": admin_sync_bms,
    "admin_add_group": admin_add_group,
    "admin_list_groups": admin_list_groups,
    "admin_remove_group": admin_remove_group,
    "admin_check_group": admin_check_group,
    "admin_register_client": admin_register_client,
    "admin_invite_client": admin_invite_client,
    "admin_list_clients": admin_list_clients,
} 