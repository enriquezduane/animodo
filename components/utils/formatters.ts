import { Assignment, SubmissionStatus, AssignmentUrgencyLevel } from '../types';

/**
 * Date formatting utilities following Single Responsibility Principle
 */
export class DateFormatter {
  /**
   * Format a date string for display
   */
  static formatDate(dateString: string | null): string {
    if (!dateString) return 'No due date';
    return new Date(dateString).toLocaleDateString();
  }

  /**
   * Get time remaining until a due date in human-readable format
   */
  static getTimeRemaining(dueDateString: string | null): string {
    if (!dueDateString) return '';
    
    const now = new Date();
    const dueDate = new Date(dueDateString);
    const timeDiff = dueDate.getTime() - now.getTime();
    const absoluteDiff = Math.abs(timeDiff);
    
    const days = Math.floor(absoluteDiff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days}d`;
    
    const hours = Math.floor((absoluteDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (hours > 0) return `${hours}h`;
    
    const minutes = Math.floor((absoluteDiff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m`;
  }

  /**
   * Get time elapsed since a posted date in human-readable format
   */
  static getTimeAgo(postedDateString: string): string {
    const now = new Date();
    const postedDate = new Date(postedDateString);
    const timeDiff = now.getTime() - postedDate.getTime();
    
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    if (days > 0) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (hours > 0) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  /**
   * Format announcement date based on age
   */
  static formatAnnouncementDate(postedDateString: string): string {
    const now = new Date();
    const postedDate = new Date(postedDateString);
    const daysAgo = (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysAgo < 1) {
      return this.getTimeAgo(postedDateString);
    }
    return this.formatDate(postedDateString);
  }
}

/**
 * Assignment status and priority utilities
 */
export class AssignmentFormatter {
  /**
   * Get the submission status of an assignment
   */
  static getSubmissionStatus(assignment: Assignment): SubmissionStatus {
    if (assignment.has_submitted_submissions && !assignment.submission) {
      return SubmissionStatus.GROUP_SUBMITTED;
    }
    
    if (!assignment.submission) {
      return SubmissionStatus.UNSUBMITTED;
    }
    
    const { workflow_state, score } = assignment.submission;
    
    if (workflow_state === 'graded' && score !== null) {
      return SubmissionStatus.GRADED;
    }
    
    if (workflow_state === 'submitted') {
      return SubmissionStatus.SUBMITTED;
    }
    
    if (workflow_state === 'pending_review') {
      return SubmissionStatus.PENDING_REVIEW;
    }
    
    return SubmissionStatus.UNSUBMITTED;
  }

  /**
   * Get display label for submission status
   */
  static getStatusLabel(status: SubmissionStatus): string {
    switch (status) {
      case SubmissionStatus.UNSUBMITTED:
        return 'Unsubmitted';
      case SubmissionStatus.SUBMITTED:
        return 'Submitted';
      case SubmissionStatus.PENDING_REVIEW:
        return 'Pending Review';
      case SubmissionStatus.GRADED:
        return 'Graded';
      case SubmissionStatus.GROUP_SUBMITTED:
        return 'Group Submitted';
      default:
        return 'Unknown';
    }
  }

  /**
   * Determine if an assignment requires action
   */
  static isActionableStatus(assignment: Assignment): boolean {
    const status = this.getSubmissionStatus(assignment);
    return status === SubmissionStatus.UNSUBMITTED;
  }

  /**
   * Get status priority for sorting (lower number = higher priority)
   */
  static getStatusPriority(assignment: Assignment): number {
    const status = this.getSubmissionStatus(assignment);
    switch (status) {
      case SubmissionStatus.UNSUBMITTED:
        return 1;
      case SubmissionStatus.PENDING_REVIEW:
        return 2;
      case SubmissionStatus.SUBMITTED:
      case SubmissionStatus.GROUP_SUBMITTED:
        return 3;
      case SubmissionStatus.GRADED:
        return 4;
      default:
        return 5;
    }
  }

  /**
   * Get urgency level of an assignment
   */
  static getUrgencyLevel(assignment: Assignment): AssignmentUrgencyLevel {
    if (!assignment.due_at) {
      return AssignmentUrgencyLevel.LOW_PRIORITY;
    }

    const now = new Date();
    const dueDate = new Date(assignment.due_at);
    const timeDiff = dueDate.getTime() - now.getTime();
    const hoursUntilDue = timeDiff / (1000 * 60 * 60);

    if (timeDiff < 0) {
      return AssignmentUrgencyLevel.OVERDUE;
    }
    
    if (hoursUntilDue < 24) {
      return AssignmentUrgencyLevel.ALMOST_DUE;
    }
    
    return AssignmentUrgencyLevel.DUE_SOON;
  }

  /**
   * Get color associated with assignment status
   */
  static getStatusColor(assignment: Assignment): string {
    const status = this.getSubmissionStatus(assignment);
    
    if (status === SubmissionStatus.UNSUBMITTED) {
      const urgency = this.getUrgencyLevel(assignment);
      switch (urgency) {
        case AssignmentUrgencyLevel.OVERDUE:
          return '#dc3545'; // Red
        case AssignmentUrgencyLevel.ALMOST_DUE:
          return '#fd7e14'; // Orange
        case AssignmentUrgencyLevel.DUE_SOON:
          return '#ffc107'; // Yellow
        case AssignmentUrgencyLevel.LOW_PRIORITY:
          return '#6c757d'; // Gray
        default:
          return '#6c757d';
      }
    }
    
    switch (status) {
      case SubmissionStatus.SUBMITTED:
        return '#28a745'; // Green
      case SubmissionStatus.PENDING_REVIEW:
        return '#17a2b8'; // Blue
      case SubmissionStatus.GRADED:
        return '#6f42c1'; // Purple
      case SubmissionStatus.GROUP_SUBMITTED:
        return '#20c997'; // Teal
      default:
        return '#6c757d'; // Gray
    }
  }

  /**
   * Get combined status label with urgency information
   */
  static getCombinedStatusLabel(assignment: Assignment): string {
    const status = this.getSubmissionStatus(assignment);
    
    if (status === SubmissionStatus.UNSUBMITTED) {
      if (!assignment.due_at) {
        return 'Low Priority';
      }
      
      const now = new Date();
      const dueDate = new Date(assignment.due_at);
      const timeDiff = dueDate.getTime() - now.getTime();
      const hoursLeft = timeDiff / (1000 * 60 * 60);
      
      if (timeDiff < 0) {
        // Overdue
        const overdueDays = Math.floor(Math.abs(timeDiff) / (1000 * 60 * 60 * 24));
        const overdueHours = Math.floor((Math.abs(timeDiff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        
        if (overdueDays > 0) {
          return `OVERDUE (by ${overdueDays} ${overdueDays === 1 ? 'day' : 'days'})!`;
        } else if (overdueHours > 0) {
          return `OVERDUE (by ${overdueHours} ${overdueHours === 1 ? 'hr' : 'hrs'})!`;
        } else {
          const overdueMinutes = Math.floor((Math.abs(timeDiff) % (1000 * 60 * 60)) / (1000 * 60));
          return `OVERDUE (by ${overdueMinutes} ${overdueMinutes === 1 ? 'min' : 'mins'})!`;
        }
      }
      
      if (hoursLeft < 24) {
        const hours = Math.floor(hoursLeft);
        const minutes = Math.floor((hoursLeft % 1) * 60);
        if (hours > 0) {
          return `ALMOST DUE (due in ${hours} ${hours === 1 ? 'hr' : 'hrs'})`;
        } else {
          return `ALMOST DUE (due in ${minutes} ${minutes === 1 ? 'min' : 'mins'})`;
        }
      }
      
      const days = Math.floor(hoursLeft / 24);
      return `DUE SOON (due in ${days} ${days === 1 ? 'day' : 'days'})`;
    }
    
    return this.getStatusLabel(status);
  }
}

/**
 * Course name formatting utilities
 */
export class CourseFormatter {
  /**
   * Standardizes course names to the format: COURSECODE - SECTION
   * 
   * Handles multiple formats:
   * 1. Original Canvas format: [1221_NSTP101_S25E] - NATIONAL SERVICE TRAINING PROGRAM- GENERAL ORIENTATION
   * 2. Already standardized format: NSTP101 - S25E
   * 3. Natural language course names: CCS Animoment Consent Form (left unchanged)
   * 4. Simple course codes: MATH101
   */
  static getCourseCode(courseName: string): string {
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
  }
} 