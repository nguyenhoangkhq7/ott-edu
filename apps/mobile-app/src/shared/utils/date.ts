/**
 * Date and Timezone Utility Functions (Mobile App)
 * Handles proper conversion between local time and UTC for assignment deadlines
 */

/**
 * Convert a JavaScript Date object to ISO 8601 UTC string
 * 
 * @param date - JavaScript Date object in local timezone
 * @returns ISO 8601 UTC string (format: YYYY-MM-DDTHH:mm:ss.sssZ)
 * 
 * Example:
 *   new Date() → "2025-12-25T14:30:00.000Z"
 */
export function dateToISO8601UTC(date: Date): string {
  return date.toISOString();
}

/**
 * Convert an ISO 8601 UTC string to JavaScript Date object
 * 
 * @param isoUTCString - ISO 8601 UTC string (format: YYYY-MM-DDTHH:mm:ss.sssZ or YYYY-MM-DDTHH:mm)
 * @returns JavaScript Date object (in local timezone)
 * 
 * Example:
 *   "2025-12-25T14:30:00.000Z" → Date object representing that time in local TZ
 */
export function iso8601UTCToDate(isoUTCString: string): Date {
  if (!isoUTCString) return new Date();
  
  // Handle both formats: with and without Z
  const normalizedString = isoUTCString.endsWith('Z') 
    ? isoUTCString 
    : isoUTCString + 'Z';
  
  return new Date(normalizedString);
}

/**
 * Format a UTC datetime string for display (e.g., "Dec 25, 2025 2:30 PM")
 * 
 * @param isoUTCString - ISO 8601 UTC string
 * @param locale - Locale string (default: 'en-US')
 * @returns Formatted date string in user's local timezone
 */
export function formatUTCToLocal(isoUTCString: string, locale = 'en-US'): string {
  if (!isoUTCString) return '';
  
  const date = iso8601UTCToDate(isoUTCString);
  
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format a UTC datetime string in Vietnamese locale
 * 
 * @param isoUTCString - ISO 8601 UTC string
 * @returns Formatted date string in user's local timezone (Vietnamese format)
 */
export function formatUTCToLocalVN(isoUTCString: string): string {
  return formatUTCToLocal(isoUTCString, 'vi-VN');
}

/**
 * Check if a UTC datetime is in the past (relative to current time)
 * 
 * @param isoUTCString - ISO 8601 UTC string
 * @returns true if the date is in the past, false otherwise
 */
export function isUTCDatePast(isoUTCString: string): boolean {
  if (!isoUTCString) return false;
  
  const date = iso8601UTCToDate(isoUTCString);
  return date < new Date();
}

/**
 * Check if a UTC datetime is in the future
 * 
 * @param isoUTCString - ISO 8601 UTC string
 * @returns true if the date is in the future, false otherwise
 */
export function isUTCDateFuture(isoUTCString: string): boolean {
  return !isUTCDatePast(isoUTCString) && !!isoUTCString;
}

/**
 * Get time remaining (in milliseconds) until a UTC deadline
 * 
 * @param isoUTCString - ISO 8601 UTC string representing the deadline
 * @returns Milliseconds until deadline (negative if deadline passed)
 */
export function getTimeUntilDeadline(isoUTCString: string): number {
  if (!isoUTCString) return -1;
  
  const deadline = iso8601UTCToDate(isoUTCString);
  const now = new Date();
  
  return deadline.getTime() - now.getTime();
}
