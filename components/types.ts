// Domain enums for type safety and consistency
export enum SubmissionStatus {
  UNSUBMITTED = 'unsubmitted',
  SUBMITTED = 'submitted',
  PENDING_REVIEW = 'pending_review',
  GRADED = 'graded',
  GROUP_SUBMITTED = 'group_submitted'
}

export enum AssignmentUrgencyLevel {
  OVERDUE = 'overdue',
  ALMOST_DUE = 'almost_due',
  DUE_SOON = 'due_soon',
  LOW_PRIORITY = 'low_priority'
}

export enum DashboardSection {
  OVERVIEW = 'overview',
  ASSIGNMENTS = 'assignments',
  ANNOUNCEMENTS = 'announcements'
}

// Core domain types
export interface Course {
  readonly id: number;
  readonly name: string;
}

export interface Assignment {
  readonly id: number;
  readonly name: string;
  readonly due_at: string | null;
  readonly html_url: string;
  readonly assignment_group_id: number;
  readonly has_submitted_submissions: boolean;
  readonly submission?: Submission;
}

export interface Submission {
  readonly workflow_state: string;
  readonly score: number | null;
}

export interface Announcement {
  readonly id: number;
  readonly title: string;
  readonly posted_at: string;
  readonly url: string;
  readonly context_code: string;
}

// Composite types for UI components
export interface CourseWithAssignments extends Course {
  readonly assignments: readonly Assignment[];
}

export interface CourseWithAnnouncements extends Course {
  readonly announcements: readonly Announcement[];
}

export interface AssignmentWithCourse extends Assignment {
  readonly courseId: number;
}

export interface AnnouncementWithCourse extends Announcement {
  readonly courseId: number;
}

// UI-specific interfaces
export interface User {
  readonly name: string;
}

export interface DashboardState {
  readonly courses: readonly Course[];
  readonly assignments: Readonly<Record<number, readonly Assignment[]>>;
  readonly announcements: Readonly<Record<number, readonly Announcement[]>>;
  readonly loading: boolean;
  readonly error: string | null;
  readonly userName: string | null;
}

// Component prop interfaces
export interface SidebarProps {
  readonly userName: string | null;
  readonly currentSection: DashboardSection;
  readonly isRefreshing: boolean;
  readonly onLogout: () => void;
  readonly onSectionChange: (section: DashboardSection) => void;
  readonly onRefresh: () => void;
}

export interface OverviewProps {
  readonly courses: readonly Course[];
  readonly urgentAssignments: readonly AssignmentWithCourse[];
  readonly recentAnnouncements: readonly AnnouncementWithCourse[];
}

export interface AssignmentsProps {
  readonly coursesWithAssignments: readonly CourseWithAssignments[];
  readonly courses: readonly Course[];
  readonly expandedCourses: ReadonlySet<number>;
  readonly showOverdueAssignments: boolean;
  readonly showNoDueDates: boolean;
  readonly onToggleCourse: (courseId: number) => void;
  readonly onToggleOverdue: () => void;
  readonly onToggleNoDueDates: () => void;
}

export interface AnnouncementsProps {
  readonly coursesWithAnnouncements: readonly CourseWithAnnouncements[];
  readonly courses: readonly Course[];
  readonly expandedCourses: ReadonlySet<number>;
  readonly showOldAnnouncements: boolean;
  readonly onToggleCourse: (courseId: number) => void;
  readonly onToggleOldAnnouncements: () => void;
}

// Filter and preference types
export interface AssignmentFilters {
  readonly statuses: ReadonlySet<SubmissionStatus>;
  readonly courses: ReadonlySet<number>;
  readonly showOverdue: boolean;
  readonly showNoDueDates: boolean;
  readonly showIgnored: boolean;
}

export interface AnnouncementFilters {
  readonly courses: ReadonlySet<number>;
  readonly showOldAnnouncements: boolean;
}

// API response types
export interface ApiError {
  readonly error: string;
}

export interface UserResponse {
  readonly name: string;
}

// Storage-related types
export interface StorageKeys {
  readonly CANVAS_TOKEN: 'canvas_token';
  readonly IGNORED_ASSIGNMENTS: 'ignored_assignments';
  readonly ASSIGNMENT_STATUS_FILTERS: 'assignment_status_filters';
  readonly SELECTED_COURSES: 'selected_courses';
  readonly SELECT_ALL_COURSES: 'select_all_courses';
  readonly ANNOUNCEMENT_SELECTED_COURSES: 'announcement_selected_courses';
  readonly ANNOUNCEMENT_SELECT_ALL_COURSES: 'announcement_select_all_courses';
}

export const STORAGE_KEYS: StorageKeys = {
  CANVAS_TOKEN: 'canvas_token',
  IGNORED_ASSIGNMENTS: 'ignored_assignments',
  ASSIGNMENT_STATUS_FILTERS: 'assignment_status_filters',
  SELECTED_COURSES: 'selected_courses',
  SELECT_ALL_COURSES: 'select_all_courses',
  ANNOUNCEMENT_SELECTED_COURSES: 'announcement_selected_courses',
  ANNOUNCEMENT_SELECT_ALL_COURSES: 'announcement_select_all_courses'
} as const; 