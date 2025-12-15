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
