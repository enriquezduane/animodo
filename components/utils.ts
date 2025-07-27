/**
 * Standardizes course names to the format: COURSECODE - SECTION
 * 
 * Handles multiple formats:
 * 1. Original Canvas format: [1221_NSTP101_S25E] - NATIONAL SERVICE TRAINING PROGRAM- GENERAL ORIENTATION
 * 2. Already standardized format: NSTP101 - S25E
 * 3. Natural language course names: CCS Animoment Consent Form (left unchanged)
 * 4. Simple course codes: MATH101
 * 
 * @param courseName - The course name to standardize
 * @returns Standardized course code or original name for natural language courses
 */
export const getCourseCode = (courseName: string): string => {
    // First try to match the original Canvas format: [XXXX_COURSECODE_SECTION] - FULL NAME
    const canvasFormatMatch = courseName.match(/^\[(\d+)_([A-Z]+\d*)_([A-Z0-9]+)\]\s*-\s*(.*)$/);
    
    if (canvasFormatMatch) {
        const [, , courseCode, section] = canvasFormatMatch;
        return `${courseCode} - ${section}`;
    }
    
    // Check if it's already in the preferred format: COURSECODE - SECTION
    const standardizedFormatMatch = courseName.match(/^([A-Z]+\d*)\s*-\s*([A-Z0-9]+)$/);
    
    if (standardizedFormatMatch) {
        const [, courseCode, section] = standardizedFormatMatch;
        return `${courseCode} - ${section}`;
    }
    
    // Check if it's a natural language course name (descriptive phrases with multiple words)
    // These should be left unchanged
    const words = courseName.trim().split(/\s+/);
    const isLikelyNaturalLanguage = words.length >= 3 || 
        (words.length >= 2 && !courseName.match(/^[A-Z]+\d+$/)) ||
        courseName.toLowerCase().includes('form') ||
        courseName.toLowerCase().includes('handbook') ||
        courseName.toLowerCase().includes('lounge') ||
        courseName.toLowerCase().includes('orientation') ||
        courseName.toLowerCase().includes('training') ||
        courseName.toLowerCase().includes('program') ||
        courseName.toLowerCase().includes('service') ||
        courseName.toLowerCase().includes('consent') ||
        courseName.toLowerCase().includes('student');
    
    if (isLikelyNaturalLanguage) {
        return courseName;
    }
    
    // Fallback to the original logic for simple course codes
    const fallbackMatch = courseName.match(/^([A-Z]+\d+)/);
    return fallbackMatch ? fallbackMatch[1] : courseName.split(' ')[0];
}; 