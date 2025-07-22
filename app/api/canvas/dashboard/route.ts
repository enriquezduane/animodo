import { NextRequest, NextResponse } from 'next/server';
import { canvasApi } from '@/lib/canvas-api';
import { CanvasApiResponse, DashboardData, ProcessedAssignment, ProcessedAnnouncement } from '@/types/canvas';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accessToken = searchParams.get('accessToken');
    const canvasUrl = searchParams.get('canvasUrl');

    if (!accessToken || !canvasUrl) {
      return NextResponse.json<CanvasApiResponse<null>>({
        data: null,
        success: false,
        error: 'Missing required parameters: accessToken and canvasUrl',
      }, { status: 400 });
    }

    // Fetch favorite courses
    const favoriteCourses = await canvasApi.getFavoriteCourses({
      accessToken,
      canvasUrl,
    });

    if (!favoriteCourses || favoriteCourses.length === 0) {
      return NextResponse.json<CanvasApiResponse<DashboardData>>({
        data: {
          report_generated_on: new Date().toISOString(),
          entities: {
            courses: {},
            assignments: {},
            announcements: {},
          },
          views: {
            upcoming_assignments: [],
            unsubmitted_assignments: [],
            assignments_by_course: {},
            announcements_by_course: {},
          },
        },
        success: true,
      });
    }

    const courseIds = favoriteCourses.map(course => course.id);

    // Initialize data structures
    const entities = {
      courses: {} as Record<number, any>,
      assignments: {} as Record<number, ProcessedAssignment>,
      announcements: {} as Record<number, ProcessedAnnouncement>,
    };

    const views = {
      upcoming_assignments: [] as number[],
      unsubmitted_assignments: [] as number[],
      assignments_by_course: {} as Record<number, number[]>,
      announcements_by_course: {} as Record<number, number[]>,
    };

    // Populate courses
    favoriteCourses.forEach(course => {
      entities.courses[course.id] = {
        id: course.id,
        name: course.name,
      };
      views.assignments_by_course[course.id] = [];
      views.announcements_by_course[course.id] = [];
    });

    // Fetch assignments for all courses concurrently
    const assignmentPromises = favoriteCourses.map(async (course) => {
      try {
        const assignments = await canvasApi.getAssignments({
          accessToken,
          canvasUrl,
          courseId: course.id,
        });

        return assignments.map(assignment => ({
          ...assignment,
          courseId: course.id,
        }));
      } catch (error) {
        console.error(`Error fetching assignments for course ${course.id}:`, error);
        return [];
      }
    });

    const allAssignmentsArrays = await Promise.all(assignmentPromises);
    const allAssignments = allAssignmentsArrays.flat();

    // Process assignments
    allAssignments.forEach(assignment => {
      const processed = canvasApi.processAssignment(assignment, assignment.courseId);
      entities.assignments[processed.id] = processed;
      views.assignments_by_course[assignment.courseId].push(processed.id);
    });

    // Categorize assignments
    const { upcoming, unsubmitted } = canvasApi.categorizeAssignments(
      Object.values(entities.assignments)
    );

    views.upcoming_assignments = upcoming.map(a => a.id);
    views.unsubmitted_assignments = unsubmitted.map(a => a.id);

    // Fetch announcements for all courses
    try {
      const announcements = await canvasApi.getAnnouncements({
        accessToken,
        canvasUrl,
        courseIds,
      });

      announcements.forEach(announcement => {
        const processed = canvasApi.processAnnouncement(announcement);
        entities.announcements[processed.id] = processed;
        views.announcements_by_course[processed.course_id].push(processed.id);
      });
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // Continue without announcements
    }

    const dashboardData: DashboardData = {
      report_generated_on: new Date().toISOString(),
      entities,
      views,
    };

    return NextResponse.json<CanvasApiResponse<DashboardData>>({
      data: dashboardData,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    return NextResponse.json<CanvasApiResponse<null>>({
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accessToken, canvasUrl } = body;

    if (!accessToken || !canvasUrl) {
      return NextResponse.json<CanvasApiResponse<null>>({
        data: null,
        success: false,
        error: 'Missing required parameters: accessToken and canvasUrl',
      }, { status: 400 });
    }

    // Reuse the GET logic by creating a new request with search params
    const url = new URL(request.url);
    url.searchParams.set('accessToken', accessToken);
    url.searchParams.set('canvasUrl', canvasUrl);

    const mockRequest = {
      nextUrl: url,
    } as NextRequest;

    return GET(mockRequest);

  } catch (error) {
    console.error('Error processing dashboard request:', error);
    
    return NextResponse.json<CanvasApiResponse<null>>({
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }, { status: 500 });
  }
} 