# 🃏 Stripe Test Card Numbers

## ✅ Successful Test Cards

### **Basic Success**
- **Card**: `4242 4242 4242 4242`
- **Expiry**: Any future date (e.g., 12/25)
- **CVC**: Any 3 digits (e.g., 123)
- **Result**: Always succeeds

### **Visa**
- **Card**: `4000 0000 0000 0002`
- **Result**: Always succeeds

### **Mastercard**
- **Card**: `5555 5555 5555 4444`
- **Result**: Always succeeds

### **American Express**
- **Card**: `3782 8224 6310 005`
- **Result**: Always succeeds

## ❌ Decline Test Cards

### **Generic Decline**
- **Card**: `4000 0000 0000 0002`
- **Result**: Generic decline

### **Insufficient Funds**
- **Card**: `4000 0000 0000 9995`
- **Result**: Insufficient funds decline

### **Lost Card**
- **Card**: `4000 0000 0000 9987`
- **Result**: Lost card decline

### **Stolen Card**
- **Card**: `4000 0000 0000 9979`
- **Result**: Stolen card decline

## 🔒 3D Secure Test Cards

### **Authentication Required**
- **Card**: `4000 0027 6000 3184`
- **Result**: Requires 3D Secure authentication

### **Authentication Fails**
- **Card**: `4000 0000 0000 9979`
- **Result**: 3D Secure authentication fails

## 💡 Usage Tips

- **Expiry**: Use any future date (MM/YY format)
- **CVC**: Use any 3-digit number (4 digits for Amex)
- **ZIP**: Use any valid ZIP code
- **Amount**: Test with different amounts ($1, $10, $100, etc.)
- **Currency**: Test with USD, EUR, GBP, etc.

## 🧪 Testing Scenarios

1. **Successful Payment**: Use `4242 4242 4242 4242`
2. **Declined Payment**: Use `4000 0000 0000 0002`
3. **Insufficient Funds**: Use `4000 0000 0000 9995`
4. **3D Secure**: Use `4000 0027 6000 3184`
5. **Different Card Types**: Test Visa, Mastercard, Amex

All test cards are safe and will never charge real money! 💸
