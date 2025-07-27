import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Course, 
  Assignment, 
  Announcement, 
  DashboardState,
  AssignmentWithCourse,
  AnnouncementWithCourse,
  CourseWithAssignments,
  CourseWithAnnouncements
} from '../types';
import { createCanvasApiService } from '../services/canvas-api.service';
import { storageService } from '../services/storage.service';
import { AssignmentFormatter } from '../utils/formatters';

/**
 * Custom hook for managing dashboard data state and operations
 * Follows Single Responsibility Principle by separating data concerns
 */
export const useDashboardData = () => {
  const router = useRouter();
  const [state, setState] = useState<DashboardState>({
    courses: [],
    assignments: {},
    announcements: {},
    loading: true,
    error: null,
    userName: null
  });
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Fetch all dashboard data from Canvas API
   */
  const fetchData = useCallback(async () => {
    const token = storageService.getCanvasToken();
    if (!token) {
      router.push('/');
      return;
    }

    const apiService = createCanvasApiService('https://dlsu.instructure.com', token);

    try {
      // Validate token and fetch user info
      const userResult = await apiService.getUserInfo();
      if (!userResult.success) {
        if (userResult.status === 401) {
          storageService.removeCanvasToken();
          router.push('/');
          return;
        }
        throw new Error(userResult.error);
      }

      // Fetch courses
      const coursesResult = await apiService.getCourses();
      if (!coursesResult.success) {
        throw new Error(coursesResult.error);
      }

      const courseIds = coursesResult.data.map(course => course.id);

      // Fetch assignments and announcements in parallel
      const [assignmentsResult, announcementsResult] = await Promise.all([
        apiService.getAssignmentsForCourses(courseIds),
        apiService.getAnnouncements(courseIds)
      ]);

      setState(prevState => ({
        ...prevState,
        courses: coursesResult.data,
        assignments: assignmentsResult.success ? assignmentsResult.data : {},
        announcements: announcementsResult.success ? announcementsResult.data : {},
        userName: userResult.data.name,
        loading: false,
        error: null
      }));

    } catch (error) {
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load dashboard data'
      }));
      console.error('Dashboard data fetch error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [router]);

  /**
   * Refresh dashboard data
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setState(prevState => ({ ...prevState, error: null }));
    await fetchData();
  }, [fetchData]);

  /**
   * Handle user logout
   */
  const handleLogout = useCallback(() => {
    storageService.removeCanvasToken();
    router.push('/');
  }, [router]);

  /**
   * Get urgent assignments for overview
   */
  const getUrgentAssignments = useCallback((): readonly AssignmentWithCourse[] => {
    const allAssignments: AssignmentWithCourse[] = [];
    
    Object.entries(state.assignments).forEach(([courseId, courseAssignments]) => {
      courseAssignments.forEach(assignment => {
        allAssignments.push({ ...assignment, courseId: parseInt(courseId) });
      });
    });

    const now = new Date();
    const maxDaysOut = 100;
    const maxDaysOverdue = 10;
    
    return allAssignments
      .filter(assignment => {
        if (!AssignmentFormatter.isActionableStatus(assignment)) return false;
        if (!assignment.due_at) return false;
        
        const dueDate = new Date(assignment.due_at);
        const daysFromNow = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        
        if (daysFromNow < -maxDaysOverdue) return false;
        return daysFromNow <= maxDaysOut;
      })
      .sort((a, b) => {
        const dateA = new Date(a.due_at!).getTime();
        const dateB = new Date(b.due_at!).getTime();
        return dateA - dateB;
      })
      .slice(0, 15);
  }, [state.assignments]);

  /**
   * Get recent announcements for overview
   */
  const getRecentAnnouncements = useCallback((): readonly AnnouncementWithCourse[] => {
    const allAnnouncements: AnnouncementWithCourse[] = [];
    
    Object.entries(state.announcements).forEach(([courseId, courseAnnouncements]) => {
      courseAnnouncements.forEach(announcement => {
        allAnnouncements.push({ ...announcement, courseId: parseInt(courseId) });
      });
    });

    const now = new Date();
    const maxDaysBack = 30;
    
    return allAnnouncements
      .filter(announcement => {
        const postedDate = new Date(announcement.posted_at);
        const daysAgo = (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= maxDaysBack;
      })
      .sort((a, b) => {
        const dateA = new Date(a.posted_at).getTime();
        const dateB = new Date(b.posted_at).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [state.announcements]);

  /**
   * Get courses with assignments for assignments page
   */
  const getCoursesWithAssignments = useCallback((): readonly CourseWithAssignments[] => {
    return state.courses.map(course => ({
      ...course,
      assignments: (state.assignments[course.id] || []).slice().sort((a, b) => {
        if (!a.due_at && !b.due_at) return 0;
        if (!a.due_at) return 1;
        if (!b.due_at) return -1;
        
        const dateComparison = new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
        if (dateComparison !== 0) return dateComparison;
        
        return AssignmentFormatter.getStatusPriority(a) - AssignmentFormatter.getStatusPriority(b);
      })
    }));
  }, [state.courses, state.assignments]);

  /**
   * Get courses with announcements for announcements page
   */
  const getCoursesWithAnnouncements = useCallback((showOldAnnouncements: boolean): readonly CourseWithAnnouncements[] => {
    return state.courses.map(course => ({
      ...course,
      announcements: (state.announcements[course.id] || [])
        .filter(announcement => {
          if (showOldAnnouncements) {
            return true;
          } else {
            const postedDate = new Date(announcement.posted_at);
            const daysAgo = (new Date().getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
            return daysAgo <= 20;
          }
        })
        .slice()
        .sort((a, b) => {
          return new Date(b.posted_at).getTime() - new Date(a.posted_at).getTime();
        })
    }));
  }, [state.courses, state.announcements]);

  // Initialize data fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    ...state,
    isRefreshing,
    handleRefresh,
    handleLogout,
    getUrgentAssignments,
    getRecentAnnouncements,
    getCoursesWithAssignments,
    getCoursesWithAnnouncements
  };
}; 