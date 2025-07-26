# API Backend Improvement Recommendations

## 🚨 **Critical Security Issues**

### 1. **Token Security**
**Issue**: Access tokens are passed via URL query parameters in GET requests, which can be logged.

**Solution**: 
```typescript
// ❌ Current (insecure)
GET /api/canvas/courses?accessToken=secret_token&canvasUrl=https://canvas.com

// ✅ Recommended 
POST /api/canvas/courses
Headers: { Authorization: 'Bearer secret_token' }
Body: { canvasUrl: 'https://canvas.com' }
```

**Implementation**:
```typescript
// lib/auth.ts
export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
```

### 2. **Input Sanitization**
**Issue**: No input sanitization beyond type checking.

**Solution**: Add input validation with Zod:
```typescript
import { z } from 'zod';

const CanvasRequestSchema = z.object({
  canvasUrl: z.string().url().refine(url => url.startsWith('https://'), {
    message: 'Canvas URL must use HTTPS'
  }),
  accessToken: z.string().min(10, 'Access token too short')
});
```

## 🔧 **Code Quality Improvements**

### 3. **Eliminate Duplicate Code**
**Issue**: GET and POST handlers contain identical logic.

**Current Problem**:
```typescript
// Same logic duplicated in both methods
export async function GET(request: NextRequest) { /* ... */ }
export async function POST(request: NextRequest) { /* ... */ }
```

**Solution**: Extract common logic:
```typescript
// lib/api-helpers.ts
export async function extractCanvasParams(request: NextRequest): Promise<{
  accessToken: string;
  canvasUrl: string;
  [key: string]: any;
}> {
  const isGet = request.method === 'GET';
  
  if (isGet) {
    const searchParams = request.nextUrl.searchParams;
    return {
      accessToken: searchParams.get('accessToken') || '',
      canvasUrl: searchParams.get('canvasUrl') || '',
      // ... other params
    };
  } else {
    return await request.json();
  }
}

// In route handlers:
export async function GET(request: NextRequest) {
  return handleCanvasRequest(request);
}

export async function POST(request: NextRequest) {
  return handleCanvasRequest(request);
}

async function handleCanvasRequest(request: NextRequest) {
  try {
    const params = await extractCanvasParams(request);
    // ... rest of logic
  } catch (error) {
    // ... error handling
  }
}
```

### 4. **HTTP Method Validation**
**Issue**: No explicit HTTP method checking.

**Solution**:
```typescript
export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Use POST for security' }, { status: 405 });
}

export async function POST(request: NextRequest) {
  // Only allow POST for sensitive operations
}
```

## 🛡️ **Security Middleware**

### 5. **Authentication Middleware**
Create centralized authentication:

```typescript
// middleware/auth.ts
export async function validateCanvasAuth(
  accessToken: string, 
  canvasUrl: string
): Promise<boolean> {
  try {
    const response = await fetch(`${canvasUrl}/api/v1/users/self`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}

// lib/with-auth.ts
export function withCanvasAuth<T extends object>(
  handler: (request: NextRequest, params: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any) => {
    const token = extractBearerToken(request);
    if (!token) {
      return NextResponse.json(
        { data: null, success: false, error: 'Missing authorization header' },
        { status: 401 }
      );
    }
    
    // Validate token format, rate limiting, etc.
    return handler(request, context);
  };
}
```

### 6. **Rate Limiting**
**Issue**: No rate limiting protection.

**Solution**:
```typescript
// lib/rate-limit.ts
import { NextRequest } from 'next/server';

const rateLimitMap = new Map();

export function checkRateLimit(request: NextRequest, limit = 100): boolean {
  const ip = request.ip || 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const limitData = rateLimitMap.get(ip);
  
  if (now > limitData.resetTime) {
    limitData.count = 1;
    limitData.resetTime = now + windowMs;
    return true;
  }
  
  if (limitData.count >= limit) {
    return false;
  }
  
  limitData.count++;
  return true;
}
```

## 🚀 **Performance Optimizations**

### 7. **Response Caching**
**Issue**: No caching strategy for frequently requested data.

**Solution**:
```typescript
// Add caching headers for courses (they don't change often)
export async function GET(request: NextRequest) {
  const response = NextResponse.json(data);
  
  // Cache courses for 5 minutes
  response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
  
  return response;
}

// For dynamic content (assignments), use shorter cache
response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
```

### 8. **Request Size Limits**
**Issue**: No protection against large payloads.

**Solution**:
```typescript
// In route.ts files
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb', // Limit request body size
    },
  },
  maxDuration: 30, // Timeout after 30 seconds
};
```

## 🌐 **Production Readiness**

### 9. **CORS Configuration**
**Issue**: Missing CORS headers for cross-origin requests.

**Solution**:
```typescript
// lib/cors.ts
export function addCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGINS || '*');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  return response;
}

// Add OPTIONS handler in each route
export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 });
  return addCorsHeaders(response);
}
```

### 10. **Error Response Improvements**
**Issue**: Generic error messages don't help debugging.

**Solution**:
```typescript
// types/api-errors.ts
export enum ApiErrorCode {
  INVALID_TOKEN = 'INVALID_TOKEN',
  CANVAS_API_ERROR = 'CANVAS_API_ERROR',
  RATE_LIMITED = 'RATE_LIMITED',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export interface EnhancedApiResponse<T> {
  data: T | null;
  success: boolean;
  error?: {
    message: string;
    code: ApiErrorCode;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}
```

## 📊 **Monitoring & Observability**

### 11. **Structured Logging**
**Issue**: Basic console.error() logging.

**Solution**:
```typescript
// lib/logger.ts
export const logger = {
  error: (message: string, context: any) => {
    console.error(JSON.stringify({
      level: 'error',
      message,
      context,
      timestamp: new Date().toISOString(),
      requestId: context.requestId
    }));
  },
  
  info: (message: string, context: any) => {
    console.info(JSON.stringify({
      level: 'info',
      message,
      context,
      timestamp: new Date().toISOString()
    }));
  }
};
```

### 12. **Health Check Endpoint**
Add a health check for monitoring:

```typescript
// app/api/health/route.ts
export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || 'unknown'
  });
}
```

## 🔄 **Recommended Refactor Structure**

```
app/api/
├── canvas/
│   ├── middleware.ts          # Shared validation & auth
│   ├── courses/route.ts       # Simplified with shared logic
│   ├── assignments/route.ts   # Simplified with shared logic
│   ├── announcements/route.ts # Simplified with shared logic
│   └── dashboard/route.ts     # Simplified with shared logic
├── health/route.ts            # Health check endpoint
lib/
├── api-helpers.ts             # Shared request/response utilities
├── auth.ts                    # Authentication utilities
├── rate-limit.ts              # Rate limiting logic
├── cors.ts                    # CORS configuration
├── logger.ts                  # Structured logging
└── validation.ts              # Input validation schemas
```

## 🎯 **Implementation Priority**

1. **High Priority (Security)**:
   - Move tokens to headers
   - Add input validation
   - Implement rate limiting

2. **Medium Priority (Code Quality)**:
   - Eliminate duplicate code
   - Add proper error handling
   - Implement caching

3. **Low Priority (Nice to Have)**:
   - Add monitoring
   - Improve logging
   - Add health checks

## 📈 **Performance Metrics to Track**

- Response time per endpoint
- Canvas API call frequency
- Error rates by endpoint
- Rate limit violations
- Cache hit/miss ratios

Would you like me to help implement any of these improvements? 