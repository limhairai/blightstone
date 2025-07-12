import { validateEmail, validatePassword, validateAmount, validateTopupRequest } from '../validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true);
      expect(validateEmail('user123@test-domain.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('@domain.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('user@domain')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('StrongPass123!')).toBe(true);
      expect(validatePassword('MySecure@Pass1')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
      expect(validatePassword('onlylowercase')).toBe(false);
      expect(validatePassword('ONLYUPPERCASE')).toBe(false);
      expect(validatePassword('NoNumbers!')).toBe(false);
    });

    it('should enforce minimum length', () => {
      expect(validatePassword('Short1!')).toBe(false);
      expect(validatePassword('LongEnough123!')).toBe(true);
    });
  });

  describe('validateAmount', () => {
    it('should validate positive amounts', () => {
      expect(validateAmount(100)).toBe(true);
      expect(validateAmount(1000.50)).toBe(true);
      expect(validateAmount(0.01)).toBe(true);
    });

    it('should reject invalid amounts', () => {
      expect(validateAmount(0)).toBe(false);
      expect(validateAmount(-100)).toBe(false);
      expect(validateAmount(NaN)).toBe(false);
      expect(validateAmount(Infinity)).toBe(false);
    });

    it('should validate amount ranges', () => {
      expect(validateAmount(50, 100, 1000)).toBe(false); // below min
      expect(validateAmount(500, 100, 1000)).toBe(true); // within range
      expect(validateAmount(1500, 100, 1000)).toBe(false); // above max
    });
  });

  describe('validateTopupRequest', () => {
    const validRequest = {
      amount: 500,
      payment_method: 'crypto',
      organization_id: 'org-123'
    };

    it('should validate correct topup requests', () => {
      expect(validateTopupRequest(validRequest)).toBe(true);
    });

    it('should reject requests with invalid amounts', () => {
      expect(validateTopupRequest({ ...validRequest, amount: 0 })).toBe(false);
      expect(validateTopupRequest({ ...validRequest, amount: -100 })).toBe(false);
    });

    it('should reject requests with invalid payment methods', () => {
      expect(validateTopupRequest({ ...validRequest, payment_method: 'invalid' })).toBe(false);
      expect(validateTopupRequest({ ...validRequest, payment_method: '' })).toBe(false);
    });

    it('should reject requests without organization', () => {
      expect(validateTopupRequest({ ...validRequest, organization_id: '' })).toBe(false);
      expect(validateTopupRequest({ ...validRequest, organization_id: undefined })).toBe(false);
    });

    it('should validate amount limits based on subscription', () => {
      const starterRequest = { ...validRequest, amount: 6000 }; // Above starter limit
      expect(validateTopupRequest(starterRequest, 'starter')).toBe(false);
      expect(validateTopupRequest(starterRequest, 'growth')).toBe(true);
    });
  });
}); 