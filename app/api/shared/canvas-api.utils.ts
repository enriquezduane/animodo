import { NextRequest } from 'next/server';
import { validateCanvasUrl } from '../../../components/security';
import { ApiError } from '../../../components/types';

/**
 * Canvas API configuration
 */
export interface CanvasApiConfig {
  readonly token: string;
  readonly baseUrl: string;
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
  readonly status: number;
};

/**
 * Extract and validate Canvas API configuration from request headers
 * Follows Single Responsibility Principle by handling only header extraction
 */
export function extractCanvasConfig(request: NextRequest): ApiResult<CanvasApiConfig> {
  const authorization = request.headers.get('Authorization');
  const canvasUrl = request.headers.get('Canvas-URL');

  if (!authorization || !canvasUrl) {
    return {
      success: false,
      error: 'Missing Authorization or Canvas-URL header',
      status: 401
    };
  }

  if (!validateCanvasUrl(canvasUrl)) {
    return {
      success: false,
      error: 'Invalid Canvas URL',
      status: 400
    };
  }

  const token = authorization.replace('Bearer ', '');
  if (!token) {
    return {
      success: false,
      error: 'Invalid authorization header format',
      status: 401
    };
  }

  return {
    success: true,
    data: { token, baseUrl: canvasUrl }
  };
}

/**
 * Generic Canvas API fetch function with proper error handling
 * Follows Single Responsibility Principle by handling only HTTP requests
 */
export async function fetchFromCanvas<T>(
  config: CanvasApiConfig,
  endpoint: string,
  errorContext: string
): Promise<ApiResult<T>> {
  try {
    const url = `${config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Canvas API error (${response.status}) for ${errorContext}:`, errorText);
      
      return {
        success: false,
        error: response.status === 401 
          ? 'Invalid or expired token' 
          : `Failed to ${errorContext.toLowerCase()}`,
        status: response.status
      };
    }

    const data = await response.json() as T;
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error(`Network error for ${errorContext}:`, error);
    return {
      success: false,
      error: 'Network error communicating with Canvas',
      status: 500
    };
  }
}

/**
 * Create a standardized error response
 * Follows consistency in error handling across API routes
 */
export function createErrorResponse(error: string): ApiError {
  return { error };
} 