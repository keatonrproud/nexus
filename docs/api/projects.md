# Projects API

The Projects API allows authenticated users to manage their projects. All endpoints require authentication via JWT token.

## Base URL

```
/api/projects
```

## Authentication

All endpoints require a valid JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### Create Project

**POST** `/api/projects`

Creates a new project for the authenticated user.

**Request Body:**

```json
{
  "name": "My Project",
  "url": "https://example.com",
  "description": "Optional project description",
  "goatcounter_site_code": "myproject"
}
```

**Response (201):**

```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "My Project",
    "url": "https://example.com",
    "description": "Optional project description",
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}
```

**Validation Rules:**

- `name`: Required, 1-100 characters
- `url`: Required, valid URL, max 500 characters
- `description`: Optional, max 1000 characters
- `goatcounter_site_code`: Optional, max 255 characters, GoatCounter site code for analytics tracking

### Get Projects

**GET** `/api/projects`

Retrieves all projects for the authenticated user with pagination and filtering.

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `search` (optional): Search in name and description
- `sort` (optional): Sort field (`name`, `created_at`, `updated_at`)
- `order` (optional): Sort order (`asc`, `desc`)

**Response (200):**

```json
{
  "success": true,
  "projects": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "name": "My Project",
      "url": "https://example.com",
      "description": "Optional project description",
      "created_at": "2023-01-01T00:00:00.000Z",
      "updated_at": "2023-01-01T00:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20
}
```

### Get Project

**GET** `/api/projects/:id`

Retrieves a single project with board items statistics.

**Response (200):**

```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "My Project",
    "url": "https://example.com",
    "description": "Optional project description",
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z",
    "board_items_count": 10,
    "bugs_count": 5,
    "ideas_count": 5,
    "open_items_count": 8
  }
}
```

### Update Project

**PUT** `/api/projects/:id`

Updates an existing project. Only the project owner can update it.

**Request Body:**

```json
{
  "name": "Updated Project Name",
  "url": "https://updated-example.com",
  "description": "Updated description"
}
```

**Response (200):**

```json
{
  "success": true,
  "project": {
    "id": "uuid",
    "user_id": "uuid",
    "name": "Updated Project Name",
    "url": "https://updated-example.com",
    "description": "Updated description",
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
}
```

### Delete Project

**DELETE** `/api/projects/:id`

Deletes a project. Only the project owner can delete it.

**Response (200):**

```json
{
  "success": true,
  "message": "Project deleted successfully"
}
```

## Error Responses

### 400 Bad Request

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "name",
      "message": "Project name is required"
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
  "error": "Project not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "Failed to create project",
  "details": "Error message"
}
```

## Usage Examples

### Create a project

```bash
curl -X POST http://localhost:5000/api/projects \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Awesome Project",
    "url": "https://myproject.com",
    "description": "This is my awesome project",
    "goatcounter_site_code": "myproject"
  }'
```

### Get all projects

```

```
