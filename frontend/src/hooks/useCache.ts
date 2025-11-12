// frontend/src/hooks/useCache.ts - FIXED VERSION
interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useCache = () => {
  const get = <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(`cache_${key}`);
      if (!item) return null;

      const cacheItem: CacheItem<T> = JSON.parse(item);
      if (Date.now() - cacheItem.timestamp > cacheItem.expiry) {
        localStorage.removeItem(`cache_${key}`);
        return null;
      }

      return cacheItem.data;
    } catch {
      return null;
    }
  };

  const set = <T>(key: string, data: T, expiry: number = CACHE_DURATION) => {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiry
      };
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('Cache set failed:', error);
    }
  };

  const clear = (key: string) => {
    localStorage.removeItem(`cache_${key}`);
  };

  return { get, set, clear };
};