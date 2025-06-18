from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class PaymentStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"

class PaymentType(str, Enum):
    WALLET_TOPUP = "wallet_topup"
    SUBSCRIPTION = "subscription"
    ONE_TIME = "one_time"

class PaymentMethodType(str, Enum):
    CARD = "card"
    BANK_ACCOUNT = "bank_account"
    CRYPTO = "crypto"

# Request schemas
class PaymentIntentCreateRequest(BaseModel):
    organization_id: str = Field(..., description="Organization ID")
    amount: float = Field(..., ge=10, le=100000, description="Amount in USD ($10-$100k)")
    payment_method_id: Optional[str] = Field(None, description="Existing payment method ID")
    save_payment_method: bool = Field(False, description="Save payment method for future use")
    idempotency_key: Optional[str] = Field(None, description="Idempotency key for duplicate prevention")

class PaymentMethodCreateRequest(BaseModel):
    organization_id: str = Field(..., description="Organization ID")
    payment_method_id: str = Field(..., description="Stripe payment method ID")
    set_as_default: bool = Field(False, description="Set as default payment method")

class SetDefaultPaymentMethodRequest(BaseModel):
    organization_id: str = Field(..., description="Organization ID")

# Response schemas
class PaymentIntentResponse(BaseModel):
    id: str = Field(..., description="Payment intent ID")
    client_secret: str = Field(..., description="Client secret for frontend")
    amount: int = Field(..., description="Amount in cents")
    currency: str = Field(..., description="Currency code")
    status: PaymentStatus = Field(..., description="Payment status")

class CardDetails(BaseModel):
    brand: str = Field(..., description="Card brand (visa, mastercard, etc.)")
    last4: str = Field(..., description="Last 4 digits")
    exp_month: int = Field(..., description="Expiration month")
    exp_year: int = Field(..., description="Expiration year")
    funding: Optional[str] = Field(None, description="Funding type (credit, debit)")

class PaymentMethodResponse(BaseModel):
    id: str = Field(..., description="Payment method ID")
    type: PaymentMethodType = Field(..., description="Payment method type")
    card: Optional[CardDetails] = Field(None, description="Card details if type is card")
    created: int = Field(..., description="Creation timestamp")
    is_default: bool = Field(False, description="Whether this is the default payment method")

class PaymentResponse(BaseModel):
    id: str = Field(..., description="Payment ID")
    organization_id: str = Field(..., description="Organization ID")
    user_id: str = Field(..., description="User ID who initiated payment")
    amount: float = Field(..., description="Payment amount in USD")
    currency: str = Field(..., description="Currency code")
    status: PaymentStatus = Field(..., description="Payment status")
    type: PaymentType = Field(..., description="Payment type")
    stripe_payment_intent_id: Optional[str] = Field(None, description="Stripe payment intent ID")
    created_at: datetime = Field(..., description="Creation timestamp")
    completed_at: Optional[datetime] = Field(None, description="Completion timestamp")
    failed_at: Optional[datetime] = Field(None, description="Failure timestamp")
    failure_reason: Optional[str] = Field(None, description="Failure reason")

class TransactionResponse(BaseModel):
    id: str = Field(..., description="Transaction ID")
    organization_id: str = Field(..., description="Organization ID")
    user_id: str = Field(..., description="User ID")
    type: str = Field(..., description="Transaction type")
    amount: float = Field(..., description="Net amount")
    gross_amount: Optional[float] = Field(None, description="Gross amount before fees")
    fee: Optional[float] = Field(None, description="Processing fee")
    from_account: str = Field(..., description="Source account")
    to_account: str = Field(..., description="Destination account")
    status: str = Field(..., description="Transaction status")
    stripe_payment_intent_id: Optional[str] = Field(None, description="Related Stripe payment")
    created_at: datetime = Field(..., description="Creation timestamp")

# Webhook schemas
class StripeWebhookEvent(BaseModel):
    id: str = Field(..., description="Event ID")
    type: str = Field(..., description="Event type")
    data: Dict[str, Any] = Field(..., description="Event data")
    created: int = Field(..., description="Creation timestamp")

# Validation
class PaymentIntentCreateRequest(PaymentIntentCreateRequest):
    @validator('amount')
    def validate_amount(cls, v):
        if v < 10:
            raise ValueError('Minimum payment amount is $10')
        if v > 100000:
            raise ValueError('Maximum payment amount is $100,000')
        return round(v, 2)  # Ensure 2 decimal places

# Crypto payment schemas (for future Binance Pay integration)
class CryptoPaymentRequest(BaseModel):
    organization_id: str = Field(..., description="Organization ID")
    amount: float = Field(..., ge=10, le=100000, description="Amount in USD")
    currency: str = Field("USDT", description="Crypto currency (USDT, BTC, ETH)")
    idempotency_key: Optional[str] = Field(None, description="Idempotency key")

class CryptoPaymentResponse(BaseModel):
    id: str = Field(..., description="Payment order ID")
    amount: float = Field(..., description="Amount in USD")
    crypto_amount: float = Field(..., description="Amount in crypto")
    currency: str = Field(..., description="Crypto currency")
    exchange_rate: float = Field(..., description="USD to crypto exchange rate")
    payment_url: str = Field(..., description="Payment URL for user")
    qr_code: str = Field(..., description="QR code for payment")
    expires_at: datetime = Field(..., description="Payment expiration time")
    status: PaymentStatus = Field(..., description="Payment status")

# Summary schemas
class PaymentSummaryResponse(BaseModel):
    total_payments: int = Field(..., description="Total number of payments")
    total_amount: float = Field(..., description="Total amount processed")
    successful_payments: int = Field(..., description="Number of successful payments")
    failed_payments: int = Field(..., description="Number of failed payments")
    total_fees: float = Field(..., description="Total fees collected")
    average_payment: float = Field(..., description="Average payment amount")

class OrganizationPaymentStats(BaseModel):
    organization_id: str = Field(..., description="Organization ID")
    current_balance: float = Field(..., description="Current wallet balance")
    total_deposited: float = Field(..., description="Total amount deposited")
    total_spent: float = Field(..., description="Total amount spent")
    payment_methods_count: int = Field(..., description="Number of saved payment methods")
    last_payment_at: Optional[datetime] = Field(None, description="Last payment timestamp") 