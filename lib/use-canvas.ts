import { useState, useCallback } from 'react';
import { 
  CanvasApiResponse, 
  Course, 
  ProcessedAssignment, 
  ProcessedAnnouncement, 
  DashboardData 
} from '@/types/canvas';

interface UseCanvasConfig {
  accessToken: string;
  canvasUrl: string;
}

interface UseCanvasReturn {
  // State
  loading: boolean;
  error: string | null;
  
  // Data fetching methods
  getCourses: () => Promise<Course[] | null>;
  getAssignments: (courseId: number) => Promise<ProcessedAssignment[] | null>;
  getAnnouncements: (courseIds: number[]) => Promise<ProcessedAnnouncement[] | null>;
  getDashboardData: () => Promise<DashboardData | null>;
  
  // Utility methods
  clearError: () => void;
}

export function useCanvas(config: UseCanvasConfig): UseCanvasReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { accessToken, canvasUrl } = config;

  const makeRequest = useCallback(async <T>(
    endpoint: string,
    additionalData?: Record<string, any>
  ): Promise<T | null> => {
    if (!accessToken || !canvasUrl) {
      setError('Access token and Canvas URL are required');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          canvasUrl,
          ...additionalData,
        }),
      });

      const data: CanvasApiResponse<T> = await response.json();

      if (!data.success) {
        setError(data.error || 'An error occurred');
        return null;
      }

      return data.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Network error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [accessToken, canvasUrl]);

  const getCourses = useCallback(async (): Promise<Course[] | null> => {
    return makeRequest<Course[]>('/api/canvas/courses');
  }, [makeRequest]);

  const getAssignments = useCallback(async (courseId: number): Promise<ProcessedAssignment[] | null> => {
    return makeRequest<ProcessedAssignment[]>('/api/canvas/assignments', { courseId });
  }, [makeRequest]);

  const getAnnouncements = useCallback(async (courseIds: number[]): Promise<ProcessedAnnouncement[] | null> => {
    return makeRequest<ProcessedAnnouncement[]>('/api/canvas/announcements', { courseIds });
  }, [makeRequest]);

  const getDashboardData = useCallback(async (): Promise<DashboardData | null> => {
    return makeRequest<DashboardData>('/api/canvas/dashboard');
  }, [makeRequest]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    getCourses,
    getAssignments,
    getAnnouncements,
    getDashboardData,
    clearError,
  };
}

// Utility functions for working with dashboard data
export const dashboardUtils = {
  // Get upcoming assignments from dashboard data
  getUpcomingAssignments: (dashboardData: DashboardData): ProcessedAssignment[] => {
    return dashboardData.views.upcoming_assignments.map(
      id => dashboardData.entities.assignments[id]
    ).filter(Boolean);
  },

  // Get unsubmitted assignments from dashboard data
  getUnsubmittedAssignments: (dashboardData: DashboardData): ProcessedAssignment[] => {
    return dashboardData.views.unsubmitted_assignments.map(
      id => dashboardData.entities.assignments[id]
    ).filter(Boolean);
  },

  // Get assignments for a specific course
  getCourseAssignments: (dashboardData: DashboardData, courseId: number): ProcessedAssignment[] => {
    const assignmentIds = dashboardData.views.assignments_by_course[courseId] || [];
    return assignmentIds.map(id => dashboardData.entities.assignments[id]).filter(Boolean);
  },

  // Get announcements for a specific course
  getCourseAnnouncements: (dashboardData: DashboardData, courseId: number): ProcessedAnnouncement[] => {
    const announcementIds = dashboardData.views.announcements_by_course[courseId] || [];
    return announcementIds.map(id => dashboardData.entities.announcements[id]).filter(Boolean);
  },

  // Get course by ID
  getCourse: (dashboardData: DashboardData, courseId: number) => {
    return dashboardData.entities.courses[courseId];
  },

  // Get all courses as array
  getAllCourses: (dashboardData: DashboardData) => {
    return Object.values(dashboardData.entities.courses);
  },

  // Get assignment counts by course
  getAssignmentCounts: (dashboardData: DashboardData) => {
    const counts: Record<number, { total: number; upcoming: number; unsubmitted: number }> = {};
    
    Object.keys(dashboardData.entities.courses).forEach(courseIdStr => {
      const courseId = parseInt(courseIdStr);
      const allAssignments = dashboardUtils.getCourseAssignments(dashboardData, courseId);
      const upcomingIds = new Set(dashboardData.views.upcoming_assignments);
      const unsubmittedIds = new Set(dashboardData.views.unsubmitted_assignments);
      
      counts[courseId] = {
        total: allAssignments.length,
        upcoming: allAssignments.filter(a => upcomingIds.has(a.id)).length,
        unsubmitted: allAssignments.filter(a => unsubmittedIds.has(a.id)).length,
      };
    });
    
    return counts;
  },
}; 