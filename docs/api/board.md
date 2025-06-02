# Board API

The Board API allows authenticated users to manage bugs and ideas within their projects. All endpoints require authentication via JWT token and project ownership verification.

## Base URL

```
/api/projects/:projectId/board
```

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Create Board Item

**POST** `/api/projects/:projectId/board`

Creates a new board item (bug or idea) for the specified project.

**Request Body:**

```json
{
  "title": "Fix login bug",
  "description": "Users cannot login with special characters in password",
  "type": "bug",
  "status": "open",
  "priority": "high"
}
```

**Response (201):**

```json
{
  "success": true,
  "item": {
    "id": "uuid",
    "project_id": "uuid",
    "title": "Fix login bug",
    "description": "Users cannot login with special characters in password",
    "type": "bug",
    "status": "open",
    "priority": "high",
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}
```

**Validation Rules:**

- `title`: Required, 1-200 characters
- `description`: Optional, max 2000 characters
- `type`: Required, must be "bug" or "idea"
- `status`: Optional, must be "open", "in-progress", or "closed" (default: "open")
- `priority`: Optional, must be "low", "medium", "high", or "critical" (default: "medium")

### Get Board Items

**GET** `/api/projects/:projectId/board`

Retrieves all board items for the specified project with filtering and pagination.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50, max: 100)
- `search` (optional): Search in title and description
- `type` (optional): Filter by type ("bug" or "idea")
- `status` (optional): Filter by status ("open", "in-progress", "closed")
- `priority` (optional): Filter by priority ("low", "medium", "high", "critical")
- `sort` (optional): Sort field ("title", "created_at", "updated_at", "priority")
- `order` (optional): Sort order ("asc", "desc")

**Response (200):**

```json
{
  "success": true,
  "items": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "title": "Fix login bug",
      "description": "Users cannot login with special characters in password",
      "type": "bug",
      "status": "open",
      "priority": "high",
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 50
}
```

### Get Board Statistics

**GET** `/api/projects/:projectId/board/stats`

Retrieves statistics for all board items in the project.

**Response (200):**

```json
{
  "success": true,
  "stats": {
    "total": 25,
    "bugs": 15,
    "ideas": 10,
    "open": 18,
    "inProgress": 5,
    "closed": 2,
    "byPriority": {
      "low": 5,
      "medium": 12,
      "high": 6,
      "critical": 2
    }
  }
}
```

### Get Board Item

**GET** `/api/projects/:projectId/board/:itemId`

Retrieves a single board item by ID.

**Response (200):**

```json
{
  "success": true,
  "item": {
    "id": "uuid",
    "project_id": "uuid",
    "title": "Fix login bug",
    "description": "Users cannot login with special characters in password",
    "type": "bug",
    "status": "open",
    "priority": "high",
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}
```

### Update Board Item

**PUT** `/api/projects/:projectId/board/:itemId`

Updates an existing board item. Only the project owner can update items.

**Request Body:**

```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in-progress",
  "priority": "critical"
}
```

**Response (200):**

```json
{
  "success": true,
  "item": {
    "id": "uuid",
    "project_id": "uuid",
    "title": "Updated title",
    "description": "Updated description",
    "type": "bug",
    "status": "in-progress",
    "priority": "critical",
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}
```

### Delete Board Item

**DELETE** `/api/projects/:projectId/board/:itemId`

Deletes a board item. Only the project owner can delete items.

**Response (200):**

```json
{
  "success": true,
  "message": "Board item deleted successfully"
}
```

### Bulk Operations

**PATCH** `/api/projects/:projectId/board/bulk`

Performs bulk operations on multiple board items.

#### Bulk Update

**Request Body:**

```json
{
  "operation": "update",
  "itemIds": ["uuid1", "uuid2", "uuid3"],
  "updates": {
    "status": "closed",
    "priority": "low"
  }
}
```

**Response (200):**

```json
{
  "success": true,
  "updated": 3,
  "message": "Successfully updated 3 board items"
}
```

#### Bulk Delete

**Request Body:**

```json
{
  "operation": "delete",
  "itemIds": ["uuid1", "uuid2", "uuid3"]
}
```

**Response (200):**

```json
{
  "success": true,
  "deleted": 3,
  "message": "Successfully deleted 3 board items"
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "title",
      "message": "Title is required"
    }
  ]
}
```

### 401 Unauthorized

```json
{
  "error": "User not authenticated"
}
```

### 404 Not Found

```json
{
  "error": "Board item not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to create board item",
  "details": "Error message"
}
```

## Usage Examples

### Create a bug

```bash
curl -X POST http://localhost:5000/api/projects/PROJECT_ID/board \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Login form validation error",
    "description": "Email validation is not working properly",
    "type": "bug",
    "priority": "high"
  }'
```

### Create an idea

```bash
curl -X POST http://localhost:5000/api/projects/PROJECT_ID/board \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Add dark mode",
    "description": "Users have requested a dark mode option",
    "type": "idea",
    "priority": "medium"
  }'
```

### Get all board items with filtering

```bash
curl -X GET "http://localhost:5000/api/projects/PROJECT_ID/board?type=bug&status=open&priority=high" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get board statistics

```bash
curl -X GET http://localhost:5000/api/projects/PROJECT_ID/board/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Update a board item

```bash
curl -X PUT http://localhost:5000/api/projects/PROJECT_ID/board/ITEM_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "in-progress",
    "priority": "critical"
  }'
```

### Bulk update items

```bash
curl -X PATCH http://localhost:5000/api/projects/PROJECT_ID/board/bulk \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "update",
    "itemIds": ["item1-id", "item2-id"],
    "updates": {
      "status": "closed"
    }
  }'
```

### Delete a board item

```bash
curl -X DELETE http://localhost:5000/api/projects/PROJECT_ID/board/ITEM_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Board Item Types

### Bug

- Represents issues, defects, or problems in the project
- Typically has higher priority for resolution
- Common statuses: open → in-progress → closed

### Idea

- Represents feature requests, enhancements, or suggestions
- Can be prioritized based on business value
- Common statuses: open → in-progress → closed

## Status Workflow

1. **open**: Newly created item, not yet being worked on
2. **in-progress**: Item is currently being worked on
3. **closed**: Item has been completed or resolved

## Priority Levels

1. **critical**: Urgent issues that block functionality
2. **high**: Important issues that should be addressed soon
3. **medium**: Standard priority items (default)
4. **low**: Nice-to-have items that can be addressed later
