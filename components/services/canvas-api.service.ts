import { 
  Course, 
  Assignment, 
  Announcement, 
  User, 
  ApiError, 
  UserResponse 
} from '../types';

/**
 * Canvas API configuration
 */
interface CanvasApiConfig {
  readonly baseUrl: string;
  readonly token: string;
}

/**
 * Result type for API operations following Railway pattern
 */
export type ApiResult<T> = {
  readonly success: true;
  readonly data: T;
} | {
  readonly success: false;
  readonly error: string;
  readonly status?: number;
};

/**
 * Canvas API service following Single Responsibility Principle
 * Handles all Canvas API interactions with proper error handling
 */
export class CanvasApiService {
  private readonly config: CanvasApiConfig;

  constructor(baseUrl: string, token: string) {
    this.config = { baseUrl, token };
  }

  /**
   * Creates headers for Canvas API requests
   */
  private getHeaders(): HeadersInit {
    return {
      'Authorization': `Bearer ${this.config.token}`,
      'Canvas-URL': this.config.baseUrl,
      'Content-Type': 'application/json'
    };
  }

  /**
   * Generic API request handler with error handling
   */
  private async request<T>(endpoint: string): Promise<ApiResult<T>> {
    try {
      const response = await fetch(endpoint, {
        headers: this.getHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as ApiError;
        return {
          success: false,
          error: errorData.error || `Request failed with status ${response.status}`,
          status: response.status
        };
      }

      const data = await response.json() as T;
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network request failed'
      };
    }
  }

  /**
   * Fetch current user information
   */
  async getUserInfo(): Promise<ApiResult<User>> {
    const result = await this.request<UserResponse>('/api/user');
    if (result.success) {
      return {
        success: true,
        data: { name: result.data.name }
      };
    }
    return result;
  }

  /**
   * Fetch all courses for the current user
   */
  async getCourses(): Promise<ApiResult<readonly Course[]>> {
    return this.request<readonly Course[]>('/api/courses');
  }

  /**
   * Fetch assignments for a specific course
   */
  async getAssignments(courseId: number): Promise<ApiResult<readonly Assignment[]>> {
    return this.request<readonly Assignment[]>(`/api/assignments?courseId=${courseId}`);
  }

  /**
   * Fetch assignments for multiple courses
   */
  async getAssignmentsForCourses(courseIds: readonly number[]): Promise<ApiResult<Readonly<Record<number, readonly Assignment[]>>>> {
    try {
      const assignmentPromises = courseIds.map(async (courseId): Promise<[number, readonly Assignment[]]> => {
        const result = await this.getAssignments(courseId);
        return [courseId, result.success ? result.data : []];
      });

      const assignmentResults = await Promise.all(assignmentPromises);
      const assignmentsMap = Object.fromEntries(assignmentResults) as Readonly<Record<number, readonly Assignment[]>>;

      return {
        success: true,
        data: assignmentsMap
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch assignments'
      };
    }
  }

  /**
   * Fetch announcements for multiple courses
   */
  async getAnnouncements(courseIds: readonly number[]): Promise<ApiResult<Readonly<Record<number, readonly Announcement[]>>>> {
    try {
      const params = courseIds.map(id => `courseIds=${id}`).join('&');
      const result = await this.request<readonly Announcement[]>(`/api/announcements?${params}`);
      
      if (!result.success) {
        return result;
      }

      // Group announcements by course using context_code
      const announcementsMap: Record<number, Announcement[]> = {};
      for (const announcement of result.data) {
        const courseId = parseInt(announcement.context_code.replace('course_', ''));
        if (!announcementsMap[courseId]) {
          announcementsMap[courseId] = [];
        }
        announcementsMap[courseId].push(announcement);
      }

      return {
        success: true,
        data: announcementsMap as Readonly<Record<number, readonly Announcement[]>>
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch announcements'
      };
    }
  }

  /**
   * Validate the current token by attempting to fetch user info
   */
  async validateToken(): Promise<ApiResult<boolean>> {
    const result = await this.getUserInfo();
    return {
      success: result.success,
      data: result.success,
      ...(result.success ? {} : { error: result.error, status: result.status })
    } as ApiResult<boolean>;
  }
}

/**
 * Factory function to create Canvas API service instance
 */
export const createCanvasApiService = (baseUrl: string, token: string): CanvasApiService => {
  return new CanvasApiService(baseUrl, token);
}; 