/**
 * Video caching utility using IndexedDB
 * Stores video Blobs locally to prevent re-downloading from Firebase Storage
 */

const DB_NAME = 'ltad-video-cache';
const DB_VERSION = 1;
const STORE_NAME = 'videos';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedVideo {
  url: string;           // Original Firebase Storage URL
  blob: Blob;           // Video data
  timestamp: number;    // When cached
  videoId: string;      // Unique identifier (e.g., "assessment-123-left")
}

class VideoCache {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  /**
   * Initialize IndexedDB
   */
  private async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'videoId' });
          store.createIndex('url', 'url', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  /**
   * Get cached video by videoId
   */
  async get(videoId: string): Promise<Blob | null> {
    try {
      await this.init();
      if (!this.db) return null;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(videoId);

        request.onsuccess = () => {
          const cached = request.result as CachedVideo | undefined;

          if (!cached) {
            resolve(null);
            return;
          }

          // Check expiry
          const age = Date.now() - cached.timestamp;
          if (age > CACHE_EXPIRY_MS) {
            this.delete(videoId); // Clean up expired entry
            resolve(null);
            return;
          }

          resolve(cached.blob);
        };

        request.onerror = () => {
          console.error('Failed to get cached video:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Get cached video failed:', error);
      return null;
    }
  }

  /**
   * Store video in cache
   */
  async set(videoId: string, url: string, blob: Blob): Promise<void> {
    try {
      await this.init();
      if (!this.db) {
        return;
      }

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const cached: CachedVideo = {
          videoId,
          url,
          blob,
          timestamp: Date.now(),
        };

        const request = store.put(cached);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          console.error('Failed to cache video:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Set cached video failed:', error);
    }
  }

  /**
   * Delete cached video
   */
  async delete(videoId: string): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(videoId);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          console.error('Failed to delete cached video:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Delete cached video failed:', error);
    }
  }

  /**
   * Clear all cached videos
   */
  async clear(): Promise<void> {
    try {
      await this.init();
      if (!this.db) return;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = () => {
          console.error('Failed to clear cache:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Clear cache failed:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{ count: number; totalSize: number }> {
    try {
      await this.init();
      if (!this.db) return { count: 0, totalSize: 0 };

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const videos = request.result as CachedVideo[];
          const totalSize = videos.reduce((sum, v) => sum + v.blob.size, 0);
          resolve({
            count: videos.length,
            totalSize,
          });
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Get cache stats failed:', error);
      return { count: 0, totalSize: 0 };
    }
  }

  /**
   * Clean up expired entries
   */
  async cleanupExpired(): Promise<number> {
    try {
      await this.init();
      if (!this.db) return 0;

      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
          const videos = request.result as CachedVideo[];
          const now = Date.now();
          let deletedCount = 0;

          videos.forEach((video) => {
            if (now - video.timestamp > CACHE_EXPIRY_MS) {
              store.delete(video.videoId);
              deletedCount++;
            }
          });

          resolve(deletedCount);
        };

        request.onerror = () => {
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Cleanup expired cache failed:', error);
      return 0;
    }
  }
}

// Singleton instance
export const videoCache = new VideoCache();

/**
 * Fetch video from URL with caching
 * First checks IndexedDB cache, falls back to network fetch
 */
export async function fetchVideoWithCache(
  videoId: string,
  url: string
): Promise<string> {
  // Try cache first
  const cachedBlob = await videoCache.get(videoId);
  if (cachedBlob) {
    return URL.createObjectURL(cachedBlob);
  }

  // Cache miss - fetch from network
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Failed to fetch video: ${response.statusText}`);
  }

  const blob = await response.blob();

  // Cache for next time (fire-and-forget)
  videoCache.set(videoId, url, blob).catch((err) => {
    console.warn('Failed to cache video:', err);
  });

  return URL.createObjectURL(blob);
}
