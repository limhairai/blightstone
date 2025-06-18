# 💳 Payment Integration Setup Guide

## 🎯 **What We Built**

Complete **Telegram Bot → Stripe → Frontend** payment system:

### **Telegram Bot Integration**
- `/pay <org_id> <amount>` - Create secure payment links
- `/payment_status` - Check recent payments  
- `/payment_help` - Payment methods and help
- Real-time notifications when payments succeed/fail

### **Frontend Integration**
- `/payment/[id]` - Secure Stripe checkout page
- `/payment/success` - Payment confirmation page
- Full Stripe Elements integration with card validation

### **Backend Integration**
- Complete Stripe payment intent creation
- Webhook handling for automatic wallet top-ups
- Payment method management (save, list, delete)
- Full audit trail and transaction logging

---

## 🔧 **Setup Instructions**

### **1. Stripe Account Setup**

1. **Create Stripe Account**: Go to [stripe.com](https://stripe.com) and sign up
2. **Get API Keys**: Dashboard → Developers → API keys
   - Copy **Publishable key** (starts with `pk_`)
   - Copy **Secret key** (starts with `sk_`)
3. **Create Webhook**: Dashboard → Developers → Webhooks
   - **Endpoint URL**: `https://your-backend.com/api/payments/webhook`
   - **Events to send**: 
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
   - Copy **Webhook signing secret** (starts with `whsec_`)

### **2. Environment Variables**

**Backend (.env)**:
```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_bot_token_here
BACKEND_URL=http://localhost:8000  # Your backend URL

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
```

**Frontend (.env.local)**:
```bash
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here

# Backend
BACKEND_URL=http://localhost:8000
```

### **3. Install Dependencies**

**Backend**:
```bash
cd backend
pip install stripe
```

**Frontend**:
```bash
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### **4. Database Migration**

Run the payment system migration:
```bash
# Apply the migration we created
psql -h your-supabase-host -U postgres -d postgres -f supabase/migrations/20250617000000_add_payment_system.sql
```

---

## 🚀 **How It Works**

### **Payment Flow**

1. **User initiates payment** via Telegram: `/pay org-123 100.00`
2. **Bot creates payment intent** via backend API
3. **User gets payment link** with secure Stripe checkout
4. **User completes payment** on web page
5. **Stripe webhook** automatically updates wallet balance
6. **User gets confirmation** in Telegram bot

### **Security Features**

- ✅ **Stripe-secured payments** - Industry-standard security
- ✅ **Webhook signature verification** - Prevents fraud
- ✅ **Idempotency keys** - Prevents duplicate payments
- ✅ **Role-based permissions** - Only owners/admins can pay
- ✅ **Complete audit trail** - All transactions logged

### **User Experience**

- 🎯 **Simple commands** - `/pay org-123 50` and done
- ⚡ **Instant notifications** - Real-time updates in Telegram
- 💳 **Multiple payment methods** - Cards, Apple Pay, Google Pay
- 📱 **Mobile-optimized** - Works perfectly on phones

---

## 🧪 **Testing**

### **Test the Integration**

1. **Start your services**:
   ```bash
   # Backend
   cd backend && uvicorn main:app --reload
   
   # Frontend  
   cd frontend && npm run dev
   
   # Telegram Bot
   cd telegram-bot && python src/main.py
   ```

2. **Test payment flow**:
   ```bash
   # In Telegram bot
   /pay org-123 10.00
   
   # Click the payment link
   # Complete payment with test card: 4242 4242 4242 4242
   # Check wallet balance: /wallet org-123
   ```

### **Stripe Test Cards**

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`  
- **3D Secure**: `4000 0000 0000 3220`

---

## 📊 **Features Overview**

### **Telegram Bot Commands**

| Command | Description | Example |
|---------|-------------|---------|
| `/pay <org_id> <amount>` | Create payment link | `/pay org-123 100.00` |
| `/payment_status` | Check recent payments | `/payment_status` |
| `/payment_help` | Payment help & limits | `/payment_help` |
| `/wallet <org_id>` | Check wallet balance | `/wallet org-123` |

### **Backend API Endpoints**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/payments/create-intent` | POST | Create payment intent |
| `/api/payments/intent/{id}` | GET | Get payment details |
| `/api/payments/success/{id}` | GET | Get success details |
| `/api/payments/webhook` | POST | Stripe webhook handler |
| `/api/payments/methods` | GET | List payment methods |

### **Frontend Pages**

| Page | Description |
|------|-------------|
| `/payment/[id]` | Stripe checkout page |
| `/payment/success` | Payment confirmation |

---

## 🔒 **Security & Compliance**

### **Data Protection**
- **No card data stored** - Stripe handles all sensitive data
- **PCI DSS compliant** - Stripe certification covers you
- **Encrypted communications** - HTTPS everywhere

### **Access Control**
- **Role-based permissions** - Only owners/admins can make payments
- **Organization isolation** - Users can only access their orgs
- **Audit logging** - Complete transaction history

### **Fraud Prevention**
- **Webhook verification** - Cryptographic signature checking
- **Idempotency** - Prevents duplicate payments
- **Amount limits** - $10 minimum, $10,000 maximum

---

## 🚨 **Production Checklist**

### **Before Going Live**

- [ ] **Switch to live Stripe keys** (remove `_test_` from keys)
- [ ] **Update webhook URL** to production backend
- [ ] **Test webhook delivery** in Stripe dashboard
- [ ] **Set up monitoring** for failed payments
- [ ] **Configure email receipts** in Stripe
- [ ] **Test all payment flows** end-to-end
- [ ] **Set up backup webhook endpoints**

### **Monitoring & Alerts**

- [ ] **Payment success/failure rates**
- [ ] **Webhook delivery status**
- [ ] **Database transaction consistency**
- [ ] **User notification delivery**

---

## 🆘 **Troubleshooting**

### **Common Issues**

**Payment link not working**:
- Check `BACKEND_URL` environment variable
- Verify Stripe publishable key is set
- Check payment intent exists in database

**Webhook not firing**:
- Verify webhook URL is accessible
- Check webhook signing secret
- Look for signature verification errors

**Telegram notifications not sent**:
- Check bot token is valid
- Verify user is linked to account
- Check bot has permission to send messages

### **Debug Commands**

```bash
# Check payment in Stripe dashboard
stripe payments list --limit 10

# Check webhook deliveries
stripe events list --limit 10

# Test webhook locally
stripe listen --forward-to localhost:8000/api/payments/webhook
```

---

## 🎉 **You're Ready!**

Your payment system is now **production-ready** with:

- ✅ **Secure Stripe integration**
- ✅ **Telegram bot payments**  
- ✅ **Automatic wallet top-ups**
- ✅ **Complete audit trail**
- ✅ **Real-time notifications**

**Next Steps**: Test thoroughly, then switch to live Stripe keys and launch! 🚀 