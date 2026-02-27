import { aiService } from './ai';

// Module-level cache and promise to prevent duplicate API calls
let insightsCacheData: any = null;
let insightsCacheTimestamp = 0;
let insightsFetchPromise: Promise<any> | null = null;

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const insightsCacheService = {
  /**
   * Get insights with intelligent caching
   * Uses a shared promise to prevent duplicate simultaneous requests
   */
  async getInsights(forceRefresh: boolean = false) {
    const now = Date.now();

    // Return cached data if valid and not forcing refresh
    if (
      !forceRefresh &&
      insightsCacheData &&
      now - insightsCacheTimestamp < CACHE_DURATION
    ) {
      console.log('📦 Using module-level cached insights');
      return insightsCacheData;
    }

    // Clear cache on force refresh
    if (forceRefresh) {
      insightsCacheData = null;
      insightsCacheTimestamp = 0;
    }

    // If a fetch is already in progress, return that promise
    if (insightsFetchPromise) {
      console.log('⏳ Waiting for in-flight insights request...');
      return insightsFetchPromise;
    }

    // Start new fetch
    insightsFetchPromise = (async () => {
      try {
        const response = await aiService.getInsights(forceRefresh);
        
        // Cache the result
        insightsCacheData = response;
        insightsCacheTimestamp = Date.now();
        
        return response;
      } finally {
        // Clear the promise after completion
        insightsFetchPromise = null;
      }
    })();

    return insightsFetchPromise;
  },

  /**
   * Clear all cache
   */
  clearCache() {
    insightsCacheData = null;
    insightsCacheTimestamp = 0;
    insightsFetchPromise = null;
  },
};
