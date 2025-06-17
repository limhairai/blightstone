"""
Account management handlers for Telegram bot
Handles organization, business, and ad account operations
"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from services.supabase_service import SupabaseService
from services.dolphin_service import DolphinCloudAPI, get_account_status_emoji, format_currency, calculate_days_remaining
import logging

logger = logging.getLogger(__name__)

class AccountsHandler:
    def __init__(self):
        self.supabase_service = SupabaseService()
        self.dolphin_api = DolphinCloudAPI()
    
    async def _check_group_access(self, update: Update, org_id: str = None) -> tuple[bool, dict]:
        """Check if user has access to data in this group context
        Returns (has_access, group_org_data)
        """
        # If not in a group, allow access (individual chat)
        if update.effective_chat.type not in ['group', 'supergroup']:
            return True, None
        
        # Check if group is assigned to an organization
        group_org = await self.supabase_service.get_group_organization(update.effective_chat.id)
        
        if not group_org:
            # Unassigned group - dangerous, show warning
            await update.message.reply_text(
                "⚠️ **Unassigned Group Warning**\n\n"
                "This Telegram group is not assigned to any organization.\n"
                "This means it would show ALL client data, which is unsafe.\n\n"
                "🔒 **Admin:** Use `/admin_add_group <org_id>` to assign this group to an organization.\n"
                "📋 **Check:** Use `/admin_check_group` to see group status.",
                parse_mode='Markdown'
            )
            return False, None
        
        # If org_id specified, check if it matches group's organization
        if org_id and org_id != group_org['id']:
            await update.message.reply_text(
                f"❌ **Access Denied**\n\n"
                f"This group is assigned to a different organization.\n"
                f"You can only access data for: **{group_org.get('name', 'Unknown')}**",
                parse_mode='Markdown'
            )
            return False, group_org
        
        return True, group_org
    
    async def list_organizations(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /organizations command"""
        telegram_id = update.effective_user.id
        
        # Check if user is linked
        telegram_user = self.supabase_service.get_user_by_telegram_id(telegram_id)
        if not telegram_user:
            await update.message.reply_text(
                "❌ **Account Not Linked**\n\n"
                "Please link your AdHub account first using:\n"
                "`/link your-email@example.com`",
                parse_mode='Markdown'
            )
            return
        
        # Check if this is a group and filter by group's organization
        group_org = None
        if update.effective_chat.type in ['group', 'supergroup']:
            group_org = await self.supabase_service.get_group_organization(update.effective_chat.id)
            if group_org:
                logger.info(f"Filtering organizations for group {update.effective_chat.id} -> org {group_org['id']}")
        
        # Get user's organizations
        orgs = self.supabase_service.get_user_organizations(telegram_user.user_id)
        
        # Filter by group organization if in a group
        if group_org:
            orgs = [org for org in orgs if org.id == group_org['id']]
        
        if not orgs:
            await update.message.reply_text(
                "📭 **No Organizations Found**\n\n"
                "You don't have access to any organizations yet.\n"
                "Contact your administrator to get access.",
                parse_mode='Markdown'
            )
            return
        
        message = "🏢 **Your Organizations**\n\n"
        
        for org in orgs:
            role = telegram_user.roles.get(org.id, 'member')
            status_emoji = "✅" if org.verification_status == "approved" else "⏳"
            wallet_balance = org.wallet_balance_cents / 100
            
            message += f"{status_emoji} **{org.name}**\n"
            message += f"   • Role: {role.title()}\n"
            message += f"   • Plan: {org.plan_id.title()}\n"
            message += f"   • Businesses: {org.current_businesses_count}\n"
            message += f"   • Wallet: ${wallet_balance:.2f}\n"
            message += f"   • ID: `{org.id}`\n\n"
            message += f"   Use `/businesses {org.id}` to see businesses\n"
            message += f"   Use `/wallet {org.id}` to check wallet\n\n"
        
        await update.message.reply_text(message, parse_mode='Markdown')
    
    async def list_businesses(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /businesses <org_id> command"""
        telegram_id = update.effective_user.id
        
        # Check if user is linked
        telegram_user = self.supabase_service.get_user_by_telegram_id(telegram_id)
        if not telegram_user:
            await update.message.reply_text(
                "❌ **Account Not Linked**\n\n"
                "Please link your AdHub account first using:\n"
                "`/link your-email@example.com`",
                parse_mode='Markdown'
            )
            return
        
        # Check if org_id provided
        if not context.args:
            await update.message.reply_text(
                "❌ **Usage:** `/businesses <org_id>`\n\n"
                "Please provide an organization ID.\n"
                "Use `/organizations` to see your organizations.",
                parse_mode='Markdown'
            )
            return
        
        org_id = context.args[0]
        
        # Check group access and organization permissions
        has_access, group_org = await self._check_group_access(update, org_id)
        if not has_access:
            return
        
        # Check if user has access to this organization
        if org_id not in telegram_user.organization_ids:
            await update.message.reply_text(
                "❌ **Access Denied**\n\n"
                "You don't have access to this organization.",
                parse_mode='Markdown'
            )
            return
        
        # Get businesses for this organization
        businesses = self.supabase_service.get_organization_businesses(org_id)
        
        if not businesses:
            await update.message.reply_text(
                "📭 **No Businesses Found**\n\n"
                "This organization doesn't have any businesses yet.",
                parse_mode='Markdown'
            )
            return
        
        message = f"🏪 **Businesses in Organization**\n\n"
        
        for business in businesses:
            status_emoji = "🟢" if business.status == "active" else "🔴"
            bm_info = f"BM: {business.business_id}" if business.business_id else "BM: Not linked"
            
            message += f"{status_emoji} **{business.name}**\n"
            message += f"   • Status: {business.status.title()}\n"
            message += f"   • {bm_info}\n"
            message += f"   • ID: `{business.id}`\n\n"
            message += f"   Use `/accounts {business.id}` to see ad accounts\n\n"
        
        await update.message.reply_text(message, parse_mode='Markdown')
    
    async def list_accounts(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /accounts <business_id> command"""
        telegram_id = update.effective_user.id
        
        # Check if user is linked
        telegram_user = self.supabase_service.get_user_by_telegram_id(telegram_id)
        if not telegram_user:
            await update.message.reply_text(
                "❌ **Account Not Linked**\n\n"
                "Please link your AdHub account first using:\n"
                "`/link your-email@example.com`",
                parse_mode='Markdown'
            )
            return
        
        # Check if business_id provided
        if not context.args:
            await update.message.reply_text(
                "❌ **Usage:** `/accounts <business_id>`\n\n"
                "Please provide a business ID.\n"
                "Use `/businesses <org_id>` to see businesses.",
                parse_mode='Markdown'
            )
            return
        
        business_id = context.args[0]
        
        # Check group access first
        has_access, group_org = await self._check_group_access(update)
        if not has_access:
            return
        
        # Get business to verify access
        business = None
        # If in a group, only check the group's organization
        org_ids = [group_org['id']] if group_org else telegram_user.organization_ids
        
        for org_id in org_ids:
            businesses = self.supabase_service.get_organization_businesses(org_id)
            for b in businesses:
                if b.id == business_id:
                    business = b
                    break
            if business:
                break
        
        if not business:
            await update.message.reply_text(
                "❌ **Access Denied**\n\n"
                "You don't have access to this business.",
                parse_mode='Markdown'
            )
            return
        
        # Get ad accounts for this business
        accounts = self.supabase_service.get_business_ad_accounts(business_id)
        
        if not accounts:
            await update.message.reply_text(
                "📭 **No Ad Accounts Found**\n\n"
                "This business doesn't have any ad accounts yet.",
                parse_mode='Markdown'
            )
            return
        
        message = f"💰 **Ad Accounts for {business.name}**\n\n"
        
        # Get live data from Dolphin Cloud if available
        live_data = {}
        if business.business_id:  # If BM is linked
            try:
                live_accounts = await self.dolphin_api.get_fb_accounts(
                    business_manager_id=business.business_id
                )
                for acc in live_accounts:
                    live_data[acc.get("account_id", "")] = acc
            except Exception as e:
                logger.warning(f"Could not fetch live data from Dolphin Cloud: {e}")
        
        for account in accounts:
            status_emoji = get_account_status_emoji(account.status)
            
            # Use live data if available, otherwise use stored data
            live_acc = live_data.get(account.account_id, {})
            balance = live_acc.get("balance", account.balance)
            daily_spend = live_acc.get("spend", 0) / 7  # Rough daily average
            
            # Calculate days remaining
            days_remaining = calculate_days_remaining(balance, daily_spend)
            days_text = f"{days_remaining:.1f} days" if days_remaining != float('inf') else "∞"
            
            # Determine alert level
            if days_remaining <= 1:
                alert_emoji = "🔴"
            elif days_remaining <= 3:
                alert_emoji = "🟡"
            else:
                alert_emoji = "🟢"
            
            message += f"{status_emoji} **{account.name}**\n"
            message += f"   • Account ID: `{account.account_id}`\n"
            message += f"   • Status: {account.status.title()}\n"
            message += f"   • Balance: {format_currency(balance)} {alert_emoji}\n"
            message += f"   • Days remaining: {days_text}\n"
            message += f"   • Last activity: {account.last_activity}\n\n"
            message += f"   Use `/balance {account.account_id}` for details\n"
            message += f"   Use `/topup {account.account_id} <amount>` to add funds\n\n"
        
        # Add sync option if BM is linked
        if business.business_id:
            message += f"💡 Use `/sync {business_id}` to refresh data from Dolphin Cloud"
        
        await update.message.reply_text(message, parse_mode='Markdown')
    
    async def sync_business(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /sync <business_id> command"""
        telegram_id = update.effective_user.id
        
        # Check if user is linked
        telegram_user = self.supabase_service.get_user_by_telegram_id(telegram_id)
        if not telegram_user:
            await update.message.reply_text(
                "❌ **Account Not Linked**\n\n"
                "Please link your AdHub account first.",
                parse_mode='Markdown'
            )
            return
        
        # Check if business_id provided
        if not context.args:
            await update.message.reply_text(
                "❌ **Usage:** `/sync <business_id>`\n\n"
                "Please provide a business ID.",
                parse_mode='Markdown'
            )
            return
        
        business_id = context.args[0]
        
        # Check group access first
        has_access, group_org = await self._check_group_access(update)
        if not has_access:
            return
        
        # Get business to verify access
        business = None
        # If in a group, only check the group's organization
        org_ids = [group_org['id']] if group_org else telegram_user.organization_ids
        
        for org_id in org_ids:
            businesses = self.supabase_service.get_organization_businesses(org_id)
            for b in businesses:
                if b.id == business_id:
                    business = b
                    break
            if business:
                break
        
        if not business:
            await update.message.reply_text(
                "❌ **Access Denied**\n\n"
                "You don't have access to this business.",
                parse_mode='Markdown'
            )
            return
        
        if not business.business_id:
            await update.message.reply_text(
                "❌ **Business Manager Not Linked**\n\n"
                "This business doesn't have a Facebook Business Manager linked.",
                parse_mode='Markdown'
            )
            return
        
        # Send syncing message
        sync_message = await update.message.reply_text(
            "🔄 **Syncing Account Data...**\n\n"
            "Fetching latest data from Dolphin Cloud...",
            parse_mode='Markdown'
        )
        
        try:
            # Sync data from Dolphin Cloud
            updated_accounts = await self.dolphin_api.sync_account_data(business.business_id)
            
            await sync_message.edit_text(
                f"✅ **Sync Complete!**\n\n"
                f"Updated data for {len(updated_accounts)} accounts.\n\n"
                f"Use `/accounts {business_id}` to see the latest data.",
                parse_mode='Markdown'
            )
            
        except Exception as e:
            logger.error(f"Error syncing business {business_id}: {e}")
            await sync_message.edit_text(
                "❌ **Sync Failed**\n\n"
                "Could not sync data from Dolphin Cloud.\n"
                "Please try again later or contact support.",
                parse_mode='Markdown'
            )

# Create handler instance
accounts_handler = AccountsHandler() 