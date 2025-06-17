from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from datetime import datetime
from config import bot_settings
from utils.auth import is_team_lead, is_admin, get_user_team
from utils.database import get_team_applications, update_application_status
from utils.formatting import format_application_list, format_team_stats

async def my_applications_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show applications assigned to user's team"""
    user_id = update.effective_user.id
    
    if not (is_team_lead(user_id) or is_admin(user_id)):
        await update.message.reply_text("❌ Team Lead access required")
        return
    
    try:
        team_name = get_user_team(user_id)
        applications = await get_team_applications(team_name)
        
        if not applications:
            await update.message.reply_text(f"📋 No applications assigned to {team_name}")
            return
        
        message = (
            f"📋 <b>{team_name} Applications</b>\n\n" +
            format_application_list(applications, show_team=False)
        )
        
        # Add action buttons for each application
        keyboard = []
        for app in applications[:5]:  # Show buttons for first 5 apps
            keyboard.append([
                InlineKeyboardButton(
                    f"📝 {app.get('id', '')[:8]} - {app.get('stage', '').title()}", 
                    callback_data=f"team_app_{app.get('id')}"
                )
            ])
        
        keyboard.extend([
            [InlineKeyboardButton("📊 Team Stats", callback_data=f"team_stats_{team_name}")],
            [InlineKeyboardButton("🔄 Refresh", callback_data="refresh_team_apps")]
        ])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        await update.message.reply_text(message, reply_markup=reply_markup, parse_mode='HTML')
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error fetching applications: {str(e)}")

async def update_status_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Update application status"""
    user_id = update.effective_user.id
    
    if not (is_team_lead(user_id) or is_admin(user_id)):
        await update.message.reply_text("❌ Team Lead access required")
        return
    
    args = context.args
    if len(args) < 2:
        await update.message.reply_text(
            "📝 Usage: /update_status <application_id> <new_status>\n\n"
            "Available statuses:\n"
            "• received\n"
            "• document_prep\n"
            "• submitted\n"
            "• under_review\n"
            "• approved\n"
            "• rejected\n"
            "• need_documents"
        )
        return
    
    app_id = args[0]
    new_status = args[1].lower()
    
    valid_statuses = ['received', 'document_prep', 'submitted', 'under_review', 'approved', 'rejected', 'need_documents']
    
    if new_status not in valid_statuses:
        await update.message.reply_text(f"❌ Invalid status. Use one of: {', '.join(valid_statuses)}")
        return
    
    try:
        # Update application status
        success = await update_application_status(app_id, new_status, user_id)
        
        if success:
            status_emoji = {
                'received': '📥',
                'document_prep': '📝',
                'submitted': '📤',
                'under_review': '🔍',
                'approved': '✅',
                'rejected': '❌',
                'need_documents': '📋'
            }
            
            await update.message.reply_text(
                f"{status_emoji.get(new_status, '📊')} <b>Status Updated</b>\n\n"
                f"🆔 <b>Application:</b> {app_id}\n"
                f"📊 <b>New Status:</b> {new_status.replace('_', ' ').title()}\n"
                f"👤 <b>Updated by:</b> {update.effective_user.first_name}\n"
                f"⏰ <b>Time:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}",
                parse_mode='HTML'
            )
        else:
            await update.message.reply_text("❌ Failed to update status. Check application ID.")
            
    except Exception as e:
        await update.message.reply_text(f"❌ Error updating status: {str(e)}")

async def request_documents_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Request additional documents from client"""
    user_id = update.effective_user.id
    
    if not (is_team_lead(user_id) or is_admin(user_id)):
        await update.message.reply_text("❌ Team Lead access required")
        return
    
    args = context.args
    if len(args) < 1:
        await update.message.reply_text(
            "📝 Usage: /request_documents <application_id> [document_type]\n\n"
            "Common document types:\n"
            "• business_license\n"
            "• tax_id\n"
            "• bank_statement\n"
            "• identity_verification\n"
            "• address_proof"
        )
        return
    
    app_id = args[0]
    doc_type = args[1] if len(args) > 1 else "additional_documents"
    
    try:
        # TODO: Implement document request logic
        # This would send notification to client and update application status
        
        await update.message.reply_text(
            f"📋 <b>Document Request Sent</b>\n\n"
            f"🆔 <b>Application:</b> {app_id}\n"
            f"📄 <b>Document Type:</b> {doc_type.replace('_', ' ').title()}\n"
            f"📧 <b>Client notified:</b> ✅\n"
            f"📊 <b>Status updated to:</b> Need Documents\n"
            f"⏰ <b>Request time:</b> {datetime.now().strftime('%Y-%m-%d %H:%M')}",
            parse_mode='HTML'
        )
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error requesting documents: {str(e)}")

async def team_stats_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show team performance statistics"""
    user_id = update.effective_user.id
    
    if not (is_team_lead(user_id) or is_admin(user_id)):
        await update.message.reply_text("❌ Team Lead access required")
        return
    
    try:
        team_name = get_user_team(user_id)
        stats = await get_team_stats(team_name)
        
        message = format_team_stats(team_name, stats)
        
        keyboard = [
            [InlineKeyboardButton("📊 Detailed Report", callback_data=f"detailed_team_stats_{team_name}")],
            [InlineKeyboardButton("📋 Team Applications", callback_data="refresh_team_apps")],
            [InlineKeyboardButton("🔄 Refresh Stats", callback_data=f"refresh_team_stats_{team_name}")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(message, reply_markup=reply_markup, parse_mode='HTML')
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error fetching team stats: {str(e)}")

async def workload_command(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Show current workload and capacity"""
    user_id = update.effective_user.id
    
    if not (is_team_lead(user_id) or is_admin(user_id)):
        await update.message.reply_text("❌ Team Lead access required")
        return
    
    try:
        team_name = get_user_team(user_id)
        workload = await get_team_workload(team_name)
        
        message = (
            f"⚡ <b>{team_name} Workload</b>\n\n"
            f"📊 <b>Current Load:</b> {workload.get('current', 0)}/{workload.get('capacity', 20)} applications\n"
            f"📈 <b>Utilization:</b> {workload.get('utilization', 0)}%\n\n"
            f"📋 <b>By Status:</b>\n"
            f"• Received: {workload.get('received', 0)}\n"
            f"• In Progress: {workload.get('in_progress', 0)}\n"
            f"• Under Review: {workload.get('under_review', 0)}\n"
            f"• Need Documents: {workload.get('need_documents', 0)}\n\n"
            f"⏱️ <b>Average Processing Time:</b> {workload.get('avg_processing_time', 'N/A')}\n"
            f"🎯 <b>This Week's Target:</b> {workload.get('weekly_target', 15)} applications"
        )
        
        # Add capacity warning if overloaded
        if workload.get('utilization', 0) > 90:
            message += "\n\n⚠️ <b>Warning:</b> Team at high capacity!"
        elif workload.get('utilization', 0) > 75:
            message += "\n\n🟡 <b>Notice:</b> Team approaching capacity limit"
        
        keyboard = [
            [InlineKeyboardButton("📊 Capacity Planning", callback_data=f"capacity_planning_{team_name}")],
            [InlineKeyboardButton("🔄 Refresh Workload", callback_data=f"refresh_workload_{team_name}")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await update.message.reply_text(message, reply_markup=reply_markup, parse_mode='HTML')
        
    except Exception as e:
        await update.message.reply_text(f"❌ Error fetching workload: {str(e)}")

# Callback query handlers for team leads
async def handle_team_lead_callbacks(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Handle team lead callback queries"""
    query = update.callback_query
    await query.answer()
    
    user_id = query.from_user.id
    if not (is_team_lead(user_id) or is_admin(user_id)):
        await query.edit_message_text("❌ Team Lead access required")
        return
    
    data = query.data
    
    if data.startswith("team_app_"):
        app_id = data.replace("team_app_", "")
        await show_team_application_details(query, context, app_id)
    elif data.startswith("team_stats_"):
        team_name = data.replace("team_stats_", "")
        await show_team_statistics(query, context, team_name)
    elif data == "refresh_team_apps":
        await refresh_team_applications(query, context)
    elif data.startswith("detailed_team_stats_"):
        team_name = data.replace("detailed_team_stats_", "")
        await show_detailed_team_stats(query, context, team_name)

async def show_team_application_details(query, context, app_id: str) -> None:
    """Show detailed application information for team leads"""
    try:
        # TODO: Fetch application details from database
        details_message = (
            f"📋 <b>Application Details</b>\n\n"
            f"🆔 <b>ID:</b> {app_id}\n"
            f"👤 <b>Client:</b> Sarah Johnson\n"
            f"🏢 <b>Business:</b> Johnson Consulting\n"
            f"📊 <b>Stage:</b> Document Prep\n"
            f"⚡ <b>Priority:</b> Medium\n"
            f"📅 <b>Submitted:</b> 2024-01-16\n"
            f"⏰ <b>Age:</b> 2 days\n\n"
            f"📝 <b>Required Documents:</b>\n"
            f"• Business License ✅\n"
            f"• Tax ID ❌\n"
            f"• Bank Statement ❌\n\n"
            f"💬 <b>Latest Note:</b>\n"
            f"Waiting for tax ID and bank statement"
        )
        
        keyboard = [
            [InlineKeyboardButton("✅ Move to Submitted", callback_data=f"status_submitted_{app_id}")],
            [InlineKeyboardButton("📋 Request Documents", callback_data=f"req_docs_{app_id}")],
            [InlineKeyboardButton("💬 Add Note", callback_data=f"add_note_{app_id}")],
            [InlineKeyboardButton("🔙 Back to Applications", callback_data="refresh_team_apps")]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        await query.edit_message_text(details_message, reply_markup=reply_markup, parse_mode='HTML')
        
    except Exception as e:
        await query.edit_message_text(f"❌ Error: {str(e)}")

# Helper functions
async def get_team_stats(team_name: str) -> dict:
    """Get team performance statistics"""
    # TODO: Implement actual database query
    return {
        "total_applications": 25,
        "completed_this_week": 8,
        "approval_rate": 92,
        "avg_processing_time": 3.2,
        "pending_count": 5,
        "overdue_count": 1
    }

async def get_team_workload(team_name: str) -> dict:
    """Get team workload information"""
    # TODO: Implement actual database query
    return {
        "current": 18,
        "capacity": 20,
        "utilization": 90,
        "received": 3,
        "in_progress": 8,
        "under_review": 5,
        "need_documents": 2,
        "avg_processing_time": "3.2 days",
        "weekly_target": 15
    } 