# Binance Pay Integration Setup Guide

## Overview

This guide covers the complete setup of Binance Pay as a cryptocurrency payment method for AdHub wallet top-ups. Users can pay with any crypto supported by Binance Pay (BTC, ETH, USDT, BNB, etc.) and funds are automatically converted to USD and added to their wallet.

## Prerequisites

1. **Binance Pay Merchant Account**: You need to be approved as a Binance Pay merchant
2. **API Credentials**: API Key and Secret Key from Binance Pay merchant dashboard
3. **Webhook URL**: Public endpoint for receiving payment notifications

## Step 1: Binance Pay Merchant Setup

### 1.1 Apply for Binance Pay Merchant Account
1. Go to [Binance Pay Merchant Portal](https://merchant.binance.com)
2. Submit merchant application with business details
3. Wait for approval (typically 1-3 business days)
4. Complete KYB (Know Your Business) verification

### 1.2 Get API Credentials
1. Login to Binance Pay merchant dashboard
2. Navigate to "API Management"
3. Create new API key pair
4. Download and securely store:
   - API Key (Certificate SN)
   - Secret Key (for signing requests)

## Step 2: Environment Variables

Add these environment variables to your `.env` file:

```bash
# Binance Pay API Configuration
BINANCE_PAY_API_URL=https://bpay.binanceapi.com
BINANCE_PAY_API_KEY=your_api_key_here
BINANCE_PAY_SECRET_KEY=your_secret_key_here
BINANCE_PAY_WEBHOOK_SECRET=your_webhook_secret_here

# Base URL for return/cancel URLs
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
```

## Step 3: Database Setup

Run the migration to create the Binance Pay orders table:

```bash
# Apply the migration
supabase migration up

# Or manually run the SQL
psql -f supabase/migrations/20250120000028_add_binance_pay_orders_table.sql
```

## Step 4: Webhook Configuration

### 4.1 Configure Webhook URL in Binance Pay Dashboard
1. Login to Binance Pay merchant dashboard
2. Navigate to "Webhook Settings"
3. Set webhook URL to: `https://yourdomain.com/api/webhooks/crypto`
4. Enable events: `PAY_SUCCESS`, `PAY_FAIL`, `PAY_CANCEL`

### 4.2 Generate Webhook Secret
Create a strong webhook secret for signature verification:

```bash
# Generate a random webhook secret
openssl rand -hex 32
```

Add this to your environment variables as `BINANCE_PAY_WEBHOOK_SECRET`.

## Step 5: Testing

### 5.1 Test Environment
Binance Pay provides a sandbox environment for testing:

```bash
# Use sandbox URL for testing
BINANCE_PAY_API_URL=https://bpay-sandbox.binanceapi.com
```

### 5.2 Test Flow
1. Go to AdHub wallet page
2. Select "Add Funds"
3. Choose "Binance Pay (Crypto)" payment method
4. Enter amount ($10-$10,000)
5. Click "Pay with Binance Pay"
6. Complete payment in Binance app
7. Verify wallet balance is updated

## Step 6: Production Deployment

### 6.1 Switch to Production
```bash
# Production API URL
BINANCE_PAY_API_URL=https://bpay.binanceapi.com
```

### 6.2 SSL Certificate
Ensure your webhook endpoint has a valid SSL certificate. Binance Pay requires HTTPS.

### 6.3 Webhook Verification
Test webhook delivery using tools like ngrok for local testing:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use ngrok URL for webhook testing
# https://abc123.ngrok.io/api/webhooks/crypto
```

## API Endpoints

### Create Order
```
POST /api/payments/binance-pay/create-order
```

**Request:**
```json
{
  "amount": 100,
  "organizationId": "uuid",
  "currency": "USD"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "orderId": "adhub_123456789_abc123",
    "paymentUrl": "https://pay.binance.com/checkout/...",
    "qrCode": "data:image/png;base64,...",
    "status": "pending",
    "expiresAt": "2024-01-01T12:00:00Z",
    "amount": 100,
    "currency": "USD"
  }
}
```

### Check Status
```
GET /api/payments/binance-pay/status/{orderId}
```

**Response:**
```json
{
  "orderId": "adhub_123456789_abc123",
  "status": "completed",
  "amount": 100,
  "currency": "USD"
}
```

## Supported Cryptocurrencies

Binance Pay supports 100+ cryptocurrencies including:
- Bitcoin (BTC)
- Ethereum (ETH)
- Binance Coin (BNB)
- Tether (USDT)
- USD Coin (USDC)
- Cardano (ADA)
- Solana (SOL)
- And many more...

## Payment Limits

- **Minimum**: $10 USD
- **Maximum**: $10,000 USD per transaction
- **Daily Limit**: Set by Binance Pay merchant settings
- **Monthly Limit**: Set by Binance Pay merchant settings

## Security Features

### 1. Signature Verification
All API requests and webhooks are signed using HMAC-SHA512:

```javascript
const signature = crypto
  .createHmac('sha512', secretKey)
  .update(timestamp + '\n' + nonce + '\n' + body + '\n')
  .digest('hex')
  .toUpperCase()
```

### 2. Request Validation
- Timestamp validation (requests expire after 5 minutes)
- Nonce validation (prevents replay attacks)
- Amount validation (min/max limits)
- Organization verification

### 3. Database Security
- Row Level Security (RLS) enabled
- Users can only access their organization's orders
- Encrypted sensitive data storage

## Error Handling

### Common Errors
1. **Invalid Signature**: Check API credentials and signature generation
2. **Order Not Found**: Verify order ID exists in database
3. **Amount Limits**: Check min/max payment limits
4. **Expired Order**: Orders expire after 15 minutes
5. **Insufficient Balance**: User doesn't have enough crypto

### Error Responses
```json
{
  "error": "Amount must be between $10 and $10,000",
  "code": "INVALID_AMOUNT"
}
```

## Monitoring and Logging

### 1. Payment Tracking
Monitor payment status in the database:

```sql
SELECT 
  order_id,
  organization_id,
  amount_usd,
  status,
  created_at,
  updated_at
FROM binance_pay_orders
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### 2. Webhook Logs
All webhook events are logged for debugging:

```javascript
console.log('Binance Pay webhook received:', {
  orderId: merchantTradeNo,
  status: bizStatus,
  amount: totalFee,
  timestamp: new Date().toISOString()
})
```

## Troubleshooting

### Issue: Webhook Not Receiving Events
1. Check webhook URL is publicly accessible
2. Verify SSL certificate is valid
3. Check firewall settings
4. Test with ngrok for local development

### Issue: Signature Verification Failed
1. Verify API credentials are correct
2. Check timestamp is within 5-minute window
3. Ensure nonce is unique
4. Verify signature generation algorithm

### Issue: Orders Not Updating
1. Check webhook endpoint is working
2. Verify database permissions
3. Check for rate limiting
4. Monitor webhook response times

## Support

For Binance Pay specific issues:
- [Binance Pay Documentation](https://developers.binance.com/docs/binance-pay)
- [Binance Pay Support](https://www.binance.com/en/support)
- [Merchant Portal](https://merchant.binance.com)

For AdHub integration issues:
- Check application logs
- Verify database migrations
- Test API endpoints
- Monitor webhook delivery

## Best Practices

1. **Always verify signatures** on webhook requests
2. **Implement idempotency** to handle duplicate webhooks
3. **Set reasonable timeouts** for API requests
4. **Monitor payment status** and handle failures gracefully
5. **Log all transactions** for audit purposes
6. **Use HTTPS everywhere** for security
7. **Implement rate limiting** to prevent abuse
8. **Test thoroughly** before production deployment

## Conclusion

Binance Pay integration provides a seamless crypto payment experience for AdHub users. The integration handles:

- ✅ Order creation and management
- ✅ Real-time payment status updates
- ✅ Automatic wallet crediting
- ✅ Secure webhook handling
- ✅ Comprehensive error handling
- ✅ Transaction logging and monitoring

Users can now top up their AdHub wallets using any cryptocurrency supported by Binance Pay, with automatic USD conversion and instant wallet crediting upon payment confirmation. 