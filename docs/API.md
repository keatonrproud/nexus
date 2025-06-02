# API Documentation

## Base URL

- **Development**: `http://localhost:5000`
- **Production**: `https://nexus.fly.dev`

## Authentication

The API uses JWT tokens stored in secure httpOnly cookies. All authenticated endpoints require a valid JWT token.

### Google OAuth Flow

#### `GET /api/auth/google`

Initiates Google OAuth flow.

**Response**: Redirects to Google OAuth consent screen.

#### `GET /api/auth/google/callback`

Handles Google OAuth callback.

**Query Parameters**:

- `code` - Authorization code from Google
- `state` - CSRF protection state

**Response**: Redirects to frontend with authentication status.

#### `POST /api/auth/logout`

Logs out the current user.

**Response**:

```json
{
  "message": "Logged out successfully"
}
```

#### `GET /api/auth/me`

Gets current user information.

**Response**:

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## Projects

#### `GET /api/projects`

Gets all projects for the authenticated user.

**Response**:

```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Project Name",
      "url": "https://example.com",
      "description": "Project description",
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /api/projects`

Creates a new project.

**Request Body**:

```json
{
  "name": "Project Name",
  "url": "https://example.com",
  "description": "Project description"
}
```

**Response**:

```json
{
  "project": {
    "id": "uuid",
    "name": "Project Name",
    "url": "https://example.com",
    "description": "Project description",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### `PUT /api/projects/:id`

Updates an existing project.

**Request Body**:

```json
{
  "name": "Updated Project Name",
  "url": "https://updated-example.com",
  "description": "Updated description"
}
```

**Response**:

```json
{
  "project": {
    "id": "uuid",
    "name": "Updated Project Name",
    "url": "https://updated-example.com",
    "description": "Updated description",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### `DELETE /api/projects/:id`

Deletes a project and all associated board items.

**Response**:

```json
{
  "message": "Project deleted successfully"
}
```

## Board Items (Bugs & Ideas)

#### `GET /api/projects/:projectId/board`

Gets all board items for a project.

**Query Parameters**:

- `type` (optional) - Filter by type: `bug` or `idea`
- `status` (optional) - Filter by status: `open`, `in-progress`, `closed`
- `priority` (optional) - Filter by priority: `low`, `medium`, `high`, `critical`

**Response**:

```json
{
  "items": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "title": "Bug title",
      "description": "Bug description",
      "type": "bug",
      "status": "open",
      "priority": "high",
      "metadata": {},
      "created_at": "2024-01-01T00:00:00.000Z",
      "updated_at": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### `POST /api/projects/:projectId/board`

Creates a new board item.

**Request Body**:

```json
{
  "title": "Item title",
  "description": "Item description",
  "type": "bug",
  "priority": "high",
  "metadata": {}
}
```

**Response**:

```json
{
  "item": {
    "id": "uuid",
    "project_id": "uuid",
    "title": "Item title",
    "description": "Item description",
    "type": "bug",
    "status": "open",
    "priority": "high",
    "metadata": {},
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### `PUT /api/projects/:projectId/board/:itemId`

Updates a board item.

**Request Body**:

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in-progress",
  "priority": "medium",
  "metadata": {}
}
```

**Response**:

```json
{
  "item": {
    "id": "uuid",
    "project_id": "uuid",
    "title": "Updated title",
    "description": "Updated description",
    "type": "bug",
    "status": "in-progress",
    "priority": "medium",
    "metadata": {},
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

#### `DELETE /api/projects/:projectId/board/:itemId`

Deletes a board item.

**Response**:

```json
{
  "message": "Board item deleted successfully"
}
```

## Analytics

#### `GET /api/analytics/:projectId/kpis`

Gets KPI data for a project.

**Response**:

```json
{
  "kpis": {
    "total_bugs": 10,
    "total_ideas": 5,
    "open_bugs": 3,
    "closed_bugs": 7,
    "implemented_ideas": 2,
    "avg_resolution_time": 5.2,
    "bug_priority_distribution": {
      "low": 2,
      "medium": 5,
      "high": 2,
      "critical": 1
    },
    "monthly_activity": [
      {
        "month": "2024-01",
        "bugs_created": 5,
        "bugs_resolved": 3,
        "ideas_created": 2,
        "ideas_implemented": 1
      }
    ]
  }
}
```

#### `GET /api/analytics/:projectId/goatcounter`

Gets GoatCounter analytics data for a project (if configured).

**Response**:

```json
{
  "analytics": {
    "pageviews": 1000,
    "visitors": 250,
    "bounce_rate": 0.35,
    "avg_session_duration": 180
  }
}
```

## Health Check

#### `GET /health`

Health check endpoint for monitoring.

**Response**:

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production"
}
```

## Error Responses

All endpoints may return the following error responses:

#### `400 Bad Request`

```json
{
  "error": "Validation error message",
  "details": ["Specific validation errors"]
}
```

#### `401 Unauthorized`

```json
{
  "error": "Authentication required"
}
```

#### `403 Forbidden`

```json
{
  "error": "Access denied"
}
```

#### `404 Not Found`

```json
{
  "error": "Resource not found"
}
```

#### `500 Internal Server Error`

```json
{
  "error": "Internal server error"
}
```

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **General endpoints**: 100 requests per 15 minutes per IP
- **Authentication endpoints**: 5 requests per 15 minutes per IP

Rate limit headers are included in responses:

- `X-RateLimit-Limit`: Request limit
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: Reset time (Unix timestamp)

## CORS

The API supports CORS for the following origins:

- **Development**: `http://localhost:3000`
- **Production**: `https://nexus.fly.dev`

Credentials (cookies) are supported for authenticated requests.
