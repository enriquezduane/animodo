# Canvas API Documentation

This documentation covers the Canvas LMS API endpoints available in your NextJS application.

## Overview

The API provides endpoints to fetch Canvas LMS data including courses, assignments, and announcements. All endpoints support both GET and POST methods and require an access token for authentication.

## Base URL Structure

All endpoints follow the pattern: `/api/canvas/{resource}`

## Authentication

All endpoints require:
- `accessToken`: Your Canvas API access token
- `canvasUrl`: Your Canvas instance URL (e.g., "https://dlsu.instructure.com")

## Endpoints

### 1. Get Favorite Courses
Fetches the user's favorite courses from Canvas.

**Endpoint:** `/api/canvas/courses`

**Methods:** GET, POST

**Parameters:**
- `accessToken` (required): Canvas API access token
- `canvasUrl` (required): Canvas instance URL

**Example Usage:**

```javascript
// GET request
const response = await fetch('/api/canvas/courses?accessToken=YOUR_TOKEN&canvasUrl=https://dlsu.instructure.com');

// POST request
const response = await fetch('/api/canvas/courses', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accessToken: 'YOUR_TOKEN',
    canvasUrl: 'https://dlsu.instructure.com'
  })
});
```

**Response:**
```json
{
  "data": [
    {
      "id": 12345,
      "name": "Computer Science 101",
      "course_code": "CS101"
    }
  ],
  "success": true
}
```

### 2. Get Assignments
Fetches assignments for a specific course.

**Endpoint:** `/api/canvas/assignments`

**Methods:** GET, POST

**Parameters:**
- `accessToken` (required): Canvas API access token
- `canvasUrl` (required): Canvas instance URL
- `courseId` (required): Course ID number

**Example Usage:**

```javascript
// GET request
const response = await fetch('/api/canvas/assignments?accessToken=YOUR_TOKEN&canvasUrl=https://dlsu.instructure.com&courseId=12345');

// POST request
const response = await fetch('/api/canvas/assignments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accessToken: 'YOUR_TOKEN',
    canvasUrl: 'https://dlsu.instructure.com',
    courseId: 12345
  })
});
```

**Response:**
```json
{
  "data": [
    {
      "id": 67890,
      "name": "Final Project",
      "course_id": 12345,
      "due_at": "2024-01-15T23:59:00Z",
      "html_url": "https://canvas.url/assignments/67890",
      "points_possible": 100,
      "submission_status": "Not Submitted",
      "assignment_group_id": 1001,
      "grade": 85
    }
  ],
  "success": true
}
```

### 3. Get Announcements
Fetches announcements for multiple courses.

**Endpoint:** `/api/canvas/announcements`

**Methods:** GET, POST

**Parameters:**
- `accessToken` (required): Canvas API access token
- `canvasUrl` (required): Canvas instance URL
- `courseIds` (required): Array of course ID numbers (for GET: JSON stringified array)

**Example Usage:**

```javascript
// GET request
const courseIds = JSON.stringify([12345, 67890]);
const response = await fetch(`/api/canvas/announcements?accessToken=YOUR_TOKEN&canvasUrl=https://dlsu.instructure.com&courseIds=${encodeURIComponent(courseIds)}`);

// POST request
const response = await fetch('/api/canvas/announcements', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accessToken: 'YOUR_TOKEN',
    canvasUrl: 'https://dlsu.instructure.com',
    courseIds: [12345, 67890]
  })
});
```

**Response:**
```json
{
  "data": [
    {
      "id": 11111,
      "title": "Important Update",
      "posted_at": "2024-01-01T10:00:00Z",
      "url": "https://canvas.url/announcements/11111",
      "course_id": 12345
    }
  ],
  "success": true
}
```

### 4. Get Dashboard Data (Comprehensive)
Fetches all data in one request: courses, assignments, and announcements. This endpoint mirrors the Python script functionality and provides a structured dashboard view.

**Endpoint:** `/api/canvas/dashboard`

**Methods:** GET, POST

**Parameters:**
- `accessToken` (required): Canvas API access token
- `canvasUrl` (required): Canvas instance URL

**Example Usage:**

```javascript
// GET request
const response = await fetch('/api/canvas/dashboard?accessToken=YOUR_TOKEN&canvasUrl=https://dlsu.instructure.com');

// POST request
const response = await fetch('/api/canvas/dashboard', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    accessToken: 'YOUR_TOKEN',
    canvasUrl: 'https://dlsu.instructure.com'
  })
});
```

**Response:**
```json
{
  "data": {
    "report_generated_on": "2024-01-01T12:00:00.000Z",
    "entities": {
      "courses": {
        "12345": {
          "id": 12345,
          "name": "Computer Science 101"
        }
      },
      "assignments": {
        "67890": {
          "id": 67890,
          "name": "Final Project",
          "course_id": 12345,
          "due_at": "2024-01-15T23:59:00Z",
          "html_url": "https://canvas.url/assignments/67890",
          "points_possible": 100,
          "submission_status": "Not Submitted",
          "assignment_group_id": 1001
        }
      },
      "announcements": {
        "11111": {
          "id": 11111,
          "title": "Important Update",
          "posted_at": "2024-01-01T10:00:00Z",
          "url": "https://canvas.url/announcements/11111",
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

## Error Handling

All endpoints return consistent error responses:

```json
{
  "data": null,
  "success": false,
  "error": "Error message description"
}
```

**Common Error Cases:**
- Missing required parameters (400)
- Invalid access token (401)
- Invalid course ID format (400)
- Canvas API errors (500)
- Network connectivity issues (500)

## Features

### Performance Optimizations
- **Pagination Handling**: Automatically handles Canvas API pagination to fetch all results
- **Concurrent Requests**: Dashboard endpoint fetches assignments for multiple courses concurrently
- **Error Isolation**: Individual course failures don't prevent other data from being fetched

### Data Processing
- **Assignment Categorization**: Automatically categorizes assignments as upcoming or unsubmitted
- **Status Normalization**: Converts Canvas submission states to readable formats
- **Grade Inclusion**: Includes grades when assignments are graded

### Type Safety
- Full TypeScript support with proper type definitions
- Strongly typed API responses
- Runtime parameter validation

## Best Practices

1. **Use POST for Sensitive Tokens**: While GET is supported, prefer POST to keep access tokens out of URL logs
2. **Cache Results**: Consider caching responses to reduce API calls
3. **Handle Errors Gracefully**: Always check the `success` field in responses
4. **Use Dashboard Endpoint**: For comprehensive data, use `/dashboard` instead of multiple individual calls
5. **Rate Limiting**: Be mindful of Canvas API rate limits in production

## Development Testing

You can test the endpoints using tools like Postman or curl:

```bash
curl -X POST http://localhost:3000/api/canvas/dashboard \
  -H "Content-Type: application/json" \
  -d '{
    "accessToken": "YOUR_TOKEN",
    "canvasUrl": "https://dlsu.instructure.com"
  }'
``` 