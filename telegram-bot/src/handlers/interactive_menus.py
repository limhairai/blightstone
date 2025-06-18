"""
Interactive menu system for AdHub Telegram bot
Inspired by BullX - button-driven interface instead of commands
"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from services.backend_api import BackendAPI
from utils.formatting import format_currency
import logging
import os

logger = logging.getLogger(__name__)

class InteractiveMenus:
    def __init__(self):
        self.backend_api = BackendAPI()
        self.webapp_url = os.getenv("WEBAPP_URL", "https://adhub.tech")
    
    async def show_main_menu(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Show the main menu with beautiful buttons"""
        telegram_id = update.effective_user.id
        
        # Get user access info from backend
        user_info = await self.backend_api.get_user_access_info(telegram_id)
        
        if user_info.get("status") == "error" or not user_info.get("organizations"):
            await self.show_welcome_menu(update, context)
            return
        
        # Get user's organizations for quick stats
        orgs = user_info.get("organizations", [])
        total_balance = sum(float(org.get("wallet_balance", 0)) for org in orgs)
        
        # Check if user is admin
        admin_user_ids = os.getenv('ADMIN_USER_IDS', '').split(',')
        is_admin = str(telegram_id) in admin_user_ids
        
        # Create main menu
        keyboard = [
            [
                InlineKeyboardButton("💰 Wallet", callback_data="menu_wallet"),
                InlineKeyboardButton("📊 Accounts", callback_data="menu_accounts")
            ],
            [
                InlineKeyboardButton("📝 Applications", callback_data="menu_applications"),
                InlineKeyboardButton("💳 Add Funds", callback_data="menu_payments")
            ],
            [
                InlineKeyboardButton("📈 Analytics", callback_data="menu_analytics"),
                InlineKeyboardButton("🔔 Notifications", callback_data="menu_notifications")
            ],
            [
                InlineKeyboardButton("🏢 Organizations", callback_data="menu_organizations"),
                InlineKeyboardButton("⚙️ Settings", callback_data="menu_settings")
            ],
            [
                InlineKeyboardButton("🌐 Open Web Dashboard", url=f"{self.webapp_url}/dashboard")
            ]
        ]
        
        # Add admin button if user is admin
        if is_admin:
            keyboard.append([
                InlineKeyboardButton("🔧 Admin Panel", callback_data="menu_admin")
            ])
        
        # Add help and refresh buttons
        keyboard.append([
            InlineKeyboardButton("❓ Help", callback_data="menu_help"),
            InlineKeyboardButton("🔄 Refresh", callback_data="menu_main")
        ])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        message = f"🎯 **AdHub Dashboard**\n\n"
        message += f"👋 Welcome back, **{update.effective_user.first_name}**!\n\n"
        message += f"💵 **Total Balance:** ${total_balance:.2f}\n"
        message += f"🏢 **Organizations:** {len(orgs)}\n"
        message += f"🕐 **Last Updated:** Just now\n\n"
        message += f"Select an option below:"
        
        if update.callback_query:
            await update.callback_query.edit_message_text(
                message, parse_mode='Markdown', reply_markup=reply_markup
            )
        else:
            await update.message.reply_text(
                message, parse_mode='Markdown', reply_markup=reply_markup
            )
    
    async def show_welcome_menu(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Show welcome menu for unlinked users"""
        keyboard = [
            [
                InlineKeyboardButton("🔗 Link Account", callback_data="action_link_account"),
            ],
            [
                InlineKeyboardButton("🌐 Visit Website", url="https://adhub.tech"),
                InlineKeyboardButton("📚 Learn More", callback_data="menu_about")
            ],
            [
                InlineKeyboardButton("❓ Get Help", callback_data="menu_help_unlinked")
            ]
        ]
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        message = f"🎯 **Welcome to AdHub!**\n\n"
        message += f"👋 Hi **{update.effective_user.first_name}**!\n\n"
        message += f"🚀 **AdHub** is your comprehensive ad account management platform.\n\n"
        message += f"**Features:**\n"
        message += f"💰 Wallet management\n"
        message += f"📊 Account monitoring\n"
        message += f"💳 Easy payments\n"
        message += f"📈 Real-time analytics\n\n"
        message += f"To get started, link your AdHub account:"
        
        if update.callback_query:
            await update.callback_query.edit_message_text(
                message, parse_mode='Markdown', reply_markup=reply_markup
            )
        else:
            await update.message.reply_text(
                message, parse_mode='Markdown', reply_markup=reply_markup
            )
    
    async def show_wallet_menu(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Show wallet management menu"""
        telegram_id = update.effective_user.id
        
        # Get user access info from backend
        user_info = await self.backend_api.get_user_access_info(telegram_id)
        
        if user_info.get("status") == "error" or not user_info.get("organizations"):
            await self.show_welcome_menu(update, context)
            return
        
        # Get organizations
        orgs = user_info.get("organizations", [])
        
        keyboard = []
        
        # Add organization wallet buttons
        for org in orgs[:6]:  # Limit to 6 orgs for clean UI
            balance = float(org.get("wallet_balance", 0))
            status_emoji = "🟢" if balance > 100 else "🟡" if balance > 10 else "🔴"
            keyboard.append([
                InlineKeyboardButton(
                    f"{status_emoji} {org.get('name', 'Unknown')} - ${balance:.2f}",
                    callback_data=f"wallet_org_{org.get('id')}"
                )
            ])
        
        # Action buttons
        keyboard.extend([
            [
                InlineKeyboardButton("💳 Add Funds", callback_data="menu_payments"),
                InlineKeyboardButton("📊 Analytics", callback_data="wallet_analytics")
            ],
            [
                InlineKeyboardButton("🔄 Refresh", callback_data="menu_wallet"),
                InlineKeyboardButton("⬅️ Back", callback_data="menu_main")
            ]
        ])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        total_balance = sum(float(org.get("wallet_balance", 0)) for org in orgs)
        
        message = f"💰 **Wallet Management**\n\n"
        message += f"💵 **Total Balance:** ${total_balance:.2f}\n"
        message += f"🏢 **Organizations:** {len(orgs)}\n\n"
        
        if orgs:
            message += f"Select an organization to manage:"
        else:
            message += f"No organizations found. Contact your admin."
        
        await update.callback_query.edit_message_text(
            message, parse_mode='Markdown', reply_markup=reply_markup
        )
    
    async def show_accounts_menu(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Show ad accounts menu"""
        telegram_id = update.effective_user.id
        
        # Get user access info from backend
        user_info = await self.backend_api.get_user_access_info(telegram_id)
        
        if user_info.get("status") == "error" or not user_info.get("organizations"):
            await self.show_welcome_menu(update, context)
            return
        
        # Get organizations
        orgs = user_info.get("organizations", [])
        
        keyboard = []
        
        # Add organization buttons
        for org in orgs[:6]:
            # Get account count from backend
            org_id = org.get("id")
            account_count = org.get("account_count", 0)  # This would come from backend
            
            keyboard.append([
                InlineKeyboardButton(
                    f"🏢 {org.get('name', 'Unknown')} ({account_count} accounts)",
                    callback_data=f"accounts_org_{org_id}"
                )
            ])
        
        # Action buttons
        keyboard.extend([
            [
                InlineKeyboardButton("🔄 Sync All", callback_data="accounts_sync_all"),
                InlineKeyboardButton("📊 Overview", callback_data="accounts_overview")
            ],
            [
                InlineKeyboardButton("⬅️ Back", callback_data="menu_main")
            ]
        ])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        message = f"📊 **Ad Accounts**\n\n"
        message += f"🏢 **Organizations:** {len(orgs)}\n"
        
        total_accounts = 0
        for org in orgs:
            businesses = self.supabase_service.get_organization_businesses(org.id)
            total_accounts += sum(len(self.supabase_service.get_business_ad_accounts(b.id)) for b in businesses)
        
        message += f"📱 **Total Accounts:** {total_accounts}\n\n"
        message += f"Select an organization to view accounts:"
        
        await update.callback_query.edit_message_text(
            message, parse_mode='Markdown', reply_markup=reply_markup
        )
    
    async def show_applications_menu(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Show applications management menu"""
        telegram_id = update.effective_user.id
        
        # Get user access info from backend
        user_info = await self.backend_api.get_user_access_info(telegram_id)
        
        if user_info.get("status") == "error" or not user_info.get("organizations"):
            await self.show_welcome_menu(update, context)
            return
        
        # Get applications from backend
        try:
            applications = await self.backend_api.get_user_applications(telegram_id)
        except Exception as e:
            logger.error(f"Error fetching applications: {e}")
            applications = []
        
        keyboard = []
        
        # Add recent applications
        if applications:
            for app in applications[:5]:  # Show last 5 applications
                status = app.get("status", "pending")
                status_emoji = {
                    "pending": "⏳",
                    "under_review": "👀", 
                    "approved": "✅",
                    "rejected": "❌"
                }.get(status, "❓")
                
                keyboard.append([
                    InlineKeyboardButton(
                        f"{status_emoji} {app.get('account_name', 'Unknown')} - {status.title()}",
                        callback_data=f"app_view_{app.get('id')}"
                    )
                ])
        
        # Action buttons
        keyboard.extend([
            [
                InlineKeyboardButton("➕ New Application", callback_data="app_new"),
                InlineKeyboardButton("📋 View All", callback_data="app_list")
            ],
            [
                InlineKeyboardButton("🔔 Notifications", callback_data="menu_notifications"),
                InlineKeyboardButton("📊 Statistics", callback_data="app_stats")
            ],
            [
                InlineKeyboardButton("🔄 Refresh", callback_data="menu_applications"),
                InlineKeyboardButton("⬅️ Back", callback_data="menu_main")
            ]
        ])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        # Count applications by status
        pending_count = len([a for a in applications if a.get("status") == "pending"])
        approved_count = len([a for a in applications if a.get("status") == "approved"])
        rejected_count = len([a for a in applications if a.get("status") == "rejected"])
        
        message = f"📝 **Applications Management**\n\n"
        message += f"📊 **Summary:**\n"
        message += f"⏳ Pending: {pending_count}\n"
        message += f"✅ Approved: {approved_count}\n"
        message += f"❌ Rejected: {rejected_count}\n"
        message += f"📋 Total: {len(applications)}\n\n"
        
        if applications:
            message += f"Recent applications:"
        else:
            message += f"No applications yet. Create your first one!"
        
        await update.callback_query.edit_message_text(
            message, parse_mode='Markdown', reply_markup=reply_markup
        )
    
    async def show_notifications_menu(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Show notifications menu"""
        telegram_id = update.effective_user.id
        
        # Get notifications from backend
        try:
            notifications = await self.backend_api.get_user_notifications(telegram_id)
        except Exception as e:
            logger.error(f"Error fetching notifications: {e}")
            notifications = []
        
        keyboard = []
        
        # Add recent notifications
        if notifications:
            for notif in notifications[:5]:  # Show last 5 notifications
                read_emoji = "📖" if notif.get("read") else "📩"
                keyboard.append([
                    InlineKeyboardButton(
                        f"{read_emoji} {notif.get('title', 'Notification')[:30]}...",
                        callback_data=f"notif_view_{notif.get('id')}"
                    )
                ])
        
        # Action buttons
        keyboard.extend([
            [
                InlineKeyboardButton("📋 View All", callback_data="notif_list"),
                InlineKeyboardButton("✅ Mark All Read", callback_data="notif_mark_all")
            ],
            [
                InlineKeyboardButton("🔄 Refresh", callback_data="menu_notifications"),
                InlineKeyboardButton("⬅️ Back", callback_data="menu_main")
            ]
        ])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        unread_count = len([n for n in notifications if not n.get("read", False)])
        
        message = f"🔔 **Notifications**\n\n"
        message += f"📩 **Unread:** {unread_count}\n"
        message += f"📋 **Total:** {len(notifications)}\n\n"
        
        if notifications:
            message += f"Recent notifications:"
        else:
            message += f"No notifications yet."
        
        await update.callback_query.edit_message_text(
            message, parse_mode='Markdown', reply_markup=reply_markup
        )
    
    async def show_payments_menu(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Show payments menu with crypto-style options"""
        telegram_id = update.effective_user.id
        telegram_user = self.supabase_service.get_user_by_telegram_id(telegram_id)
        
        if not telegram_user:
            await self.show_welcome_menu(update, context)
            return
        
        # Get organizations for payment
        orgs = self.supabase_service.get_user_organizations(telegram_user.user_id)
        
        keyboard = []
        
        # Quick amount buttons (like BullX)
        keyboard.append([
            InlineKeyboardButton("💵 $50", callback_data="pay_quick_50"),
            InlineKeyboardButton("💰 $100", callback_data="pay_quick_100"),
            InlineKeyboardButton("💎 $500", callback_data="pay_quick_500")
        ])
        
        keyboard.append([
            InlineKeyboardButton("🚀 $1,000", callback_data="pay_quick_1000"),
            InlineKeyboardButton("🔥 $5,000", callback_data="pay_quick_5000"),
            InlineKeyboardButton("✨ Custom", callback_data="pay_custom")
        ])
        
        # Payment methods
        keyboard.extend([
            [
                InlineKeyboardButton("💳 Credit Card", callback_data="pay_method_card"),
                InlineKeyboardButton("🏦 Bank Transfer", callback_data="pay_method_bank")
            ],
            [
                InlineKeyboardButton("📊 Payment History", callback_data="payment_history"),
                InlineKeyboardButton("❓ Payment Help", callback_data="payment_help")
            ],
            [
                InlineKeyboardButton("⬅️ Back", callback_data="menu_main")
            ]
        ])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        message = f"💳 **Add Funds to Wallet**\n\n"
        message += f"🚀 **Quick Amounts** - Select to add funds instantly:\n\n"
        message += f"💰 **Payment Methods:**\n"
        message += f"• 💳 Credit/Debit Cards\n"
        message += f"• 🏦 Bank Transfers (ACH)\n"
        message += f"• 💰 Digital Wallets\n\n"
        message += f"🔒 **Secure payments powered by Stripe**\n"
        message += f"💸 **Processing fee:** 3% per transaction"
        
        await update.callback_query.edit_message_text(
            message, parse_mode='Markdown', reply_markup=reply_markup
        )
    
    async def show_admin_menu(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Show admin menu for administrators"""
        keyboard = [
            [
                InlineKeyboardButton("👥 Users", callback_data="admin_users"),
                InlineKeyboardButton("🏢 Organizations", callback_data="admin_organizations")
            ],
            [
                InlineKeyboardButton("🔑 Access Codes", callback_data="admin_access_codes"),
                InlineKeyboardButton("📊 System Stats", callback_data="admin_stats")
            ],
            [
                InlineKeyboardButton("🔄 Sync BMs", callback_data="admin_sync_bms"),
                InlineKeyboardButton("⚙️ Settings", callback_data="admin_settings")
            ],
            [
                InlineKeyboardButton("🚨 Alerts", callback_data="admin_alerts"),
                InlineKeyboardButton("📝 Logs", callback_data="admin_logs")
            ],
            [
                InlineKeyboardButton("⬅️ Back to Main", callback_data="menu_main")
            ]
        ]
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        message = f"🔧 **Admin Dashboard**\n\n"
        message += f"🛡️ **System Management**\n"
        message += f"Select an admin function:"
        
        await update.callback_query.edit_message_text(
            message, parse_mode='Markdown', reply_markup=reply_markup
        )
    
    async def show_organization_selector(self, update: Update, context: ContextTypes.DEFAULT_TYPE, action: str) -> None:
        """Show organization selector for actions"""
        telegram_id = update.effective_user.id
        telegram_user = self.supabase_service.get_user_by_telegram_id(telegram_id)
        
        if not telegram_user:
            await self.show_welcome_menu(update, context)
            return
        
        orgs = self.supabase_service.get_user_organizations(telegram_user.user_id)
        
        keyboard = []
        
        for org in orgs:
            balance = org.wallet_balance_cents / 100
            role = telegram_user.roles.get(org.id, 'member')
            role_emoji = "👑" if role == "owner" else "🛡️" if role == "admin" else "👤"
            
            keyboard.append([
                InlineKeyboardButton(
                    f"{role_emoji} {org.name} (${balance:.2f})",
                    callback_data=f"{action}_{org.id}"
                )
            ])
        
        keyboard.append([
            InlineKeyboardButton("⬅️ Back", callback_data="menu_payments")
        ])
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        message = f"🏢 **Select Organization**\n\n"
        message += f"Choose which organization to add funds to:\n\n"
        message += f"👑 Owner  🛡️ Admin  👤 Member"
        
        await update.callback_query.edit_message_text(
            message, parse_mode='Markdown', reply_markup=reply_markup
        )
    
    async def handle_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle all callback queries from buttons"""
        query = update.callback_query
        await query.answer()
        
        data = query.data
        
        # Check if it's an access code callback first
        from src.handlers.access_codes import access_code_manager
        if await access_code_manager.handle_callback_query(update, context):
            return
        
        # Main menu navigation
        if data == "menu_main":
            await self.show_main_menu(update, context)
        elif data == "menu_wallet":
            await self.show_wallet_menu(update, context)
        elif data == "menu_accounts":
            await self.show_accounts_menu(update, context)
        elif data == "menu_applications":
            await self.show_applications_menu(update, context)
        elif data == "menu_notifications":
            await self.show_notifications_menu(update, context)
        elif data == "menu_payments":
            await self.show_payments_menu(update, context)
        elif data == "menu_help":
            await self.show_help_menu(update, context)
        elif data == "menu_admin":
            await self.show_admin_menu(update, context)
        elif data == "admin_access_codes":
            await self.show_admin_access_codes(update, context)
            
        # Quick payment actions
        elif data.startswith("pay_quick_"):
            amount = int(data.split("_")[-1])
            await self.show_organization_selector(update, context, f"pay_{amount}")
            
        # Organization-specific actions
        elif data.startswith("pay_") and data.split("_")[1].isdigit():
            parts = data.split("_")
            amount = int(parts[1])
            org_id = parts[2] if len(parts) > 2 else None
            if org_id:
                await self.process_payment(update, context, org_id, amount)
            else:
                await self.show_organization_selector(update, context, f"pay_{amount}")
        
        # Wallet organization view
        elif data.startswith("wallet_org_"):
            org_id = data.replace("wallet_org_", "")
            await self.show_organization_wallet(update, context, org_id)
            
        # Accounts organization view  
        elif data.startswith("accounts_org_"):
            org_id = data.replace("accounts_org_", "")
            await self.show_organization_accounts(update, context, org_id)
            
        # Link account action
        elif data == "action_link_account":
            await self.show_link_instructions(update, context)
        
        # Handle any unmatched callbacks
        else:
            # Log unhandled callback for debugging
            logger.warning(f"Unhandled callback data: {data}")
    
    async def show_help_menu(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Show comprehensive help menu"""
        keyboard = [
            [
                InlineKeyboardButton("🚀 Getting Started", callback_data="help_getting_started"),
                InlineKeyboardButton("💰 Wallet Guide", callback_data="help_wallet")
            ],
            [
                InlineKeyboardButton("📊 Account Management", callback_data="help_accounts"),
                InlineKeyboardButton("💳 Payment Help", callback_data="help_payments")
            ],
            [
                InlineKeyboardButton("🔗 Linking Accounts", callback_data="help_linking"),
                InlineKeyboardButton("❓ FAQ", callback_data="help_faq")
            ],
            [
                InlineKeyboardButton("📞 Contact Support", url="https://adhub.tech/support"),
                InlineKeyboardButton("⬅️ Back", callback_data="menu_main")
            ]
        ]
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        message = f"❓ **Help & Support**\n\n"
        message += f"📚 **Available Help Topics:**\n\n"
        message += f"🚀 Getting started with AdHub\n"
        message += f"💰 Managing your wallet\n"
        message += f"📊 Account monitoring\n"
        message += f"💳 Payment methods\n"
        message += f"🔗 Account linking\n\n"
        message += f"Select a topic for detailed help:"
        
        await update.callback_query.edit_message_text(
            message, parse_mode='Markdown', reply_markup=reply_markup
        )
    
    async def show_link_instructions(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Show account linking instructions"""
        keyboard = [
            [InlineKeyboardButton("⬅️ Back", callback_data="menu_main")]
        ]
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        message = f"🔗 **Link Your AdHub Account**\n\n"
        message += f"To link your Telegram to your AdHub account, use this command:\n\n"
        message += f"`/link your-email@example.com`\n\n"
        message += f"**Example:**\n"
        message += f"`/link john@company.com`\n\n"
        message += f"📧 Make sure to use the **exact email** you registered with on AdHub.\n\n"
        message += f"❓ **Don't have an AdHub account yet?**\n"
        message += f"Visit [adhub.tech](https://adhub.tech) to create one first!"
        
        await update.callback_query.edit_message_text(
            message, parse_mode='Markdown', reply_markup=reply_markup
        )
    
    async def process_payment(self, update: Update, context: ContextTypes.DEFAULT_TYPE, org_id: str, amount: int) -> None:
        """Process payment with the new payment handler"""
        # Import here to avoid circular imports
        from src.handlers.payments import PaymentHandler
        
        payment_handler = PaymentHandler()
        
        # Simulate the payment command
        context.args = [org_id, str(amount)]
        await payment_handler.wallet_topup(update, context)
    
    async def show_organization_wallet(self, update: Update, context: ContextTypes.DEFAULT_TYPE, org_id: str) -> None:
        """Show detailed wallet view for organization"""
        telegram_id = update.effective_user.id
        telegram_user = self.supabase_service.get_user_by_telegram_id(telegram_id)
        
        # Get organization details
        orgs = self.supabase_service.get_user_organizations(telegram_user.user_id)
        org = next((o for o in orgs if o.id == org_id), None)
        
        if not org:
            await update.callback_query.answer("Organization not found", show_alert=True)
            return
        
        balance = org.wallet_balance_cents / 100
        
        keyboard = [
            [
                InlineKeyboardButton("💳 Add $50", callback_data=f"pay_50_{org_id}"),
                InlineKeyboardButton("💰 Add $100", callback_data=f"pay_100_{org_id}")
            ],
            [
                InlineKeyboardButton("💎 Add $500", callback_data=f"pay_500_{org_id}"),
                InlineKeyboardButton("✨ Custom Amount", callback_data=f"pay_custom_{org_id}")
            ],
            [
                InlineKeyboardButton("📊 Transaction History", callback_data=f"wallet_history_{org_id}"),
                InlineKeyboardButton("📈 Analytics", callback_data=f"wallet_analytics_{org_id}")
            ],
            [
                InlineKeyboardButton("⬅️ Back", callback_data="menu_wallet")
            ]
        ]
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        status_emoji = "🟢" if balance > 100 else "🟡" if balance > 10 else "🔴"
        
        message = f"💰 **{org.name} Wallet**\n\n"
        message += f"{status_emoji} **Balance:** ${balance:.2f}\n"
        message += f"📊 **Plan:** {org.plan_id.title()}\n"
        message += f"🏢 **Businesses:** {org.current_businesses_count}\n\n"
        
        if balance < 10:
            message += f"🔴 **Critical Balance** - Add funds now\n\n"
        elif balance < 50:
            message += f"🟡 **Low Balance** - Consider adding funds\n\n"
        else:
            message += f"🟢 **Good Balance**\n\n"
        
        message += f"Select an action:"
        
        await update.callback_query.edit_message_text(
            message, parse_mode='Markdown', reply_markup=reply_markup
        )
    
    async def show_admin_access_codes(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Show access codes management for admins"""
        keyboard = [
            [
                InlineKeyboardButton("🌐 Open Web Manager", url=f"{self.webapp_url}/admin/access-codes")
            ],
            [
                InlineKeyboardButton("📊 View Statistics", callback_data="admin_access_stats"),
                InlineKeyboardButton("🔄 Cleanup Expired", callback_data="admin_cleanup_codes")
            ],
            [
                InlineKeyboardButton("❓ Access Code Help", callback_data="admin_access_help"),
                InlineKeyboardButton("⬅️ Back", callback_data="menu_admin")
            ]
        ]
        
        reply_markup = InlineKeyboardMarkup(keyboard)
        
        message = f"🔑 **Access Code Management**\n\n"
        message += f"**BullX-Style Access System**\n"
        message += f"Generate secure codes for instant bot access\n\n"
        message += f"**Features:**\n"
        message += f"• 🔐 Secure code generation\n"
        message += f"• ⏰ Expiring codes with usage limits\n"
        message += f"• 📊 Complete redemption tracking\n"
        message += f"• 👑 Role-based code types\n\n"
        message += f"**Best managed via web interface** ↗️"
        
        await update.callback_query.edit_message_text(
            message,
            parse_mode='Markdown',
            reply_markup=reply_markup
        )

# Create instance
interactive_menus = InteractiveMenus() 