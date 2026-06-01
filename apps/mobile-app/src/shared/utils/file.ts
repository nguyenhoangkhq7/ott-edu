/**
 * Shared utility functions for handling files in mobile app.
 */

/**
 * Formats a file URL or path to display a clean filename.
 * Strips off S3/HTTP query parameters and removes the 36-character UUID prefix
 * with its trailing underscore if it exists (for backward compatibility).
 *
 * @param urlOrPath The file URL, S3 URL, or local path.
 * @param fallback The fallback name to return if parsing fails.
 * @returns The formatted filename.
 */
export function formatDisplayFileName(urlOrPath?: string, fallback: string = 'Tập tin'): string {
  if (!urlOrPath) return fallback;
  try {
    // Remove query parameters if present
    const withoutQuery = urlOrPath.split('?')[0];
    // Get the last segment of the path
    const fullName = decodeURIComponent(withoutQuery.split('/').pop() || fallback);
    
    // Regular expression to check if the filename starts with a UUID prefix followed by an underscore
    // Format: 8-4-4-4-12 hex digits, e.g. 7e1058d8-4d89-4681-849e-22f5ea66b5c3_
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i;
    
    if (uuidRegex.test(fullName)) {
      return fullName.substring(37); // Strip 36 chars UUID + 1 char underscore
    }
    
    return fullName;
  } catch {
    return fallback;
  }
}
