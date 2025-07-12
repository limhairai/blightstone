/**
 * Validate email addresses
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): boolean {
  // At least 8 characters, one uppercase, one lowercase, one number, one special character
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

/**
 * Validate monetary amounts
 */
export function validateAmount(
  amount: number, 
  min: number = 0.01, 
  max: number = Infinity
): boolean {
  return !isNaN(amount) && 
         isFinite(amount) && 
         amount > 0 && 
         amount >= min && 
         amount <= max;
}

/**
 * Validate topup request data
 */
export function validateTopupRequest(
  request: {
    amount: number;
    payment_method: string;
    organization_id: string | undefined;
  },
  subscriptionPlan: string = 'starter'
): boolean {
  // Validate amount (note: for topup requests, we use a different max limit than general amounts)
  const maxAmount = getMaxTopupAmount(subscriptionPlan);
  if (!validateAmount(request.amount, 10, maxAmount)) {
    return false;
  }

  // Validate payment method
  const validPaymentMethods = ['crypto', 'bank_transfer', 'credit_card'];
  if (!validPaymentMethods.includes(request.payment_method)) {
    return false;
  }

  // Validate organization
  if (!request.organization_id || request.organization_id.trim() === '') {
    return false;
  }

  return true;
}

/**
 * Get maximum topup amount based on subscription plan
 */
function getMaxTopupAmount(plan: string): number {
  const limits = {
    starter: 5000, // Below the 6000 monthly limit for individual requests
    growth: 10000,
    scale: 25000,
    enterprise: Infinity
  };
  
  return limits[plan as keyof typeof limits] || 0;
}

/**
 * Validate phone numbers
 */
export function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
  return phoneRegex.test(phone);
}

/**
 * Validate organization name
 */
export function validateOrganizationName(name: string): boolean {
  return name.trim().length >= 2 && name.trim().length <= 100;
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate credit card number (basic Luhn algorithm)
 */
export function validateCreditCard(cardNumber: string): boolean {
  const cleaned = cardNumber.replace(/\D/g, '');
  
  if (cleaned.length < 13 || cleaned.length > 19) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i]);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Validate CVV code
 */
export function validateCVV(cvv: string): boolean {
  const cvvRegex = /^\d{3,4}$/;
  return cvvRegex.test(cvv);
}

/**
 * Validate expiration date (MM/YY format)
 */
export function validateExpirationDate(expiry: string): boolean {
  const expiryRegex = /^(0[1-9]|1[0-2])\/\d{2}$/;
  
  if (!expiryRegex.test(expiry)) {
    return false;
  }

  const [month, year] = expiry.split('/');
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;

  const cardYear = parseInt(year);
  const cardMonth = parseInt(month);

  if (cardYear < currentYear || (cardYear === currentYear && cardMonth < currentMonth)) {
    return false;
  }

  return true;
}

/**
 * Validate required fields
 */
export function validateRequired(value: any): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  
  return true;
} 