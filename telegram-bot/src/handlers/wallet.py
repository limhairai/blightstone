"""
Wallet management handlers for Telegram bot
Handles wallet balance checks and account top-ups
"""

from telegram import Update
from telegram.ext import ContextTypes
from services.supabase_service import SupabaseService
from services.dolphin_service import DolphinCloudAPI, format_currency
import logging
import os

logger = logging.getLogger(__name__)

class WalletHandler:
    def __init__(self):
        self.supabase_service = SupabaseService()
        self.dolphin_api = DolphinCloudAPI()
        self.payment_credential_id = os.getenv("PAYMENT_CREDENTIAL_ID")
    
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
    
    async def wallet_balance(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /wallet <org_id> command"""
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
                "❌ **Usage:** `/wallet <org_id>`\n\n"
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
        
        # Get wallet balance
        balance = self.supabase_service.get_wallet_balance(org_id)
        
        # Get organization info
        orgs = self.supabase_service.get_user_organizations(telegram_user.user_id)
        org = next((o for o in orgs if o.id == org_id), None)
        
        if not org:
            await update.message.reply_text(
                "❌ **Organization Not Found**",
                parse_mode='Markdown'
            )
            return
        
        message = f"💵 **Wallet Balance for {org.name}**\n\n"
        message += f"💰 **Current Balance:** {format_currency(balance)}\n"
        message += f"📊 **Plan:** {org.plan_id.title()}\n"
        message += f"🏢 **Businesses:** {org.current_businesses_count}\n\n"
        
        # Add balance status
        if balance < 10:
            message += "🔴 **Critical Balance** - Consider adding funds\n\n"
        elif balance < 50:
            message += "🟡 **Low Balance** - Monitor spending\n\n"
        else:
            message += "🟢 **Good Balance**\n\n"
        
        message += "💡 **Quick Actions:**\n"
        message += f"• Use `/businesses {org_id}` to see businesses\n"
        message += "• Contact support to add funds to your wallet"
        
        await update.message.reply_text(message, parse_mode='Markdown')
    
    async def check_account_balance(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /balance <account_id> command"""
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
        
        # Check if account_id provided
        if not context.args:
            await update.message.reply_text(
                "❌ **Usage:** `/balance <account_id>`\n\n"
                "Please provide an ad account ID.",
                parse_mode='Markdown'
            )
            return
        
        account_id = context.args[0]
        
        # Check group access first
        has_access, group_org = await self._check_group_access(update)
        if not has_access:
            return
        
        # Find the account and verify access
        account = None
        business = None
        
        # If in a group, only check the group's organization
        org_ids = [group_org['id']] if group_org else telegram_user.organization_ids
        
        for org_id in org_ids:
            businesses = self.supabase_service.get_organization_businesses(org_id)
            for b in businesses:
                accounts = self.supabase_service.get_business_ad_accounts(b.id)
                for acc in accounts:
                    if acc.account_id == account_id:
                        account = acc
                        business = b
                        break
                if account:
                    break
            if account:
                break
        
        if not account:
            await update.message.reply_text(
                "❌ **Account Not Found**\n\n"
                "You don't have access to this ad account or it doesn't exist.",
                parse_mode='Markdown'
            )
            return
        
        # Send checking message
        checking_message = await update.message.reply_text(
            "🔍 **Checking Account Balance...**\n\n"
            "Fetching latest data from Dolphin Cloud...",
            parse_mode='Markdown'
        )
        
        try:
            # Get live balance from Dolphin Cloud
            balance_data = await self.dolphin_api.get_account_balance_and_spend(account_id)
            
            balance = balance_data.get("balance", account.balance)
            daily_spend = balance_data.get("daily_spend", 0)
            total_spend = balance_data.get("total_spend", account.spent)
            
            # Calculate days remaining
            days_remaining = balance / daily_spend if daily_spend > 0 else float('inf')
            days_text = f"{days_remaining:.1f} days" if days_remaining != float('inf') else "∞"
            
            # Determine alert level
            if days_remaining <= 1:
                alert_emoji = "🔴"
                alert_text = "CRITICAL - Immediate action needed"
            elif days_remaining <= 3:
                alert_emoji = "🟡"
                alert_text = "WARNING - Monitor closely"
            else:
                alert_emoji = "🟢"
                alert_text = "OK"
            
            message = f"📊 **Account Balance Details**\n\n"
            message += f"🏷️ **Account:** {account.name}\n"
            message += f"🆔 **ID:** `{account_id}`\n"
            message += f"🏪 **Business:** {business.name}\n\n"
            
            message += f"💰 **Current Balance:** {format_currency(balance)} {alert_emoji}\n"
            message += f"📈 **Daily Spend:** {format_currency(daily_spend)}\n"
            message += f"📊 **Total Spend (7d):** {format_currency(total_spend)}\n"
            message += f"⏰ **Days Remaining:** {days_text}\n\n"
            
            message += f"🚨 **Status:** {alert_text}\n\n"
            
            message += "💡 **Quick Actions:**\n"
            message += f"• `/topup {account_id} <amount>` - Add funds\n"
            message += f"• `/accounts {business.id}` - View all accounts\n"
            message += f"• `/sync {business.id}` - Refresh data"
            
            await checking_message.edit_text(message, parse_mode='Markdown')
            
        except Exception as e:
            logger.error(f"Error checking balance for account {account_id}: {e}")
            await checking_message.edit_text(
                f"❌ **Balance Check Failed**\n\n"
                f"Could not fetch latest balance for account `{account_id}`.\n\n"
                f"**Stored Balance:** {format_currency(account.balance)}\n"
                f"**Last Updated:** {account.last_activity}\n\n"
                f"Try using `/sync {business.id}` to refresh data.",
                parse_mode='Markdown'
            )
    
    async def topup_account(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /topup <account_id> <amount> command"""
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
        
        # Check if arguments provided
        if len(context.args) < 2:
            await update.message.reply_text(
                "❌ **Usage:** `/topup <account_id> <amount>`\n\n"
                "Example: `/topup 123456789 50.00`\n\n"
                "Please provide both account ID and amount.",
                parse_mode='Markdown'
            )
            return
        
        account_id = context.args[0]
        
        try:
            amount = float(context.args[1])
            if amount <= 0:
                raise ValueError("Amount must be positive")
        except ValueError:
            await update.message.reply_text(
                "❌ **Invalid Amount**\n\n"
                "Please provide a valid positive number.\n"
                "Example: `/topup 123456789 50.00`",
                parse_mode='Markdown'
            )
            return
        
        # Find the account and verify access
        account = None
        business = None
        org_id = None
        
        for org in telegram_user.organization_ids:
            businesses = self.supabase_service.get_organization_businesses(org)
            for b in businesses:
                accounts = self.supabase_service.get_business_ad_accounts(b.id)
                for acc in accounts:
                    if acc.account_id == account_id:
                        account = acc
                        business = b
                        org_id = org
                        break
                if account:
                    break
            if account:
                break
        
        if not account:
            await update.message.reply_text(
                "❌ **Account Not Found**\n\n"
                "You don't have access to this ad account or it doesn't exist.",
                parse_mode='Markdown'
            )
            return
        
        # Check if user has permission to top up (owner or admin)
        user_role = telegram_user.roles.get(org_id, 'member')
        if user_role not in ['owner', 'admin']:
            await update.message.reply_text(
                "❌ **Permission Denied**\n\n"
                "Only organization owners and admins can top up accounts.\n"
                f"Your role: {user_role.title()}",
                parse_mode='Markdown'
            )
            return
        
        # Check wallet balance
        wallet_balance = self.supabase_service.get_wallet_balance(org_id)
        if wallet_balance < amount:
            await update.message.reply_text(
                f"❌ **Insufficient Wallet Balance**\n\n"
                f"**Requested:** {format_currency(amount)}\n"
                f"**Available:** {format_currency(wallet_balance)}\n\n"
                f"Please add funds to your organization wallet first.\n"
                f"Use `/wallet {org_id}` to check balance.",
                parse_mode='Markdown'
            )
            return
        
        # Check if payment credential is configured
        if not self.payment_credential_id:
            await update.message.reply_text(
                "❌ **Payment System Not Configured**\n\n"
                "Automatic top-ups are not available yet.\n"
                "Please contact support to add funds manually.",
                parse_mode='Markdown'
            )
            return
        
        # Send confirmation message
        confirmation_message = await update.message.reply_text(
            f"💸 **Top-up Confirmation**\n\n"
            f"🏷️ **Account:** {account.name}\n"
            f"🆔 **ID:** `{account_id}`\n"
            f"💰 **Amount:** {format_currency(amount)}\n"
            f"💵 **Wallet Balance:** {format_currency(wallet_balance)}\n\n"
            f"⏳ **Processing top-up...**",
            parse_mode='Markdown'
        )
        
        try:
            # Attempt top-up via Dolphin Cloud
            topup_result = await self.dolphin_api.topup_account(
                cab_id=account_id,
                credential_id=self.payment_credential_id,
                amount=amount
            )
            
            # Deduct from wallet
            success = self.supabase_service.update_wallet_balance(
                org_id, 
                -int(amount * 100)  # Convert to cents and make negative
            )
            
            if success:
                # Record transaction
                self.supabase_service.record_transaction(
                    org_id=org_id,
                    business_id=business.id,
                    amount_cents=-int(amount * 100),
                    transaction_type="topup",
                    description=f"Top-up for ad account {account_id}",
                    metadata={
                        "account_id": account_id,
                        "account_name": account.name,
                        "telegram_user_id": telegram_id
                    }
                )
                
                new_wallet_balance = wallet_balance - amount
                
                await confirmation_message.edit_text(
                    f"✅ **Top-up Successful!**\n\n"
                    f"🏷️ **Account:** {account.name}\n"
                    f"🆔 **ID:** `{account_id}`\n"
                    f"💰 **Amount Added:** {format_currency(amount)}\n"
                    f"💵 **Remaining Wallet:** {format_currency(new_wallet_balance)}\n\n"
                    f"🔄 Use `/balance {account_id}` to check updated balance",
                    parse_mode='Markdown'
                )
            else:
                await confirmation_message.edit_text(
                    f"❌ **Top-up Failed**\n\n"
                    f"The top-up was processed but wallet deduction failed.\n"
                    f"Please contact support to resolve this issue.",
                    parse_mode='Markdown'
                )
            
        except Exception as e:
            logger.error(f"Error topping up account {account_id}: {e}")
            await confirmation_message.edit_text(
                f"❌ **Top-up Failed**\n\n"
                f"Could not process top-up for account `{account_id}`.\n\n"
                f"**Error:** {str(e)}\n\n"
                f"Please try again or contact support.",
                parse_mode='Markdown'
            )

# Create handler instance
wallet_handler = WalletHandler() 