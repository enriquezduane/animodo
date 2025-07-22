import { NextRequest, NextResponse } from 'next/server';
import { canvasApi } from '@/lib/canvas-api';
import { CanvasApiResponse, ProcessedAnnouncement } from '@/types/canvas';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accessToken = searchParams.get('accessToken');
    const canvasUrl = searchParams.get('canvasUrl');
    const courseIdsParam = searchParams.get('courseIds');

    if (!accessToken || !canvasUrl || !courseIdsParam) {
      return NextResponse.json<CanvasApiResponse<null>>({
        data: null,
        success: false,
        error: 'Missing required parameters: accessToken, canvasUrl, and courseIds',
      }, { status: 400 });
    }

    let courseIds: number[];
    try {
      courseIds = JSON.parse(courseIdsParam).map((id: any) => parseInt(id));
      if (courseIds.some(id => isNaN(id))) {
        throw new Error('Invalid course IDs');
      }
    } catch (error) {
      return NextResponse.json<CanvasApiResponse<null>>({
        data: null,
        success: false,
        error: 'Invalid courseIds: must be a JSON array of numbers',
      }, { status: 400 });
    }

    const announcements = await canvasApi.getAnnouncements({
      accessToken,
      canvasUrl,
      courseIds,
    });

    const processedAnnouncements = announcements.map(announcement =>
      canvasApi.processAnnouncement(announcement)
    );

    return NextResponse.json<CanvasApiResponse<ProcessedAnnouncement[]>>({
      data: processedAnnouncements,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching announcements:', error);
    
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
    const { accessToken, canvasUrl, courseIds } = body;

    if (!accessToken || !canvasUrl || !courseIds) {
      return NextResponse.json<CanvasApiResponse<null>>({
        data: null,
        success: false,
        error: 'Missing required parameters: accessToken, canvasUrl, and courseIds',
      }, { status: 400 });
    }

    if (!Array.isArray(courseIds)) {
      return NextResponse.json<CanvasApiResponse<null>>({
        data: null,
        success: false,
        error: 'courseIds must be an array of numbers',
      }, { status: 400 });
    }

    const announcements = await canvasApi.getAnnouncements({
      accessToken,
      canvasUrl,
      courseIds: courseIds.map((id: any) => parseInt(id)),
    });

    const processedAnnouncements = announcements.map(announcement =>
      canvasApi.processAnnouncement(announcement)
    );

    return NextResponse.json<CanvasApiResponse<ProcessedAnnouncement[]>>({
      data: processedAnnouncements,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching announcements:', error);
    
    return NextResponse.json<CanvasApiResponse<null>>({
      data: null,
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }, { status: 500 });
  }
} 