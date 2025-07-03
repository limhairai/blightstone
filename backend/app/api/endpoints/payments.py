from fastapi import APIRouter, HTTPException, Depends, Request, status
from app.core.security import get_current_user
from app.core.supabase_client import get_supabase_client
from app.schemas.user import UserRead as User
from datetime import datetime, timezone
from typing import List, Dict, Optional
from pydantic import BaseModel
import stripe
import os
import logging
import json

router = APIRouter()
logger = logging.getLogger("adhub_app")

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

class PaymentIntentRequest(BaseModel):
    organization_id: str
    amount: float  # Amount in USD
    payment_method_id: Optional[str] = None
    save_payment_method: bool = False
    idempotency_key: Optional[str] = None

class PaymentMethodResponse(BaseModel):
    id: str
    type: str
    card: Optional[Dict] = None
    created: int
    is_default: bool = False

class PaymentIntentResponse(BaseModel):
    id: str
    client_secret: str
    amount: int
    currency: str
    status: str

def verify_org_membership(supabase, user_id: str, org_id: str):
    """Verify user is a member of the organization"""
    member_check = (
        supabase.table("organization_members")
        .select("user_id, role")
        .eq("organization_id", org_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    
    if not member_check.data:
        raise HTTPException(
            status_code=403, 
            detail="Not a member of this organization"
        )
    return member_check.data

@router.post("/create-intent", response_model=PaymentIntentResponse)
async def create_payment_intent(
    request: PaymentIntentRequest,
    current_user: User = Depends(get_current_user)
):
    """Create a Stripe Payment Intent for wallet top-up"""
    if request.amount < 10 or request.amount > 100000:  # $10 - $100k limits
        raise HTTPException(status_code=400, detail="Amount must be between $10 and $100,000")
    
    supabase = get_supabase_client()
    
    try:
        # Verify user is member of organization
        membership = verify_org_membership(supabase, str(current_user.uid), request.organization_id)
        
        # Get or create Stripe customer
        customer_response = (
            supabase.table("organizations")
            .select("stripe_customer_id, name")
            .eq("organization_id", request.organization_id)
            .single()
            .execute()
        )
        
        if not customer_response.data:
            raise HTTPException(status_code=404, detail="Organization not found")
        
        org_data = customer_response.data
        stripe_customer_id = org_data.get("stripe_customer_id")
        
        # Create Stripe customer if doesn't exist
        if not stripe_customer_id:
            customer = stripe.Customer.create(
                email=current_user.email,
                name=org_data["name"],
                metadata={
                    "organization_id": request.organization_id,
                    "user_id": str(current_user.uid)
                }
            )
            stripe_customer_id = customer.id
            
            # Save customer ID to database
            supabase.table("organizations").update({
                "stripe_customer_id": stripe_customer_id
            }).eq("organization_id", request.organization_id).execute()
        
        # Calculate amount in cents
        amount_cents = int(request.amount * 100)
        
        # Create Payment Intent (no fees on wallet top-up)
        intent_params = {
            "amount": amount_cents,
            "currency": "usd",
            "customer": stripe_customer_id,
            "metadata": {
                "organization_id": request.organization_id,
                "user_id": str(current_user.uid),
                "type": "wallet_topup"
            },
            "automatic_payment_methods": {"enabled": True}
        }
        
        if request.payment_method_id:
            intent_params["payment_method"] = request.payment_method_id
            intent_params["confirmation_method"] = "manual"
            intent_params["confirm"] = True
        
        if request.save_payment_method:
            intent_params["setup_future_usage"] = "off_session"
        
        if request.idempotency_key:
            intent_params["idempotency_key"] = request.idempotency_key
        
        payment_intent = stripe.PaymentIntent.create(**intent_params)
        
        # Store payment intent in database
        payment_data = {
            "stripe_payment_intent_id": payment_intent.id,
            "organization_id": request.organization_id,
            "user_id": str(current_user.uid),
            "amount": request.amount,
            "currency": "usd",
            "status": payment_intent.status,
            "type": "wallet_topup",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        supabase.table("payments").insert(payment_data).execute()
        
        logger.info(f"Created payment intent {payment_intent.id} for org {request.organization_id}")
        
        return PaymentIntentResponse(
            id=payment_intent.id,
            client_secret=payment_intent.client_secret,
            amount=payment_intent.amount,
            currency=payment_intent.currency,
            status=payment_intent.status
        )
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating payment intent: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to create payment intent")

@router.get("/methods", response_model=List[PaymentMethodResponse])
async def list_payment_methods(
    organization_id: str,
    current_user: User = Depends(get_current_user)
):
    """List saved payment methods for organization"""
    supabase = get_supabase_client()
    
    try:
        # Verify user is member of organization
        verify_org_membership(supabase, str(current_user.uid), organization_id)
        
        # Get organization's Stripe customer ID
        org_response = (
            supabase.table("organizations")
            .select("stripe_customer_id")
            .eq("organization_id", organization_id)
            .single()
            .execute()
        )
        
        if not org_response.data or not org_response.data.get("stripe_customer_id"):
            return []
        
        stripe_customer_id = org_response.data["stripe_customer_id"]
        
        # Get payment methods from Stripe
        payment_methods = stripe.PaymentMethod.list(
            customer=stripe_customer_id,
            type="card"
        )
        
        # Get default payment method
        customer = stripe.Customer.retrieve(stripe_customer_id)
        default_payment_method = customer.invoice_settings.default_payment_method
        
        result = []
        for pm in payment_methods.data:
            result.append(PaymentMethodResponse(
                id=pm.id,
                type=pm.type,
                card=pm.card.to_dict() if pm.card else None,
                created=pm.created,
                is_default=(pm.id == default_payment_method)
            ))
        
        return result
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error listing payment methods: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to list payment methods")

@router.post("/methods/{payment_method_id}/set-default")
async def set_default_payment_method(
    payment_method_id: str,
    organization_id: str,
    current_user: User = Depends(get_current_user)
):
    """Set default payment method for organization"""
    supabase = get_supabase_client()
    
    try:
        # Verify user is admin/owner of organization
        membership = verify_org_membership(supabase, str(current_user.uid), organization_id)
        if membership["role"] not in ["owner", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Get organization's Stripe customer ID
        org_response = (
            supabase.table("organizations")
            .select("stripe_customer_id")
            .eq("organization_id", organization_id)
            .single()
            .execute()
        )
        
        if not org_response.data or not org_response.data.get("stripe_customer_id"):
            raise HTTPException(status_code=404, detail="No payment methods found")
        
        stripe_customer_id = org_response.data["stripe_customer_id"]
        
        # Set default payment method in Stripe
        stripe.Customer.modify(
            stripe_customer_id,
            invoice_settings={"default_payment_method": payment_method_id}
        )
        
        logger.info(f"Set default payment method {payment_method_id} for org {organization_id}")
        
        return {"success": True, "message": "Default payment method updated"}
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error setting default payment method: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to set default payment method")

@router.delete("/methods/{payment_method_id}")
async def delete_payment_method(
    payment_method_id: str,
    organization_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a payment method"""
    supabase = get_supabase_client()
    
    try:
        # Verify user is admin/owner of organization
        membership = verify_org_membership(supabase, str(current_user.uid), organization_id)
        if membership["role"] not in ["owner", "admin"]:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        
        # Detach payment method from customer
        stripe.PaymentMethod.detach(payment_method_id)
        
        logger.info(f"Deleted payment method {payment_method_id} for org {organization_id}")
        
        return {"success": True, "message": "Payment method deleted"}
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=400, detail=f"Payment error: {str(e)}")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting payment method: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to delete payment method")

@router.get("/intent/{payment_intent_id}")
async def get_payment_intent(payment_intent_id: str):
    """Get payment intent details for payment page"""
    try:
        supabase = get_supabase_client()
        
        # Get payment from database
        payment_response = (
            supabase.table("payments")
            .select("*, organizations(name)")
            .eq("stripe_payment_intent_id", payment_intent_id)
            .single()
            .execute()
        )
        
        if not payment_response.data:
            raise HTTPException(status_code=404, detail="Payment not found")
        
        payment = payment_response.data
        
        # Get Stripe payment intent
        stripe_payment_intent = stripe.PaymentIntent.retrieve(payment_intent_id)
        
        return {
            "id": payment_intent_id,
            "amount": payment["amount"],
            "currency": "usd",
            "organization_id": payment["organization_id"],
            "organization_name": payment["organizations"]["name"],
            "client_secret": stripe_payment_intent.client_secret,
            "status": stripe_payment_intent.status,
            "created_at": payment["created_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching payment intent: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment intent")

@router.get("/success/{payment_intent_id}")
async def get_payment_success(payment_intent_id: str):
    """Get payment success details"""
    try:
        supabase = get_supabase_client()
        
        # Get payment from database
        payment_response = (
            supabase.table("payments")
            .select("*, organizations(name)")
            .eq("stripe_payment_intent_id", payment_intent_id)
            .eq("status", "succeeded")
            .single()
            .execute()
        )
        
        if not payment_response.data:
            raise HTTPException(status_code=404, detail="Payment not found or not completed")
        
        payment = payment_response.data
        fee = payment["amount"] * 0.03
        net_amount = payment["amount"] - fee
        
        return {
            "id": payment_intent_id,
            "amount": payment["amount"],
            "organization_name": payment["organizations"]["name"],
            "net_amount": net_amount,
            "created_at": payment["created_at"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching payment success: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to fetch payment success")

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        logger.error("Invalid payload in Stripe webhook")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError:
        logger.error("Invalid signature in Stripe webhook")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    supabase = get_supabase_client()
    
    try:
        # Handle different event types
        if event["type"] == "checkout.session.completed":
            session = event["data"]["object"]
            
            # Handle subscription checkout vs one-time payment checkout
            if session.get("mode") == "subscription":
                # For subscriptions, handle via subscription object
                if session.get("subscription"):
                    subscription = stripe.Subscription.retrieve(session["subscription"])
                    await handle_subscription_created(supabase, subscription)
                else:
                    logger.warning(f"Subscription checkout session {session['id']} has no subscription ID")
            elif session.get("payment_intent"):
                # For one-time payments, retrieve the payment intent
                payment_intent = stripe.PaymentIntent.retrieve(session.payment_intent)
                # Pass the session metadata to the handler
                await handle_successful_payment(supabase, payment_intent, session.metadata)
            else:
                logger.warning(f"Checkout session {session['id']} has no payment_intent or subscription")
            
        elif event["type"] == "payment_intent.payment_failed":
            payment_intent = event["data"]["object"]
            await handle_failed_payment(supabase, payment_intent)
            
        elif event["type"] == "customer.subscription.created":
            subscription = event["data"]["object"]
            await handle_subscription_created(supabase, subscription)
            
        elif event["type"] == "customer.subscription.updated":
            subscription = event["data"]["object"]
            await handle_subscription_updated(supabase, subscription)
            
        elif event["type"] == "invoice.payment_succeeded":
            invoice = event["data"]["object"]
            await handle_invoice_paid(supabase, invoice)
        
        logger.info(f"Processed Stripe webhook: {event['type']}")
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Error processing Stripe webhook: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Webhook processing failed")

async def handle_successful_payment(supabase, payment_intent, metadata=None):
    """Handle successful payment - add funds to wallet (no fees on wallet top-up)"""
    try:
        # Use metadata from the checkout session if provided, otherwise from the payment intent
        payment_metadata = metadata if metadata is not None else payment_intent["metadata"]
        
        organization_id = payment_metadata.get("organization_id")
        user_id = payment_metadata.get("user_id")
        
        # For wallet top-ups, the full amount goes to the wallet (no fees)
        wallet_credit = payment_intent["amount"] / 100  # Convert from cents to dollars
        wallet_credit_cents = payment_intent["amount"]  # Amount in cents

        if not organization_id or not user_id or wallet_credit <= 0:
            logger.error(f"Missing or invalid metadata for payment {payment_intent['id']}. Org: {organization_id}, User: {user_id}, Credit: {wallet_credit}")
            return

        # Get wallet for organization
        wallet_response = (
            supabase.table("wallets")
            .select("wallet_id, balance_cents")
            .eq("organization_id", organization_id)
            .single()
            .execute()
        )
        
        if not wallet_response.data:
            logger.error(f"Wallet not found for organization {organization_id} for payment {payment_intent['id']}")
            return
        
        wallet_id = wallet_response.data["wallet_id"]
        current_balance_cents = wallet_response.data.get("balance_cents", 0)
        new_balance_cents = current_balance_cents + wallet_credit_cents
        
        # Update wallet balance
        supabase.table("wallets").update({
            "balance_cents": new_balance_cents,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("wallet_id", wallet_id).execute()
        
        # Create transaction record (no fees for wallet top-up)
        transaction_data = {
            "organization_id": organization_id,
            "wallet_id": wallet_id,
            "type": "topup",
            "amount_cents": wallet_credit_cents,
            "status": "completed",
            "description": f"Wallet top-up via Stripe payment {payment_intent['id']}",
            "metadata": {
                "stripe_payment_intent_id": payment_intent["id"],
                "user_id": user_id
            },
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        supabase.table("transactions").insert(transaction_data).execute()
        
        logger.info(f"Successfully processed wallet top-up {payment_intent['id']} for org {organization_id}: +${wallet_credit} (no fees)")
        
    except Exception as e:
        logger.error(f"Error handling successful payment: {e}", exc_info=True)

async def handle_failed_payment(supabase, payment_intent):
    """Handle failed payment"""
    try:
        # Update payment record
        supabase.table("payments").update({
            "status": "failed",
            "failed_at": datetime.now(timezone.utc).isoformat(),
            "failure_reason": payment_intent.get("last_payment_error", {}).get("message", "Unknown error")
        }).eq("stripe_payment_intent_id", payment_intent["id"]).execute()
        
        logger.info(f"Payment failed: {payment_intent['id']}")
        
    except Exception as e:
        logger.error(f"Error handling failed payment: {e}", exc_info=True)

async def handle_subscription_created(supabase, subscription):
    """Handle new subscription creation"""
    try:
        organization_id = subscription.metadata.get('organization_id')
        plan_id = subscription.metadata.get('plan_id')
        
        if not organization_id or not plan_id:
            logger.error(f"Missing metadata in subscription {subscription.id}: org_id={organization_id}, plan_id={plan_id}")
            return
        
        # Create or update subscription record
        subscription_data = {
            "organization_id": organization_id,
            "stripe_subscription_id": subscription.id,
            "stripe_customer_id": subscription.customer,
            "plan_id": plan_id,
            "status": subscription.status,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Add period dates if they exist
        if hasattr(subscription, 'current_period_start') and subscription.current_period_start:
            subscription_data["current_period_start"] = datetime.fromtimestamp(subscription.current_period_start, timezone.utc).isoformat()
        
        if hasattr(subscription, 'current_period_end') and subscription.current_period_end:
            subscription_data["current_period_end"] = datetime.fromtimestamp(subscription.current_period_end, timezone.utc).isoformat()
        
        # Insert or update subscription
        existing_sub = (
            supabase.table("subscriptions")
            .select("id")
            .eq("stripe_subscription_id", subscription.id)
            .maybe_single()
            .execute()
        )
        
        if existing_sub and existing_sub.data:
            # Update existing subscription
            supabase.table("subscriptions").update(subscription_data).eq("stripe_subscription_id", subscription.id).execute()
        else:
            # Create new subscription
            supabase.table("subscriptions").insert(subscription_data).execute()
        
        # Update organization subscription status
        supabase.table("organizations").update({
            "subscription_status": subscription.status,
            "plan_id": plan_id,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }).eq("organization_id", organization_id).execute()
        
        logger.info(f"Successfully processed subscription creation {subscription.id} for org {organization_id}")
        
    except Exception as e:
        logger.error(f"Error handling subscription creation: {e}", exc_info=True)

async def handle_subscription_updated(supabase, subscription):
    """Handle subscription updates"""
    try:
        organization_id = subscription.metadata.get('organization_id')
        plan_id = subscription.metadata.get('plan_id')
        
        if not organization_id:
            logger.error("No organization_id in subscription metadata")
            return
        
        # Check if organization exists
        org_check = supabase.table("organizations").select("organization_id, plan_id").eq("organization_id", organization_id).maybe_single().execute()
        if not org_check.data:
            logger.error(f"Organization {organization_id} not found in database")
            return
        
        # Update subscription in database
        subscription_data = {
            "status": subscription.status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Add period dates if they exist
        if hasattr(subscription, 'current_period_start') and subscription.current_period_start:
            subscription_data["current_period_start"] = datetime.fromtimestamp(subscription.current_period_start, timezone.utc).isoformat()
        
        if hasattr(subscription, 'current_period_end') and subscription.current_period_end:
            subscription_data["current_period_end"] = datetime.fromtimestamp(subscription.current_period_end, timezone.utc).isoformat()
        
        if subscription.cancel_at_period_end:
            subscription_data["cancel_at_period_end"] = True
        
        if hasattr(subscription, 'canceled_at') and subscription.canceled_at:
            subscription_data["canceled_at"] = datetime.fromtimestamp(subscription.canceled_at, timezone.utc).isoformat()
        
        # Update subscriptions table
        supabase.table("subscriptions").update(subscription_data).eq("stripe_subscription_id", subscription.id).execute()
        
        # Update organization subscription status AND plan_id
        org_update_data = {
            "subscription_status": subscription.status,
            "stripe_subscription_id": subscription.id,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        # Update plan_id if it exists in metadata
        if plan_id:
            org_update_data["plan_id"] = plan_id
        
        org_update_result = supabase.table("organizations").update(org_update_data).eq("organization_id", organization_id).execute()
        
        if not org_update_result.data:
            logger.error(f"Failed to update organization {organization_id} - no rows affected")
        
        logger.info(f"Successfully processed subscription update {subscription.id} for org {organization_id}")
        
    except Exception as e:
        logger.error(f"Error handling subscription update: {e}", exc_info=True)

async def handle_invoice_paid(supabase, invoice):
    """Handle successful invoice payment"""
    # TODO: Implement invoice handling for subscriptions
    pass 