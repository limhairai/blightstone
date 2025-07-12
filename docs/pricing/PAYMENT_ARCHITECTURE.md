# Payment Architecture

## Overview

AdHub supports multiple payment methods for wallet topups while using Stripe exclusively for subscription billing. This document outlines the unified payment architecture.

## Payment Methods

### 1. Subscriptions (Stripe Only)
- **Use Case**: Monthly recurring billing for plans (Starter, Growth, Scale, Enterprise)
- **Webhook**: `/api/webhooks/stripe`
- **Flow**: Stripe Checkout → Subscription created → Organization plan updated

### 2. Wallet Topups (Multiple Methods)

#### Credit Card (Stripe)
- **Use Case**: Instant wallet funding via credit card (US-focused)
- **Webhook**: `/api/webhooks/stripe`
- **Flow**: Stripe Checkout → Payment completed → Wallet balance updated

#### Airwallex (Global Payments) ⭐ **RECOMMENDED**
- **Use Case**: Global payment acceptance for international clients
- **Coverage**: 150+ countries, 23+ currencies
- **Methods**: Cards, bank transfers, digital wallets (Apple Pay, Google Pay)
- **Fees**: 0.6-2.5% (bank transfers), 2.9% + $0.30 (cards)
- **Settlement**: T+0 to 3 business days
- **API**: `/api/payments/airwallex`
- **Webhook**: `/api/webhooks/airwallex`
- **Flow**: Airwallex Checkout → Payment completed → Wallet balance updated

#### Bank Transfer (Manual)
- **Use Case**: Manual processing for specific bank requirements
- **Webhook**: `/api/webhooks/bank`
- **Flow**: Bank API → Transfer completed → Wallet balance updated

#### Cryptocurrency
- **Use Case**: Crypto wallet funding via exchanges like Binance
- **Webhook**: `/api/webhooks/crypto`
- **Flow**: Crypto Exchange API → Deposit confirmed → Wallet balance updated

## Architecture

### Unified Wallet Service
All payment methods use the same `WalletService` class for consistent wallet updates:

```typescript
WalletService.processTopup({
  organizationId: 'org-123',
  amount: 100.00,
  paymentMethod: 'stripe' | 'bank_transfer' | 'crypto',
  transactionId: 'external-tx-id',
  metadata: { /* payment-specific data */ }
})
```

### Webhook Endpoints

1. **`/api/webhooks/stripe`** - Handles both subscriptions and credit card topups
2. **`/api/webhooks/bank`** - Handles bank transfer confirmations
3. **`/api/webhooks/crypto`** - Handles crypto deposit confirmations

### Database Schema

#### Transactions Table
All wallet topups create records in the `transactions` table:

```sql
INSERT INTO transactions (
  organization_id,
  wallet_id,
  type,              -- 'deposit'
  amount_cents,
  status,            -- 'completed'
  description,       -- 'Stripe Wallet Top-up - $100.00'
  metadata           -- Payment method specific data
)
```

#### Metadata Examples

**Stripe:**
```json
{
  "payment_method": "stripe",
  "stripe_session_id": "cs_xxx",
  "stripe_payment_intent_id": "pi_xxx"
}
```

**Bank Transfer:**
```json
{
  "payment_method": "bank_transfer",
  "bank_transfer_id": "transfer_xxx",
  "bank_reference": "REF123",
  "currency": "USD"
}
```

**Crypto:**
```json
{
  "payment_method": "crypto",
  "crypto_currency": "BTC",
  "crypto_amount": "0.002",
  "usd_value": "100.00",
  "transaction_hash": "0xabc123",
  "confirmations": 6
}
```

## Implementation Status

### ✅ Completed
- Unified `WalletService` class
- Stripe webhook consolidation (subscriptions + wallet topups)
- Database schema for multiple payment methods
- Frontend payment method selection

### 🚧 To Implement
- Bank transfer API integration
- Crypto exchange API integration (Binance, etc.)
- Payment method specific UI flows
- Webhook signature verification for bank/crypto APIs

## Environment Variables

```bash
# Stripe (Required)
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Bank Transfer (Optional)
BANK_WEBHOOK_SECRET=bank_secret_xxx

# Crypto Exchange (Optional)
CRYPTO_WEBHOOK_SECRET=crypto_secret_xxx
```

## Testing

### Stripe Webhook Testing
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### Bank/Crypto Webhook Testing
Use ngrok or similar tools to expose local webhooks to external APIs:
```bash
ngrok http 3000
# Then configure bank/crypto APIs to send webhooks to:
# https://xxx.ngrok.io/api/webhooks/bank
# https://xxx.ngrok.io/api/webhooks/crypto
```

## Security Considerations

1. **Webhook Signature Verification**: All webhooks must verify signatures
2. **Idempotency**: Handle duplicate webhook events gracefully
3. **Amount Validation**: Validate amounts match expected values
4. **Organization Validation**: Ensure organization exists and user has access
5. **Currency Conversion**: For crypto, ensure USD conversion is accurate

## Error Handling

All payment methods use consistent error handling:
- Failed payments don't update wallet balance
- Errors are logged with payment method context
- Users receive appropriate notifications
- Failed transactions can be retried if needed 