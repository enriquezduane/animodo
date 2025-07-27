// Re-export utilities from new formatter modules for backward compatibility
import { CourseFormatter } from './utils/formatters';
export { CourseFormatter };

/**
 * @deprecated Use CourseFormatter.getCourseCode instead
 * This export is maintained for backward compatibility
 */
export const getCourseCode = CourseFormatter.getCourseCode; 