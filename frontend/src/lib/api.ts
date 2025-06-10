// API utility functions for consistent token handling
import { Session } from '@supabase/supabase-js';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Make an authenticated API call using Supabase session token
 */
export async function authenticatedFetch(
  url: string, 
  session: Session | null, 
  options: FetchOptions = {}
): Promise<Response> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Helper for common JSON API requests
 */
export async function apiRequest<T = any>(
  url: string,
  session: Session | null,
  options: FetchOptions = {}
): Promise<T> {
  const response = await authenticatedFetch(url, session, options);
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `HTTP ${response.status}: ${response.statusText}`);
  }
  
  return response.json();
} 