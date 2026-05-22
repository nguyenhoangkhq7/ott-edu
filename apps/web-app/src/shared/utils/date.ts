/**
 * Date and Timezone Utility Functions
 * Handles proper conversion between local time and UTC for assignment deadlines
 */

/**
 * Convert a local datetime string from HTML5 datetime-local input to ISO 8601 string with timezone
 * 
 * @param localDateTimeString - From <input type="datetime-local"> (format: YYYY-MM-DDTHH:mm)
 * @returns ISO 8601 string with UTC timezone (format: YYYY-MM-DDTHH:mm:ss.sssZ)
 * 
 * Example:
 *   "2025-12-25T14:30" → "2025-12-25T14:30:00.000Z" (converted to UTC based on browser timezone)
 */
export function localDateTimeToISO8601UTC(localDateTimeString: string): string {
  if (!localDateTimeString) return '';
  
  // Parse the local datetime string
  const date = new Date(localDateTimeString);
  
  // Convert to ISO string with UTC timezone
  return date.toISOString();
}

/**
 * Convert an ISO 8601 UTC string back to browser's local datetime string for display in datetime-local input
 * 
 * @param isoUTCString - ISO 8601 UTC string (format: YYYY-MM-DDTHH:mm:ss.sssZ)
 * @returns Local datetime string (format: YYYY-MM-DDTHH:mm)
 * 
 * Example:
 *   "2025-12-25T14:30:00.000Z" → "2025-12-25T14:30" (in browser's local timezone)
 */
export function iso8601UTCToLocalDateTime(isoUTCString: string): string {
  if (!isoUTCString) return '';
  
  const date = new Date(isoUTCString);
  
  // Get local date and time components
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
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
  
  const date = new Date(isoUTCString);
  
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
  
  const date = new Date(isoUTCString);
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
  
  const deadline = new Date(isoUTCString);
  const now = new Date();
  
  return deadline.getTime() - now.getTime();
}
