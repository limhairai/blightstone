# Bank Transfer Webhook Testing Guide

## 🎯 Overview

This guide explains how to test the bank transfer webhook functionality without waiting for real bank transfers from Airwallex.

## 📋 Prerequisites

1. **Development server running**: `npm run dev`
2. **Database access**: Valid Supabase credentials
3. **Pending bank transfer request**: At least one request in the database

## 🚀 Testing Methods

### Method 1: Automated Test Script (Recommended)

#### Step 1: Get a real reference number
```bash
node scripts/get-test-reference.js
```

This will show you pending bank transfer requests and their reference numbers.

#### Step 2: Update the test script
Edit `scripts/test-bank-transfer-webhook.js` and replace the reference number:
```javascript
reference: 'ADHUB-XXXXXXXX-XXXXXXXX-XXXX', // Use the real reference from step 1
```

#### Step 3: Run the test
```bash
# Test successful transfer
node scripts/test-bank-transfer-webhook.js successful_transfer

# Test failed transfer
node scripts/test-bank-transfer-webhook.js failed_transfer

# Test unmatched transfer (creates unmatched record)
node scripts/test-bank-transfer-webhook.js unmatched_transfer
```

### Method 2: Manual curl Testing

```bash
# Set your webhook URL and secret
WEBHOOK_URL="http://localhost:3000/api/webhooks/airwallex"
WEBHOOK_SECRET="your-webhook-secret"

# Create the payload
PAYLOAD='{
  "name": "transfer.completed",
  "data": {
    "object": {
      "id": "txn_test_123",
      "amount": 100.00,
      "currency": "USD",
      "reference": "ADHUB-XXXXXXXX-XXXXXXXX-XXXX",
      "description": "Test bank transfer",
      "status": "completed"
    }
  }
}'

# Generate signature
SIGNATURE=$(echo -n "$PAYLOAD" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" | cut -d' ' -f2)

# Send webhook
curl -X POST "$WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -H "x-airwallex-signature: sha256=$SIGNATURE" \
  -d "$PAYLOAD"
```

### Method 3: Using Postman/Insomnia

1. **URL**: `POST http://localhost:3000/api/webhooks/airwallex`
2. **Headers**:
   ```
   Content-Type: application/json
   x-airwallex-signature: sha256=YOUR_GENERATED_SIGNATURE
   ```
3. **Body** (JSON):
   ```json
   {
     "name": "transfer.completed",
     "data": {
       "object": {
         "id": "txn_test_123",
         "amount": 100.00,
         "currency": "USD",
         "reference": "ADHUB-XXXXXXXX-XXXXXXXX-XXXX",
         "description": "Test bank transfer",
         "status": "completed"
       }
     }
   }
   ```

## 🔍 What to Test

### ✅ Successful Transfer Flow
- Reference number matches existing request
- Amount is processed correctly
- Wallet balance is updated
- Request status changes to 'completed'
- Transaction record is created

### ❌ Failed Transfer Flow
- Request status changes to 'failed'
- No wallet balance change
- Proper error logging

### 🔄 Unmatched Transfer Flow
- Transfer with invalid reference
- Creates unmatched_transfers record
- Available for manual processing

### 🔒 Security Testing
- Invalid signature rejection
- Missing signature handling
- Malformed payload handling

## 📊 Verification Steps

After running a test, verify:

1. **Check application logs**:
   ```bash
   # Look for webhook processing logs
   tail -f your-app.log | grep "Airwallex webhook"
   ```

2. **Check database changes**:
   ```sql
   -- Check request status
   SELECT * FROM bank_transfer_requests WHERE reference_number = 'YOUR_REFERENCE';
   
   -- Check wallet balance
   SELECT * FROM wallets WHERE organization_id = 'YOUR_ORG_ID';
   
   -- Check transactions
   SELECT * FROM transactions WHERE description LIKE '%Bank Transfer%' ORDER BY created_at DESC;
   
   -- Check unmatched transfers
   SELECT * FROM unmatched_transfers ORDER BY created_at DESC;
   ```

3. **Check frontend updates**:
   - Wallet balance should update
   - Transaction should appear in history
   - Request status should change

## 🐛 Troubleshooting

### Common Issues

1. **"Invalid signature" error**:
   - Check AIRWALLEX_WEBHOOK_SECRET environment variable
   - Verify signature generation algorithm
   - In development, webhook allows unsigned requests

2. **"Bank transfer request not found"**:
   - Verify reference number format: `ADHUB-XXXXXXXX-XXXXXXXX-XXXX`
   - Check request exists and has 'pending' status
   - Ensure reference number matches exactly

3. **"Failed to process wallet topup"**:
   - Check WalletService implementation
   - Verify organization exists
   - Check database constraints

4. **Webhook not receiving requests**:
   - Verify server is running on correct port
   - Check firewall settings
   - Ensure webhook URL is correct

### Debug Mode

Enable detailed logging by setting:
```bash
DEBUG=webhook:* npm run dev
```

## 🌐 Production Testing

For production testing with ngrok:

```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 3000

# Use the ngrok URL for webhook testing
WEBHOOK_URL="https://your-ngrok-url.ngrok.io/api/webhooks/airwallex"
```

## 📝 Test Scenarios Checklist

- [ ] Successful transfer with exact amount match
- [ ] Successful transfer with amount tolerance (±5%)
- [ ] Failed transfer
- [ ] Unmatched transfer (invalid reference)
- [ ] Duplicate transfer (same reference)
- [ ] Invalid signature
- [ ] Missing signature
- [ ] Malformed JSON payload
- [ ] Missing required fields
- [ ] Different currency handling

## 💡 Tips

1. **Start simple**: Test with one successful transfer first
2. **Use real data**: Always test with actual database records
3. **Monitor logs**: Keep an eye on both application and database logs
4. **Test edge cases**: Amount mismatches, invalid references, etc.
5. **Verify end-to-end**: Check that frontend updates reflect changes

## 🔗 Related Files

- `frontend/src/app/api/webhooks/airwallex/route.ts` - Webhook handler
- `scripts/test-bank-transfer-webhook.js` - Test script
- `scripts/get-test-reference.js` - Helper to get real references
- `frontend/src/lib/wallet-service.ts` - Wallet processing logic 