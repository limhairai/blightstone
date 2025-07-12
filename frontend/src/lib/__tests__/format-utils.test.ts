import { formatCurrency, formatDate, formatPercentage, formatFileSize } from '../format';

describe('Format Utils', () => {
  describe('formatCurrency', () => {
    it('should format USD currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should handle negative amounts', () => {
      expect(formatCurrency(-1234.56)).toBe('-$1,234.56');
    });

    it('should handle different currencies', () => {
      expect(formatCurrency(1234.56, 'EUR')).toBe('€1,234.56');
      expect(formatCurrency(1234.56, 'GBP')).toBe('£1,234.56');
    });

    it('should handle cents conversion', () => {
      expect(formatCurrency(123456, 'USD', true)).toBe('$1,234.56');
      expect(formatCurrency(100, 'USD', true)).toBe('$1.00');
    });
  });

  describe('formatDate', () => {
    it('should format dates consistently', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date)).toMatch(/Jan 15, 2024/);
    });

    it('should handle different date formats', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      expect(formatDate(date, 'short')).toMatch(/1\/15\/2024/);
      expect(formatDate(date, 'long')).toMatch(/January 15, 2024/);
    });

    it('should handle invalid dates', () => {
      expect(formatDate(new Date('invalid'))).toBe('Invalid Date');
    });
  });

  describe('formatPercentage', () => {
    it('should format percentages correctly', () => {
      expect(formatPercentage(0.1234)).toBe('12.34%');
      expect(formatPercentage(0.5)).toBe('50.00%');
      expect(formatPercentage(1)).toBe('100.00%');
    });

    it('should handle different decimal places', () => {
      expect(formatPercentage(0.1234, 1)).toBe('12.3%');
      expect(formatPercentage(0.1234, 0)).toBe('12%');
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(1024)).toBe('1.00 KB');
      expect(formatFileSize(1048576)).toBe('1.00 MB');
      expect(formatFileSize(1073741824)).toBe('1.00 GB');
    });

    it('should handle bytes', () => {
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(0)).toBe('0 B');
    });
  });
}); 