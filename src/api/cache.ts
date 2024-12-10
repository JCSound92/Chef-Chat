import { Recipe } from '../types';
import { debounce } from '../utils/debounce';

export const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache for storing recent API responses
const responseCache = new Map<string, {
  data: Recipe[];
  timestamp: number;
}>();

// Debounced function to clear old cache entries
export const cleanCache = debounce(() => {
  const now = Date.now();
  for (const [key, value] of responseCache.entries()) {
    if (now - value.timestamp > CACHE_DURATION) {
      responseCache.delete(key);
    }
  }
}, 60000);

export function getCachedResponse(cacheKey: string): Recipe[] | null {
  const cached = responseCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
}

export function setCachedResponse(cacheKey: string, data: Recipe[]): void {
  responseCache.set(cacheKey, {
    data,
    timestamp: Date.now()
  });
}