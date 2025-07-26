# Canvas API Documentation

## Overview

The Canvas API provides endpoints to interact with Canvas LMS data, including courses, assignments, and announcements. All endpoints support both GET and POST methods for flexibility.

## Base URL

```
/api/canvas
```

## Authentication

All endpoints require Canvas LMS credentials:
- `accessToken`: Canvas API access token
- `canvasUrl`: Your Canvas instance URL (e.g., `https://canvas.instructure.com`)

⚠️ **Security Note**: Use POST requests when possible to avoid exposing tokens in URL parameters.

## Response Format

All API responses follow a consistent structure:

```typescript
interface CanvasApiResponse<T> {
  data: T | null;
  success: boolean;
  error?: string;
}
```

### Success Response
```json
{
  "data": { /* response data */ },
  "success": true
}
```

### Error Response
```json
{
  "data": null,
  "success": false,
  "error": "Error message describing what went wrong"
}
```

## Endpoints

### 1. Get Favorite Courses

Retrieves the user's favorite courses from Canvas.

#### `GET /api/canvas/courses`

**Query Parameters:**
- `accessToken` (required): Canvas API access token
- `canvasUrl` (required): Canvas instance URL

**Example:**
```
GET /api/canvas/courses?accessToken=your_token&canvasUrl=https://canvas.instructure.com
```

#### `POST /api/canvas/courses`

**Request Body:**
```json
{
  "accessToken": "your_canvas_token",
  "canvasUrl": "https://canvas.instructure.com"
}
```

**Response:**
```json
{
  "data": [
    {
      "id": 12345,
      "name": "Introduction to Computer Science",
      "course_code": "CS101",
      "uuid": "course-uuid"
    }
  ],
  "success": true
}
```

---

### 2. Get Course Assignments

Retrieves assignments for a specific course.

#### `GET /api/canvas/assignments`

**Query Parameters:**
- `accessToken` (required): Canvas API access token
- `canvasUrl` (required): Canvas instance URL
- `courseId` (required): Course ID (number)

**Example:**
```
GET /api/canvas/assignments?accessToken=your_token&canvasUrl=https://canvas.instructure.com&courseId=12345
```

#### `POST /api/canvas/assignments`

**Request Body:**
```json
{
  "accessToken": "your_canvas_token",
  "canvasUrl": "https://canvas.instructure.com",
  "courseId": 12345
}
```

**Response:**
```json
{
  "data": [
    {
      "id": 67890,
      "name": "Homework Assignment 1",
      "course_id": 12345,
      "due_at": "2024-01-15T23:59:00Z",
      "html_url": "https://canvas.instructure.com/courses/12345/assignments/67890",
      "points_possible": 100,
      "submission_status": "Not Submitted",
      "assignment_group_id": 1234,
      "locked_for_user": false,
      "lock_info": null,
      "can_submit": true,
      "submission_types": ["online_text_entry", "online_upload"],
      "grade": null
    }
  ],
  "success": true
}
```

---

### 3. Get Course Announcements

Retrieves announcements for multiple courses.

#### `GET /api/canvas/announcements`

**Query Parameters:**
- `accessToken` (required): Canvas API access token
- `canvasUrl` (required): Canvas instance URL
- `courseIds` (required): JSON array of course IDs

**Example:**
```
GET /api/canvas/announcements?accessToken=your_token&canvasUrl=https://canvas.instructure.com&courseIds=[12345,67890]
```

#### `POST /api/canvas/announcements`

**Request Body:**
```json
{
  "accessToken": "your_canvas_token",
  "canvasUrl": "https://canvas.instructure.com",
  "courseIds": [12345, 67890]
}
```

**Response:**
```json
{
  "data": [
    {
      "id": 11111,
      "title": "Welcome to the Course!",
      "posted_at": "2024-01-01T10:00:00Z",
      "url": "https://canvas.instructure.com/courses/12345/discussion_topics/11111",
      "course_id": 12345
    }
  ],
  "success": true
}
```

---

### 4. Get Dashboard Data

Retrieves consolidated dashboard data including courses, assignments, and announcements.

#### `GET /api/canvas/dashboard`

**Query Parameters:**
- `accessToken` (required): Canvas API access token
- `canvasUrl` (required): Canvas instance URL

**Example:**
```
GET /api/canvas/dashboard?accessToken=your_token&canvasUrl=https://canvas.instructure.com
```

#### `POST /api/canvas/dashboard`

**Request Body:**
```json
{
  "accessToken": "your_canvas_token",
  "canvasUrl": "https://canvas.instructure.com"
}
```

**Response:**
```json
{
  "data": {
    "report_generated_on": "2024-01-01T12:00:00Z",
    "entities": {
      "courses": {
        "12345": {
          "id": 12345,
          "name": "Introduction to Computer Science"
        }
      },
      "assignments": {
        "67890": {
          "id": 67890,
          "name": "Homework Assignment 1",
          "course_id": 12345,
          "due_at": "2024-01-15T23:59:00Z",
          "submission_status": "Not Submitted"
        }
      },
      "announcements": {
        "11111": {
          "id": 11111,
          "title": "Welcome to the Course!",
          "posted_at": "2024-01-01T10:00:00Z",
          "course_id": 12345
        }
      }
    },
    "views": {
      "upcoming_assignments": [67890],
      "unsubmitted_assignments": [],
      "assignments_by_course": {
        "12345": [67890]
      },
      "announcements_by_course": {
        "12345": [11111]
      }
    }
  },
  "success": true
}
```

## Data Types

### Course
```typescript
interface Course {
  id: number;
  name: string;
  course_code?: string;
  uuid?: string;
}
```

### ProcessedAssignment
```typescript
interface ProcessedAssignment {
  id: number;
  name: string;
  course_id: number;
  due_at: string | null;
  html_url: string;
  points_possible: number | null;
  submission_status: string;
  assignment_group_id: number;
  locked_for_user: boolean;
  lock_info: LockInfo | null;
  can_submit: boolean;
  submission_types: string[];
  grade?: number;
}
```

### ProcessedAnnouncement
```typescript
interface ProcessedAnnouncement {
  id: number;
  title: string;
  posted_at: string | null;
  url: string;
  course_id: number;
}
```

### DashboardData
```typescript
interface DashboardData {
  report_generated_on: string;
  entities: {
    courses: Record<number, Course>;
    assignments: Record<number, ProcessedAssignment>;
    announcements: Record<number, ProcessedAnnouncement>;
  };
  views: {
    upcoming_assignments: number[];
    unsubmitted_assignments: number[];
    assignments_by_course: Record<number, number[]>;
    announcements_by_course: Record<number, number[]>;
  };
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Missing or invalid parameters |
| 500 | Internal Server Error - Canvas API error or server issue |

## Error Examples

### Missing Parameters
```json
{
  "data": null,
  "success": false,
  "error": "Missing required parameters: accessToken and canvasUrl"
}
```

### Invalid Course ID
```json
{
  "data": null,
  "success": false,
  "error": "Invalid courseId: must be a number"
}
```

### Canvas API Error
```json
{
  "data": null,
  "success": false,
  "error": "Canvas API Error: 401 Unauthorized"
}
```

## Rate Limiting

⚠️ **Note**: This API does not currently implement rate limiting. In production, consider:
- Implementing rate limiting to prevent abuse
- Caching responses to reduce Canvas API calls
- Using authentication middleware

## Security Considerations

1. **Token Security**: Never expose Canvas access tokens in client-side code
2. **HTTPS Only**: Always use HTTPS in production
3. **Input Validation**: All inputs are validated, but additional sanitization may be needed
4. **CORS**: Configure CORS headers if accessing from different domains

## Usage Examples

### JavaScript/TypeScript
```javascript
// Using fetch API
const response = await fetch('/api/canvas/courses', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    accessToken: 'your_canvas_token',
    canvasUrl: 'https://canvas.instructure.com'
  })
});

const result = await response.json();
if (result.success) {
  console.log('Courses:', result.data);
} else {
  console.error('Error:', result.error);
}
```

### cURL
```bash
# GET request
curl "https://your-domain.com/api/canvas/courses?accessToken=your_token&canvasUrl=https://canvas.instructure.com"

# POST request
curl -X POST https://your-domain.com/api/canvas/courses \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "your_canvas_token",
    "canvasUrl": "https://canvas.instructure.com"
  }'
```

## Troubleshooting

### Common Issues

1. **401 Unauthorized**: Check if your Canvas access token is valid and has necessary permissions
2. **Invalid URL**: Ensure your `canvasUrl` includes the protocol (https://)
3. **Course not found**: Verify that course IDs exist and you have access to them
4. **Network timeout**: Canvas API might be slow; consider implementing retry logic

### Debug Information

All API errors are logged server-side for debugging. Check your application logs for detailed error information. 