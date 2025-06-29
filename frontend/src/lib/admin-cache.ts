// Simple cache for admin data to improve performance
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in milliseconds
}

class AdminCache {
  private cache = new Map<string, CacheEntry<any>>();
  
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void { // default 5 minutes
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  // Helper method for fetching with cache
  async fetchWithCache<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached) return cached;
    
    const data = await fetchFn();
    this.set(key, data, ttl);
    return data;
  }
}

export const adminCache = new AdminCache(); 