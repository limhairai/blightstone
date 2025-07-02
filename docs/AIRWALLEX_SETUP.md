# Airwallex Integration Setup

This guide explains how to set up Airwallex integration for global bank transfer payments using their **Hosted Payment Page (HPP)**.

## Overview

The Airwallex integration uses their Hosted Payment Page, similar to Stripe Checkout:
- Users are redirected to Airwallex's secure payment page
- They complete payment using various methods (bank transfer, cards, etc.)
- They're redirected back to your app with payment status
- Webhooks handle payment completion and wallet updates

## Benefits

- **Hosted Solution**: No custom payment UI needed - Airwallex handles everything
- **Global Coverage**: 180+ countries and 50+ currencies
- **Lower Fees**: 0.6-2.5% vs Stripe's 2.9% + $0.30
- **Bank Transfers**: Specialized in international bank transfers
- **Trust**: Customers see Airwallex branding (established payment processor)

## Setup Steps

### 1. Airwallex Account Setup

1. Create an Airwallex account at [airwallex.com](https://airwallex.com)
2. Complete business verification
3. Enable payment processing features
4. Get your API credentials from the dashboard

### 2. Environment Variables

Add these to your `.env.local`:

```bash
# Airwallex Configuration
AIRWALLEX_API_KEY=your_api_key_here
AIRWALLEX_CLIENT_ID=your_client_id_here
AIRWALLEX_WEBHOOK_SECRET=your_webhook_secret_here

# Your app URLs for redirects
NEXT_PUBLIC_APP_URL=http://localhost:3000  # or your production URL
```

### 3. Webhook Configuration

In your Airwallex dashboard:

1. Go to **Webhooks** section
2. Add webhook endpoint: `https://yourdomain.com/api/webhooks/airwallex`
3. Enable these events:
   - `payment_intent.succeeded`
   - `payment_intent.failed`
   - `payment_intent.cancelled`
4. Copy the webhook secret to your environment variables

## Integration Flow

### 1. Payment Initiation

When user selects "Bank Transfer" payment method:

```typescript
// Creates payment intent with redirect URLs
const response = await fetch('/api/payments/airwallex', {
  method: 'POST',
  body: JSON.stringify({ 
    amount: 100, 
    description: 'Wallet top-up - $100' 
  })
})

const { hosted_payment_url } = await response.json()

// Redirect to Airwallex hosted page
window.location.href = hosted_payment_url
```

### 2. Hosted Payment Page

- User is redirected to Airwallex's secure payment page
- They can choose from available payment methods:
  - Bank transfers (ACH, SEPA, local bank transfers)
  - Credit/debit cards (as backup)
  - Digital wallets (region-specific)
- Airwallex handles all payment processing and security

### 3. Payment Completion

After payment:
- **Success**: User redirected to `/wallet/payment/success`
- **Cancel**: User redirected to `/wallet/payment/cancel`
- **Webhook**: Airwallex sends webhook to update wallet balance

### 4. Webhook Processing

The webhook handler:
1. Verifies webhook signature
2. Processes payment completion
3. Updates user's wallet balance using `WalletService`
4. Records transaction in database

## API Endpoints

### Payment Creation
- **Endpoint**: `POST /api/payments/airwallex`
- **Purpose**: Creates payment intent with hosted payment URL
- **Returns**: `{ hosted_payment_url, payment_intent_id }`

### Payment Verification
- **Endpoint**: `POST /api/payments/airwallex/verify`
- **Purpose**: Verifies payment completion on success page
- **Returns**: Payment status and details

### Webhook Handler
- **Endpoint**: `POST /api/webhooks/airwallex`
- **Purpose**: Processes payment events from Airwallex
- **Security**: Validates webhook signature

## User Experience

### Payment Flow
1. User enters amount on wallet funding page
2. Selects "Bank Transfer" payment method
3. Clicks "Add Funds" button
4. Redirected to Airwallex hosted payment page
5. Completes payment using their preferred method
6. Redirected back to success/cancel page
7. Wallet balance updated automatically

### Payment Methods Available
- **Bank Transfers**: ACH (US), SEPA (EU), local transfers (Asia-Pacific)
- **Credit Cards**: Visa, Mastercard, American Express
- **Digital Wallets**: Alipay, WeChat Pay (region-specific)

## Testing

### Test Credentials
Use Airwallex sandbox environment for testing:
- Different API keys for sandbox vs production
- Test payment methods and scenarios
- Webhook testing tools

### Test Scenarios
- Successful bank transfer payment
- Cancelled payment flow
- Failed payment handling
- Webhook delivery and processing

## Production Checklist

- [ ] Airwallex account fully verified
- [ ] Production API keys configured
- [ ] Webhook endpoint accessible and tested
- [ ] SSL certificate installed
- [ ] Payment flow tested end-to-end
- [ ] Error handling implemented
- [ ] Logging and monitoring set up

## Security Considerations

- API keys stored securely in environment variables
- Webhook signature validation implemented
- HTTPS required for all endpoints
- Payment data not stored locally (handled by Airwallex)
- Redirect URLs validated to prevent attacks

## Support

- **Airwallex Documentation**: [developers.airwallex.com](https://developers.airwallex.com)
- **API Reference**: Hosted Payment Page documentation
- **Support**: Contact Airwallex support for integration issues

## Next Steps

1. **Get API credentials** from your Airwallex account
2. **Configure environment variables**
3. **Set up webhook endpoint**
4. **Test payment flow**
5. **Go live with global payments!**

Your existing Airwallex account gives you a huge head start - you can be accepting global payments within hours instead of weeks! 🚀 