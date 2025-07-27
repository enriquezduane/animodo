import { NextRequest, NextResponse } from 'next/server';
import { UserResponse, ApiError } from '../../../components/types';
import { extractCanvasConfig, fetchFromCanvas, createErrorResponse, ApiResult } from '../shared/canvas-api.utils';

/**
 * Fetch user data from Canvas API
 */
async function fetchCanvasUser(config: any): Promise<ApiResult<UserResponse>> {
  const result = await fetchFromCanvas<any>(config, '/api/v1/users/self', 'fetch user data from Canvas');
  
  if (!result.success) {
    return result;
  }
  
  // Validate that we received the expected data structure
  if (!result.data?.name) {
    return {
      success: false,
      error: 'Invalid user data received from Canvas',
      status: 502
    };
  }

  return {
    success: true,
    data: { name: result.data.name }
  };
}

/**
 * GET /api/user
 * Fetches the current user's information from Canvas
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract and validate Canvas API configuration
    const configResult = extractCanvasConfig(request);
    if (!configResult.success) {
      return NextResponse.json(createErrorResponse(configResult.error), { status: configResult.status });
    }

    // Fetch user data from Canvas
    const userResult = await fetchCanvasUser(configResult.data);
    if (!userResult.success) {
      return NextResponse.json(createErrorResponse(userResult.error), { status: userResult.status });
    }

    return NextResponse.json(userResult.data, { status: 200 });
  } catch (error) {
    console.error('Unexpected error in user API route:', error);
    return NextResponse.json(createErrorResponse('Internal server error'), { status: 500 });
  }
}
