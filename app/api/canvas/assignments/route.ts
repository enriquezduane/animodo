import { NextRequest, NextResponse } from 'next/server';
import { canvasApi } from '@/lib/canvas-api';
import { CanvasApiResponse, ProcessedAssignment } from '@/types/canvas';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accessToken = searchParams.get('accessToken');
    const canvasUrl = searchParams.get('canvasUrl');
    const courseIdParam = searchParams.get('courseId');

    if (!accessToken || !canvasUrl || !courseIdParam) {
      return NextResponse.json<CanvasApiResponse<null>>({
        data: null,
        success: false,
        error: 'Missing required parameters: accessToken, canvasUrl, and courseId',
      }, { status: 400 });
    }

    const courseId = parseInt(courseIdParam);
    if (isNaN(courseId)) {
      return NextResponse.json<CanvasApiResponse<null>>({
        data: null,
        success: false,
        error: 'Invalid courseId: must be a number',
      }, { status: 400 });
    }

    const assignments = await canvasApi.getAssignments({
      accessToken,
      canvasUrl,
      courseId,
    });

    const processedAssignments = assignments.map(assignment =>
      canvasApi.processAssignment(assignment, courseId)
    );

    return NextResponse.json<CanvasApiResponse<ProcessedAssignment[]>>({
      data: processedAssignments,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching assignments:', error);
    
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
    const { accessToken, canvasUrl, courseId } = body;

    if (!accessToken || !canvasUrl || !courseId) {
      return NextResponse.json<CanvasApiResponse<null>>({
        data: null,
        success: false,
        error: 'Missing required parameters: accessToken, canvasUrl, and courseId',
      }, { status: 400 });
    }

    const assignments = await canvasApi.getAssignments({
      accessToken,
      canvasUrl,
      courseId: parseInt(courseId),
    });

    const processedAssignments = assignments.map(assignment =>
      canvasApi.processAssignment(assignment, courseId)
    );

    return NextResponse.json<CanvasApiResponse<ProcessedAssignment[]>>({
      data: processedAssignments,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching assignments:', error);
    
    return NextResponse.json<CanvasApiResponse<null>>({
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }, { status: 500 });
  }
} 