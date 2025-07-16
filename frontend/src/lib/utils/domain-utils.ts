/**
 * Domain normalization and validation utilities
 */

/**
 * Normalize a domain/URL to its base domain
 * Removes protocol, www, paths, query params, and fragments
 */
export function normalizeDomain(input: string): string {
  if (!input) return '';
  
  let domain = input.trim().toLowerCase();
  
  // Remove protocol
  domain = domain.replace(/^https?:\/\//, '');
  
  // Remove www prefix
  domain = domain.replace(/^www\./, '');
  
  // Remove path, query params, and fragments
  domain = domain.split('/')[0];
  domain = domain.split('?')[0];
  domain = domain.split('#')[0];
  
  // Remove trailing dots
  domain = domain.replace(/\.$/, '');
  
  return domain;
}

/**
 * Check if a domain is valid
 */
export function isValidDomain(domain: string): boolean {
  const normalized = normalizeDomain(domain);
  
  // Basic domain regex - must have at least one dot and valid characters
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return domainRegex.test(normalized) && normalized.includes('.');
}

/**
 * Check if a domain is a subdomain of another
 */
export function isSubdomain(domain: string, baseDomain: string): boolean {
  const normalizedDomain = normalizeDomain(domain);
  const normalizedBase = normalizeDomain(baseDomain);
  
  return normalizedDomain !== normalizedBase && normalizedDomain.endsWith('.' + normalizedBase);
}

/**
 * Extract base domain from a subdomain
 * e.g., "blog.example.com" -> "example.com"
 */
export function getBaseDomain(domain: string): string {
  const normalized = normalizeDomain(domain);
  const parts = normalized.split('.');
  
  // For domains like "example.com", return as-is
  if (parts.length <= 2) {
    return normalized;
  }
  
  // For subdomains like "blog.example.com", return "example.com"
  return parts.slice(-2).join('.');
}

/**
 * Check for duplicate domains in an array (normalized comparison)
 */
export function hasDuplicateDomains(domains: string[]): boolean {
  const normalized = domains.map(normalizeDomain);
  const unique = new Set(normalized);
  return unique.size !== normalized.length;
}

/**
 * Remove duplicate domains from an array
 */
export function removeDuplicateDomains(domains: string[]): string[] {
  const seen = new Set<string>();
  return domains.filter(domain => {
    const normalized = normalizeDomain(domain);
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

/**
 * Policy: Should we allow subdomains?
 * For now, let's allow them but warn users
 */
export const SUBDOMAIN_POLICY = {
  ALLOW: true,
  WARNING_MESSAGE: "Subdomains are allowed, but consider if you need the base domain instead."
} as const; 