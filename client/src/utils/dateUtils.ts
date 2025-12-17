/**
 * Date utility functions for the Dashboard
 */

/**
 * Returns a greeting based on the current time of day
 */
export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Returns the current season with abbreviated year (e.g., "Winter '25")
 */
export function getCurrentSeason(): string {
  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear().toString().slice(-2);

  if (month >= 2 && month <= 4) return `Spring '${year}`;
  if (month >= 5 && month <= 7) return `Summer '${year}`;
  if (month >= 8 && month <= 10) return `Fall '${year}`;
  return `Winter '${year}`;
}

/**
 * Format a date string as relative time (e.g., "5m ago", "2h ago", "3d ago").
 * Falls back to formatted date for dates older than 7 days.
 *
 * @param dateString - ISO 8601 date string or null/undefined
 * @returns Formatted relative time string or fallback message
 *
 * @example
 * formatRelativeTime("2025-12-16T14:30:00Z") // "2h ago"
 * formatRelativeTime(null) // "Unknown date"
 * formatRelativeTime("invalid") // "Invalid date"
 */
export function formatRelativeTime(dateString: string | null | undefined): string {
  // Handle null/undefined
  if (!dateString) {
    return 'Unknown date';
  }

  // Parse date
  const date = new Date(dateString);

  // Check for invalid date
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string: ${dateString}`);
    return 'Invalid date';
  }

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // Handle future dates (negative time difference)
  if (diffMs < 0) {
    console.warn(`Future date detected: ${dateString}`);
    return date.toLocaleDateString();
  }

  // Calculate time units
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Format based on time difference
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  // For dates older than 7 days, show formatted date
  return date.toLocaleDateString();
}

/**
 * Format a date string as a localized date and time.
 *
 * @param dateString - ISO 8601 date string or null/undefined
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date/time string or fallback message
 *
 * @example
 * formatDateTime("2025-12-16T14:30:00Z") // "12/16/2025, 2:30 PM"
 * formatDateTime("2025-12-16T14:30:00Z", { dateStyle: 'medium' }) // "Dec 16, 2025"
 */
export function formatDateTime(
  dateString: string | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  // Handle null/undefined
  if (!dateString) {
    return 'Unknown date';
  }

  // Parse date
  const date = new Date(dateString);

  // Check for invalid date
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string: ${dateString}`);
    return 'Invalid date';
  }

  // Default options: show date and time
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options,
  };

  return date.toLocaleString(undefined, defaultOptions);
}

/**
 * Format a date string as just the date (no time).
 *
 * @param dateString - ISO 8601 date string or null/undefined
 * @returns Formatted date string or fallback message
 *
 * @example
 * formatDate("2025-12-16T14:30:00Z") // "12/16/2025"
 */
export function formatDate(dateString: string | null | undefined): string {
  // Handle null/undefined
  if (!dateString) {
    return 'Unknown date';
  }

  // Parse date
  const date = new Date(dateString);

  // Check for invalid date
  if (isNaN(date.getTime())) {
    console.warn(`Invalid date string: ${dateString}`);
    return 'Invalid date';
  }

  return date.toLocaleDateString();
}
