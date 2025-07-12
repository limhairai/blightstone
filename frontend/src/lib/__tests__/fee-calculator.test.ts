import { calculateSubscriptionFee, calculateAdSpendFee, calculateTotalFees, getSubscriptionLimits } from '../fee-calculator';

describe('Fee Calculator', () => {
  describe('calculateSubscriptionFee', () => {
    it('should calculate correct monthly fees for each plan', () => {
      expect(calculateSubscriptionFee('starter')).toBe(29);
      expect(calculateSubscriptionFee('growth')).toBe(149);
      expect(calculateSubscriptionFee('scale')).toBe(499);
      expect(calculateSubscriptionFee('enterprise')).toBe(1499);
    });

    it('should handle invalid plans', () => {
      expect(calculateSubscriptionFee('invalid')).toBe(0);
      expect(calculateSubscriptionFee('')).toBe(0);
    });

    it('should calculate prorated fees', () => {
      expect(calculateSubscriptionFee('starter', 15)).toBe(14.50); // Half month
      expect(calculateSubscriptionFee('growth', 10)).toBe(49.67); // 1/3 month
    });
  });

  describe('calculateAdSpendFee', () => {
    it('should calculate correct ad spend fees for each plan', () => {
      expect(calculateAdSpendFee(1000, 'starter')).toBe(60); // 6%
      expect(calculateAdSpendFee(1000, 'growth')).toBe(30); // 3%
      expect(calculateAdSpendFee(1000, 'scale')).toBe(15); // 1.5%
      expect(calculateAdSpendFee(1000, 'enterprise')).toBe(10); // 1%
    });

    it('should handle zero ad spend', () => {
      expect(calculateAdSpendFee(0, 'starter')).toBe(0);
      expect(calculateAdSpendFee(0, 'growth')).toBe(0);
    });

    it('should handle large ad spend amounts', () => {
      expect(calculateAdSpendFee(100000, 'starter')).toBe(6000); // 6%
      expect(calculateAdSpendFee(100000, 'enterprise')).toBe(1000); // 1%
    });

    it('should handle invalid plans', () => {
      expect(calculateAdSpendFee(1000, 'invalid')).toBe(0);
    });
  });

  describe('calculateTotalFees', () => {
    it('should calculate total fees correctly', () => {
      const fees = calculateTotalFees({
        plan: 'starter',
        adSpend: 1000,
        daysInMonth: 30
      });

      expect(fees).toEqual({
        subscriptionFee: 29,
        adSpendFee: 60,
        totalFee: 89
      });
    });

    it('should handle prorated subscription fees', () => {
      const fees = calculateTotalFees({
        plan: 'growth',
        adSpend: 2000,
        daysInMonth: 15
      });

      expect(fees.subscriptionFee).toBe(74.50); // Half month
      expect(fees.adSpendFee).toBe(60); // 3% of 2000
      expect(fees.totalFee).toBe(134.50);
    });

    it('should handle zero ad spend', () => {
      const fees = calculateTotalFees({
        plan: 'scale',
        adSpend: 0,
        daysInMonth: 30
      });

      expect(fees).toEqual({
        subscriptionFee: 499,
        adSpendFee: 0,
        totalFee: 499
      });
    });
  });

  describe('getSubscriptionLimits', () => {
    it('should return correct limits for each plan', () => {
      expect(getSubscriptionLimits('starter')).toEqual({
        businessManagers: 1,
        adAccounts: 5,
        teamMembers: 2,
        monthlyTopupLimit: 6000
      });

      expect(getSubscriptionLimits('growth')).toEqual({
        businessManagers: 3,
        adAccounts: 21,
        teamMembers: 5,
        monthlyTopupLimit: 25000
      });

      expect(getSubscriptionLimits('scale')).toEqual({
        businessManagers: 10,
        adAccounts: 70,
        teamMembers: 15,
        monthlyTopupLimit: 100000
      });

      expect(getSubscriptionLimits('enterprise')).toEqual({
        businessManagers: -1, // unlimited
        adAccounts: -1, // unlimited
        teamMembers: -1, // unlimited
        monthlyTopupLimit: -1 // unlimited
      });
    });

    it('should handle invalid plans', () => {
      expect(getSubscriptionLimits('invalid')).toEqual({
        businessManagers: 0,
        adAccounts: 0,
        teamMembers: 0,
        monthlyTopupLimit: 0
      });
    });
  });

  describe('Fee calculation edge cases', () => {
    it('should handle very small amounts', () => {
      expect(calculateAdSpendFee(0.01, 'starter')).toBe(0.0006);
    });

    it('should handle very large amounts', () => {
      expect(calculateAdSpendFee(1000000, 'enterprise')).toBe(10000);
    });

    it('should round fees appropriately', () => {
      expect(calculateAdSpendFee(333.33, 'starter')).toBe(19.9998); // 6% of 333.33 = 19.9998
    });
  });
}); 