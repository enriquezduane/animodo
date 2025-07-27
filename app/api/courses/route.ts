import { NextRequest, NextResponse } from 'next/server';
import { Course, ApiError } from '../../../components/types';
import { extractCanvasConfig, fetchFromCanvas, createErrorResponse, ApiResult } from '../shared/canvas-api.utils';

/**
 * Fetch courses from Canvas API
 */
async function fetchCanvasCourses(config: any): Promise<ApiResult<readonly Course[]>> {
  const result = await fetchFromCanvas<any[]>(config, '/api/v1/users/self/favorites/courses', 'fetch courses from Canvas');
  
  if (!result.success) {
    return result;
  }
  
  // Validate and transform the data
  if (!Array.isArray(result.data)) {
    return {
      success: false,
      error: 'Invalid courses data received from Canvas',
      status: 502
    };
  }

  const courses: Course[] = result.data
    .filter(course => course?.id && course?.name) // Filter out invalid entries
    .map(course => ({
      id: course.id,
      name: course.name
    }));

  return {
    success: true,
    data: courses
  };
}

/**
 * GET /api/courses
 * Fetches all active courses for the current user from Canvas
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract and validate Canvas API configuration
    const configResult = extractCanvasConfig(request);
    if (!configResult.success) {
      return NextResponse.json(createErrorResponse(configResult.error), { status: configResult.status });
    }

    // Fetch courses from Canvas
    const coursesResult = await fetchCanvasCourses(configResult.data);
    if (!coursesResult.success) {
      return NextResponse.json(createErrorResponse(coursesResult.error), { status: coursesResult.status });
    }

    return NextResponse.json(coursesResult.data, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in courses API route:', error);
    return NextResponse.json(createErrorResponse('Internal server error'), { status: 500 });
  }
}
