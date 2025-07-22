import {
  Course,
  Assignment,
  ProcessedAssignment,
  Announcement,
  ProcessedAnnouncement,
  CanvasApiRequest,
  AssignmentsRequest,
  AnnouncementsRequest,
  CanvasApiError,
} from '@/types/canvas';

export class CanvasApiService {
  private async makeApiRequest<T>(
    url: string,
    accessToken: string,
    params?: Record<string, any>
  ): Promise<T> {
    const headers = {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    };

    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
    }

    const fullUrl = searchParams.toString() 
      ? `${url}?${searchParams.toString()}`
      : url;

    const response = await fetch(fullUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({})) as CanvasApiError;
      throw new Error(
        errorData.errors?.[0]?.message || 
        `Canvas API Error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  private async getPaginatedResults<T>(
    baseUrl: string,
    accessToken: string,
    params?: Record<string, any>
  ): Promise<T[]> {
    const results: T[] = [];
    let url: string | null = baseUrl;
    
    // Build initial URL with parameters
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else if (value !== undefined && value !== null) {
          searchParams.append(key, value.toString());
        }
      });
      url = `${baseUrl}?${searchParams.toString()}`;
    }

    while (url) {
      const response: Response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as CanvasApiError;
        throw new Error(
          errorData.errors?.[0]?.message || 
          `Canvas API Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      results.push(...data);

      // Parse Link header for pagination
      url = null;
      const linkHeader: string | null = response.headers.get('Link');
      if (linkHeader) {
        const links: string[] = linkHeader.split(',');
        for (const link of links) {
          if (link.includes('rel="next"')) {
            const match: RegExpMatchArray | null = link.match(/<([^>]+)>/);
            if (match) {
              url = match[1];
            }
            break;
          }
        }
      }
    }

    return results;
  }

  async getFavoriteCourses({ accessToken, canvasUrl }: CanvasApiRequest): Promise<Course[]> {
    const url = `${canvasUrl}/api/v1/users/self/favorites/courses`;
    return this.makeApiRequest<Course[]>(url, accessToken);
  }

  async getAssignments({ accessToken, canvasUrl, courseId }: AssignmentsRequest): Promise<Assignment[]> {
    const url = `${canvasUrl}/api/v1/courses/${courseId}/assignments`;
    return this.getPaginatedResults<Assignment>(url, accessToken, {
      'include[]': 'submission',
      'per_page': 100,
    });
  }

  async getAnnouncements({ accessToken, canvasUrl, courseIds }: AnnouncementsRequest): Promise<Announcement[]> {
    const url = `${canvasUrl}/api/v1/announcements`;
    const contextCodes = courseIds.map(id => `course_${id}`);
    
    return this.getPaginatedResults<Announcement>(url, accessToken, {
      'context_codes[]': contextCodes,
      'per_page': 100,
    });
  }

  processAssignment(assignment: Assignment, courseId: number): ProcessedAssignment {
    const processed: ProcessedAssignment = {
      id: assignment.id,
      name: assignment.name,
      course_id: courseId,
      due_at: assignment.due_at,
      html_url: assignment.html_url,
      points_possible: assignment.points_possible,
      submission_status: 'Not Submitted',
      assignment_group_id: assignment.assignment_group_id,
      locked_for_user: assignment.locked_for_user,
      lock_info: assignment.lock_info,
      can_submit: assignment.can_submit,
      submission_types: assignment.submission_types,
    };

    const submission = assignment.submission;
    if (submission && submission.workflow_state !== 'unsubmitted') {
      const workflowState = submission.workflow_state;
      processed.submission_status = workflowState.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
      
      if (workflowState === 'graded' && submission.score !== null) {
        processed.grade = submission.score;
      }
    }

    return processed;
  }

  processAnnouncement(announcement: Announcement): ProcessedAnnouncement {
    const courseId = parseInt(announcement.context_code.split('_')[1]);
    
    return {
      id: announcement.id,
      title: announcement.title,
      posted_at: announcement.posted_at,
      url: announcement.url,
      course_id: courseId,
    };
  }

  categorizeAssignments(assignments: ProcessedAssignment[]): {
    upcoming: ProcessedAssignment[];
    unsubmitted: ProcessedAssignment[];
  } {
    const now = new Date();
    const upcoming: ProcessedAssignment[] = [];
    const unsubmitted: ProcessedAssignment[] = [];

    assignments.forEach(assignment => {
      const isSubmitted = assignment.submission_status !== 'Not Submitted';
      const dueAtStr = assignment.due_at;

      if (!isSubmitted && dueAtStr) {
        const dueDate = new Date(dueAtStr);
        if (dueDate > now) {
          upcoming.push(assignment);
        } else {
          unsubmitted.push(assignment);
        }
      }
    });

    return { upcoming, unsubmitted };
  }
}

export const canvasApi = new CanvasApiService(); 