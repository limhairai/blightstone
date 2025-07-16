import { normalizeDomain, isValidDomain, hasDuplicateDomains, removeDuplicateDomains, isSubdomain, getBaseDomain } from '../domain-utils';

describe('Domain Utils', () => {
  describe('normalizeDomain', () => {
    test('removes protocols', () => {
      expect(normalizeDomain('https://example.com')).toBe('example.com');
      expect(normalizeDomain('http://example.com')).toBe('example.com');
    });

    test('removes www prefix', () => {
      expect(normalizeDomain('www.example.com')).toBe('example.com');
      expect(normalizeDomain('https://www.example.com')).toBe('example.com');
    });

    test('removes paths and query params', () => {
      expect(normalizeDomain('example.com/product/a')).toBe('example.com');
      expect(normalizeDomain('example.com/product/b?utm_source=google')).toBe('example.com');
      expect(normalizeDomain('example.com#section')).toBe('example.com');
    });

    test('handles complex URLs', () => {
      expect(normalizeDomain('https://www.example.com/product/a?utm_source=google&utm_medium=cpc#section')).toBe('example.com');
    });

    test('converts to lowercase', () => {
      expect(normalizeDomain('EXAMPLE.COM')).toBe('example.com');
      expect(normalizeDomain('Example.Com')).toBe('example.com');
    });
  });

  describe('isValidDomain', () => {
    test('validates correct domains', () => {
      expect(isValidDomain('example.com')).toBe(true);
      expect(isValidDomain('sub.example.com')).toBe(true);
      expect(isValidDomain('my-site.co.uk')).toBe(true);
    });

    test('rejects invalid domains', () => {
      expect(isValidDomain('example')).toBe(false);
      expect(isValidDomain('example.')).toBe(false);
      expect(isValidDomain('.example.com')).toBe(false);
      expect(isValidDomain('')).toBe(false);
    });
  });

  describe('hasDuplicateDomains', () => {
    test('detects duplicates after normalization', () => {
      expect(hasDuplicateDomains(['example.com', 'www.example.com'])).toBe(true);
      expect(hasDuplicateDomains(['https://example.com', 'example.com/page'])).toBe(true);
      expect(hasDuplicateDomains(['example.com', 'different.com'])).toBe(false);
    });
  });

  describe('isSubdomain', () => {
    test('identifies subdomains correctly', () => {
      expect(isSubdomain('blog.example.com', 'example.com')).toBe(true);
      expect(isSubdomain('www.example.com', 'example.com')).toBe(false); // www is normalized away
      expect(isSubdomain('example.com', 'example.com')).toBe(false);
      expect(isSubdomain('different.com', 'example.com')).toBe(false);
    });
  });

  describe('getBaseDomain', () => {
    test('extracts base domain from subdomains', () => {
      expect(getBaseDomain('blog.example.com')).toBe('example.com');
      expect(getBaseDomain('api.v1.example.com')).toBe('example.com');
      expect(getBaseDomain('example.com')).toBe('example.com');
    });
  });
}); 