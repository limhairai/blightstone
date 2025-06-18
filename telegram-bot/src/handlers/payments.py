"""
Payment handlers for Telegram bot
Handles wallet top-ups via Stripe payment links
"""

from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
from services.supabase_service import SupabaseService
from services.dolphin_service import format_currency
import logging
import os
import requests
import json
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class PaymentHandler:
    def __init__(self):
        self.supabase_service = SupabaseService()
        self.backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
        
    async def wallet_topup(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /pay <org_id> <amount> command for wallet top-up"""
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
        
        # Check arguments
        if len(context.args) < 2:
            await update.message.reply_text(
                "❌ **Usage:** `/pay <org_id> <amount>`\n\n"
                "Example: `/pay org-123 100.00`\n\n"
                "Use `/organizations` to see your organization IDs.",
                parse_mode='Markdown'
            )
            return
        
        org_id = context.args[0]
        
        try:
            amount = float(context.args[1])
            if amount < 10:
                raise ValueError("Minimum amount is $10")
            if amount > 10000:
                raise ValueError("Maximum amount is $10,000")
        except ValueError as e:
            await update.message.reply_text(
                f"❌ **Invalid Amount**\n\n"
                f"Please provide a valid amount between $10 and $10,000.\n"
                f"Error: {str(e)}",
                parse_mode='Markdown'
            )
            return
        
        # Check if user has access to organization
        if org_id not in telegram_user.organization_ids:
            await update.message.reply_text(
                "❌ **Access Denied**\n\n"
                "You don't have access to this organization.\n"
                "Use `/organizations` to see your organizations.",
                parse_mode='Markdown'
            )
            return
        
        # Get organization info
        orgs = self.supabase_service.get_user_organizations(telegram_user.user_id)
        org = next((o for o in orgs if o.id == org_id), None)
        
        if not org:
            await update.message.reply_text(
                "❌ **Organization Not Found**",
                parse_mode='Markdown'
            )
            return
        
        # Check user permissions (owner/admin can make payments)
        user_role = telegram_user.roles.get(org_id, 'member')
        if user_role not in ['owner', 'admin']:
            await update.message.reply_text(
                "❌ **Permission Denied**\n\n"
                "Only organization owners and admins can add funds.\n"
                f"Your role: {user_role.title()}",
                parse_mode='Markdown'
            )
            return
        
        # Send processing message
        processing_message = await update.message.reply_text(
            "💳 **Creating Payment Link...**\n\n"
            "Please wait while we set up your payment...",
            parse_mode='Markdown'
        )
        
        try:
            # Create payment intent via backend API
            payment_data = {
                "organization_id": org_id,
                "amount": amount,
                "idempotency_key": f"tg_{telegram_id}_{org_id}_{int(datetime.now().timestamp())}"
            }
            
            # Get user's JWT token (you'll need to implement this)
            jwt_token = await self._get_user_jwt_token(telegram_user.user_id)
            
            response = requests.post(
                f"{self.backend_url}/api/payments/create-intent",
                json=payment_data,
                headers={
                    "Authorization": f"Bearer {jwt_token}",
                    "Content-Type": "application/json"
                },
                timeout=30
            )
            
            if response.status_code != 200:
                raise Exception(f"Payment creation failed: {response.text}")
            
            payment_intent = response.json()
            
            # Create payment link (for Telegram, we'll use a web payment page)
            payment_url = f"{self.backend_url.replace('8000', '3000')}/payment/{payment_intent['id']}"
            
            # Calculate fee (3%)
            fee = round(amount * 0.03, 2)
            net_amount = round(amount - fee, 2)
            
            # Create inline keyboard with payment button
            keyboard = InlineKeyboardMarkup([
                [InlineKeyboardButton("💳 Pay with Card", url=payment_url)],
                [InlineKeyboardButton("❌ Cancel", callback_data=f"cancel_payment_{payment_intent['id']}")]
            ])
            
            message = f"💰 **Payment Ready**\n\n"
            message += f"🏢 **Organization:** {org.name}\n"
            message += f"💵 **Amount:** {format_currency(amount)}\n"
            message += f"💸 **Processing Fee (3%):** {format_currency(fee)}\n"
            message += f"✅ **You'll Receive:** {format_currency(net_amount)}\n\n"
            message += f"🔒 **Secure Payment via Stripe**\n"
            message += f"Click the button below to complete your payment.\n\n"
            message += f"⏰ **Payment expires in 30 minutes**"
            
            await processing_message.edit_text(
                message,
                parse_mode='Markdown',
                reply_markup=keyboard
            )
            
            # Store payment info for tracking
            self._store_telegram_payment(telegram_id, payment_intent['id'], org_id, amount)
            
            logger.info(f"Created payment intent {payment_intent['id']} for user {telegram_id}")
            
        except Exception as e:
            logger.error(f"Error creating payment for user {telegram_id}: {e}")
            await processing_message.edit_text(
                f"❌ **Payment Creation Failed**\n\n"
                f"Could not create payment link.\n\n"
                f"**Error:** {str(e)}\n\n"
                f"Please try again or contact support.",
                parse_mode='Markdown'
            )
    
    async def check_payment_status(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /payment_status command"""
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
        
        # Get recent payments for this user
        recent_payments = self._get_user_recent_payments(telegram_id)
        
        if not recent_payments:
            await update.message.reply_text(
                "📭 **No Recent Payments**\n\n"
                "You haven't made any payments recently.\n"
                "Use `/pay <org_id> <amount>` to add funds.",
                parse_mode='Markdown'
            )
            return
        
        message = "💳 **Recent Payments**\n\n"
        
        for payment in recent_payments[:5]:  # Show last 5 payments
            status_emoji = {
                "pending": "⏳",
                "processing": "🔄",
                "succeeded": "✅",
                "failed": "❌",
                "canceled": "🚫"
            }.get(payment['status'], "❓")
            
            message += f"{status_emoji} **{format_currency(payment['amount'])}**\n"
            message += f"   • Status: {payment['status'].title()}\n"
            message += f"   • Date: {payment['created_at']}\n"
            message += f"   • Organization: {payment['org_name']}\n\n"
        
        message += "💡 Use `/pay <org_id> <amount>` to add more funds"
        
        await update.message.reply_text(message, parse_mode='Markdown')
    
    async def payment_help(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle /payment_help command"""
        help_message = """
💳 **Payment Help**

**Adding Funds:**
• `/pay <org_id> <amount>` - Add funds to organization wallet
• Example: `/pay org-123 100.00`

**Payment Methods:**
• 💳 Credit/Debit Cards (Visa, Mastercard, Amex)
• 🏦 Bank Transfers (ACH)
• 💰 Digital Wallets (Apple Pay, Google Pay)

**Payment Status:**
• `/payment_status` - Check recent payments
• `/wallet <org_id>` - Check wallet balance

**Fees & Limits:**
• 💸 **Processing Fee:** 3% per transaction
• 💵 **Minimum:** $10 per payment
• 💰 **Maximum:** $10,000 per payment
• 🔒 **Security:** All payments secured by Stripe

**Need Help?**
• Contact support if payments fail
• Check your email for payment receipts
• All transactions are logged and trackable

**Quick Tips:**
• Only owners/admins can add funds
• Payments expire after 30 minutes
• Funds are available immediately after payment
        """
        
        await update.message.reply_text(help_message, parse_mode='Markdown')
    
    async def handle_payment_callback(self, update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
        """Handle payment callback buttons"""
        query = update.callback_query
        await query.answer()
        
        if query.data.startswith("cancel_payment_"):
            payment_id = query.data.replace("cancel_payment_", "")
            
            await query.edit_message_text(
                "❌ **Payment Canceled**\n\n"
                "Your payment has been canceled.\n"
                "Use `/pay <org_id> <amount>` to try again.",
                parse_mode='Markdown'
            )
            
            # Remove payment tracking
            self._remove_telegram_payment(update.effective_user.id, payment_id)
    
    async def _get_user_jwt_token(self, user_id: str) -> str:
        """Get JWT token for user (implement based on your auth system)"""
        # TODO: Implement JWT token retrieval
        # This should get a valid JWT token for the user to authenticate with your backend
        # For now, return a placeholder
        return "placeholder_jwt_token"
    
    def _store_telegram_payment(self, telegram_id: int, payment_id: str, org_id: str, amount: float):
        """Store payment info for tracking"""
        # TODO: Implement payment tracking storage
        # This could be in-memory cache, Redis, or database
        logger.info(f"Storing payment tracking: {telegram_id} -> {payment_id}")
    
    def _get_user_recent_payments(self, telegram_id: int) -> list:
        """Get user's recent payments"""
        # TODO: Implement payment history retrieval
        # This should query your backend/database for user's payment history
        return []
    
    def _remove_telegram_payment(self, telegram_id: int, payment_id: str):
        """Remove payment tracking"""
        # TODO: Implement payment tracking removal
        logger.info(f"Removing payment tracking: {telegram_id} -> {payment_id}")

# Webhook notification handler (called when payment succeeds)
async def notify_telegram_payment_success(telegram_id: int, payment_data: dict):
    """Notify user via Telegram when payment succeeds"""
    try:
        from main import application
        
        message = f"✅ **Payment Successful!**\n\n"
        message += f"💰 **Amount:** {format_currency(payment_data['amount'])}\n"
        message += f"🏢 **Organization:** {payment_data['org_name']}\n"
        message += f"💵 **Added to Wallet:** {format_currency(payment_data['net_amount'])}\n\n"
        message += f"🎉 **Your wallet has been topped up!**\n"
        message += f"Use `/wallet {payment_data['org_id']}` to check your balance."
        
        await application.bot.send_message(
            chat_id=telegram_id,
            text=message,
            parse_mode='Markdown'
        )
        
        logger.info(f"Sent payment success notification to {telegram_id}")
        
    except Exception as e:
        logger.error(f"Error sending payment notification to {telegram_id}: {e}")

async def notify_telegram_payment_failed(telegram_id: int, payment_data: dict):
    """Notify user via Telegram when payment fails"""
    try:
        from main import application
        
        message = f"❌ **Payment Failed**\n\n"
        message += f"💰 **Amount:** {format_currency(payment_data['amount'])}\n"
        message += f"🏢 **Organization:** {payment_data['org_name']}\n"
        message += f"❗ **Reason:** {payment_data.get('failure_reason', 'Unknown error')}\n\n"
        message += f"💡 **What to do:**\n"
        message += f"• Check your card details\n"
        message += f"• Ensure sufficient funds\n"
        message += f"• Try a different payment method\n"
        message += f"• Contact support if issue persists\n\n"
        message += f"Use `/pay {payment_data['org_id']} {payment_data['amount']}` to try again."
        
        await application.bot.send_message(
            chat_id=telegram_id,
            text=message,
            parse_mode='Markdown'
        )
        
        logger.info(f"Sent payment failure notification to {telegram_id}")
        
    except Exception as e:
        logger.error(f"Error sending payment failure notification to {telegram_id}: {e}") 