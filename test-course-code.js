// Test file to verify getCourseCode function
const getCourseCode = (courseName) => {
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

// Test with the user's examples
console.log('=== Testing Course Code Standardization ===');

// Original Canvas format examples
const test1 = '[1221_NSTP101_S25E] - NATIONAL SERVICE TRAINING PROGRAM- GENERAL ORIENTATION';
const test2 = '[1243_LASARE3_V24] - LASALLIAN RECOLLECTION';
const test3 = '[1243_EMPATHY_S15] - EMPATHIC COMPUTING IN HUMAN-SYSTEM INTERACTION';

console.log('Original Canvas Format:');
console.log(`Input:  ${test1}`);
console.log(`Output: ${getCourseCode(test1)}`);
console.log();

console.log(`Input:  ${test2}`);
console.log(`Output: ${getCourseCode(test2)}`);
console.log();

console.log(`Input:  ${test3}`);
console.log(`Output: ${getCourseCode(test3)}`);
console.log();

// Already standardized format examples (user's preferred)
const test4 = 'NSTP101 - S25E';
const test5 = 'LASARE3 - V24';
const test6 = 'EMPATHY - S15';

console.log('Already Standardized Format:');
console.log(`Input:  ${test4}`);
console.log(`Output: ${getCourseCode(test4)}`);
console.log();

console.log(`Input:  ${test5}`);
console.log(`Output: ${getCourseCode(test5)}`);
console.log();

console.log(`Input:  ${test6}`);
console.log(`Output: ${getCourseCode(test6)}`);
console.log();

// Test natural language course names (should be left unchanged)
const test7 = 'CCS Animoment Consent Form';
const test8 = 'CCS Animospace Student Lounge';
const test9 = 'CCS Student Handbook';

console.log('Natural Language Course Names (should remain unchanged):');
console.log(`Input:  ${test7}`);
console.log(`Output: ${getCourseCode(test7)}`);
console.log();

console.log(`Input:  ${test8}`);
console.log(`Output: ${getCourseCode(test8)}`);
console.log();

console.log(`Input:  ${test9}`);
console.log(`Output: ${getCourseCode(test9)}`);
console.log();

// Test some edge cases
const test10 = 'MATH101 - Advanced Mathematics';
const test11 = 'CS200';
const test12 = 'Introduction to Programming';
const test13 = 'Data Structures and Algorithms';

console.log('Edge Cases:');
console.log(`Input:  ${test10}`);
console.log(`Output: ${getCourseCode(test10)}`);
console.log();

console.log(`Input:  ${test11}`);
console.log(`Output: ${getCourseCode(test11)}`);
console.log();

console.log(`Input:  ${test12}`);
console.log(`Output: ${getCourseCode(test12)}`);
console.log();

console.log(`Input:  ${test13}`);
console.log(`Output: ${getCourseCode(test13)}`); 