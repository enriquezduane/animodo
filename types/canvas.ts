// Canvas API Types
export interface Course {
  id: number;
  name: string;
  course_code?: string;
  uuid?: string;
}

export interface LockInfo {
  asset_string?: string;
  unlock_at?: string;
  lock_at?: string;
  context_module?: string;
  manually_locked?: boolean;
}

export interface Assignment {
  id: number;
  name: string;
  course_id: number;
  due_at: string | null;
  html_url: string;
  points_possible: number | null;
  assignment_group_id: number;
  locked_for_user: boolean;
  lock_info: LockInfo | null;
  can_submit: boolean;
  submission_types: string[];
  submission?: Submission;
}

export interface ProcessedAssignment {
  id: number;
  name: string;
  course_id: number;
  due_at: string | null;
  html_url: string;
  points_possible: number | null;
  submission_status: string;
  assignment_group_id: number;
  locked_for_user: boolean;
  lock_info: LockInfo | null;
  can_submit: boolean;
  submission_types: string[];
  grade?: number;
}

export interface Submission {
  id: number;
  user_id: number;
  assignment_id: number;
  workflow_state: 'submitted' | 'unsubmitted' | 'graded' | 'pending_review';
  score: number | null;
  grade: string | null;
  submitted_at: string | null;
  graded_at: string | null;
}

export interface Announcement {
  id: number;
  title: string;
  message: string;
  posted_at: string | null;
  url: string;
  context_code: string;
  author: {
    display_name: string;
    avatar_image_url: string;
  };
}

export interface ProcessedAnnouncement {
  id: number;
  title: string;
  posted_at: string | null;
  url: string;
  course_id: number;
}

// API Response Types
export interface CanvasApiResponse<T> {
  data: T;
  success: boolean;
  error?: string;
}

export interface DashboardData {
  report_generated_on: string;
  entities: {
    courses: Record<number, Course>;
    assignments: Record<number, ProcessedAssignment>;
    announcements: Record<number, ProcessedAnnouncement>;
  };
  views: {
    upcoming_assignments: number[];
    unsubmitted_assignments: number[];
    assignments_by_course: Record<number, number[]>;
    announcements_by_course: Record<number, number[]>;
  };
}

// Request Types
export interface CanvasApiRequest {
  accessToken: string;
  canvasUrl: string;
}

export interface AssignmentsRequest extends CanvasApiRequest {
  courseId: number;
}

export interface AnnouncementsRequest extends CanvasApiRequest {
  courseIds: number[];
}

// Canvas API Error Types
export interface CanvasApiError {
  errors: Array<{
    message: string;
    error_code?: string;
  }>;
} 