// Security utilities for API routes
import { URL } from 'url';

/**
 * Validates Canvas URL to prevent SSRF attacks
 * Only allows the specific DLSU Canvas URL
 */
export function validateCanvasUrl(canvasUrl: string): boolean {
  try {
    const url = new URL(canvasUrl);
    
    // Only allow HTTPS
    if (url.protocol !== 'https:') {
      return false;
    }
    
    // Only allow the specific DLSU Canvas domain
    const hostname = url.hostname.toLowerCase();
    if (hostname !== 'dlsu.instructure.com') {
      return false;
    }
    
    // Ensure the path starts with / (can be just / or any path)
    if (!url.pathname.startsWith('/')) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates course ID parameter
 */
export function validateCourseId(courseId: string): boolean {
  // Course ID should be a positive integer
  const parsed = parseInt(courseId, 10);
  return !isNaN(parsed) && parsed > 0 && courseId === parsed.toString();
}

/**
 * Validates array of course IDs
 */
export function validateCourseIds(courseIds: string[]): boolean {
  if (!Array.isArray(courseIds) || courseIds.length === 0) {
    return false;
  }
  
  // Limit to reasonable number of course IDs to prevent abuse
  if (courseIds.length > 50) {
    return false;
  }
  
  return courseIds.every(validateCourseId);
}

/**
 * Validates date string in YYYY-MM-DD format
 */
export function validateDateString(dateStr: string): boolean {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    return false;
  }
  
  const date = new Date(dateStr);
  return date instanceof Date && !isNaN(date.getTime()) && date.toISOString().startsWith(dateStr);
} 