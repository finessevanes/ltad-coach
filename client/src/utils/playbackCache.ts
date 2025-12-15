/**
 * Playback Position Cache
 *
 * Module-level singleton that persists video playback positions across route transitions.
 * This is a lightweight utility that survives component unmounting without requiring
 * a React Context provider.
 *
 * Usage:
 * - Save position on timeupdate or before unmount
 * - Restore position on mount if recent (within 5 minutes)
 * - Clear when video completes or user explicitly closes
 */

interface PlaybackState {
  currentTime: number;
  lastUpdated: number;
}

// Module-level Map survives route changes
const playbackCache = new Map<string, PlaybackState>();

export const PlaybackCache = {
  /**
   * Save current playback position for a video
   * @param videoId Unique identifier for the video (e.g., "assessment-123-left")
   * @param currentTime Current playback position in seconds
   */
  save(videoId: string, currentTime: number): void {
    playbackCache.set(videoId, {
      currentTime,
      lastUpdated: Date.now(),
    });
  },

  /**
   * Get saved playback position if recent
   * @param videoId Unique identifier for the video
   * @returns Saved position in seconds, or null if not found or expired
   */
  get(videoId: string): number | null {
    const cached = playbackCache.get(videoId);

    // Return null if not found
    if (!cached) {
      return null;
    }

    // Return null if older than 5 minutes (cache expiry)
    const age = Date.now() - cached.lastUpdated;
    const maxAge = 5 * 60 * 1000; // 5 minutes

    if (age > maxAge) {
      playbackCache.delete(videoId);
      return null;
    }

    return cached.currentTime;
  },

  /**
   * Clear saved position for a video
   * @param videoId Unique identifier for the video
   */
  clear(videoId: string): void {
    playbackCache.delete(videoId);
  },

  /**
   * Clear all cached positions (useful for testing or cleanup)
   */
  clearAll(): void {
    playbackCache.clear();
  },

  /**
   * Get cache statistics (for debugging)
   */
  getStats(): { size: number; videoIds: string[] } {
    return {
      size: playbackCache.size,
      videoIds: Array.from(playbackCache.keys()),
    };
  },
};
