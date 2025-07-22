import { NextRequest, NextResponse } from 'next/server';
import { canvasApi } from '@/lib/canvas-api';
import { CanvasApiResponse, Course } from '@/types/canvas';

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

    const courses = await canvasApi.getFavoriteCourses({
      accessToken,
      canvasUrl,
    });

    return NextResponse.json<CanvasApiResponse<Course[]>>({
      data: courses,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching courses:', error);
    
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

    const courses = await canvasApi.getFavoriteCourses({
      accessToken,
      canvasUrl,
    });

    return NextResponse.json<CanvasApiResponse<Course[]>>({
      data: courses,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching courses:', error);
    
    return NextResponse.json<CanvasApiResponse<null>>({
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }, { status: 500 });
  }
} 