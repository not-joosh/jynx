# Task CRUD System Documentation

## Overview

The Task CRUD system provides complete task management functionality with role-based access control, audit logging, and organization-scoped operations.

## Architecture

### Components

1. **Access Control System**
   - `@RequirePermission` decorator for endpoint-level permissions
   - `AccessControlGuard` for automatic permission checking
   - Role-based access control with granular permissions

2. **Task Service**
   - Business logic for task operations
   - Organization-scoped data access
   - Role-based data filtering

3. **Task Controller**
   - RESTful API endpoints
   - Request validation and response formatting
   - Permission enforcement

4. **Database Layer**
   - Supabase integration for data persistence
   - Row Level Security (RLS) policies
   - Automatic timestamp management

## API Endpoints

### Task Management

#### Create Task
```http
POST /api/v1/tasks
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication to the API",
  "priority": "high",
  "assigneeId": "user-uuid" // optional
}
```

**Required Permission:** `TASK_CREATE`
**Response:** `TaskDto`

#### List Tasks
```http
GET /api/v1/tasks?status=todo,in-progress&priority=high&assigneeId=user-uuid&search=authentication
Authorization: Bearer <jwt_token>
```

**Required Permission:** `TASK_READ`
**Query Parameters:**
- `status`: Filter by task status (comma-separated)
- `priority`: Filter by priority (comma-separated)
- `assigneeId`: Filter by assignee
- `search`: Search in title and description

**Response:** `TaskDto[]`

#### Get Task by ID
```http
GET /api/v1/tasks/{taskId}
Authorization: Bearer <jwt_token>
```

**Required Permission:** `TASK_READ`
**Response:** `TaskDto`

#### Update Task
```http
PUT /api/v1/tasks/{taskId}
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Updated task title",
  "status": "in-progress",
  "priority": "medium",
  "assigneeId": "new-assignee-uuid"
}
```

**Required Permission:** `TASK_UPDATE`
**Response:** `TaskDto`

#### Delete Task
```http
DELETE /api/v1/tasks/{taskId}
Authorization: Bearer <jwt_token>
```

**Required Permission:** `TASK_DELETE`
**Response:** `{ message: "Task deleted successfully" }`

### Audit Logs

#### Get Audit Logs
```http
GET /api/v1/tasks/audit/logs
Authorization: Bearer <jwt_token>
```

**Required Permission:** `AUDIT_READ`
**Response:** `{ message: "Audit logs are currently logged to console..." }`

## Access Control Logic

### Role Hierarchy

1. **Owner** - Full access to all tasks in organization
2. **Admin** - Can manage all tasks except organization settings
3. **Member** - Can create, read, and update tasks assigned to them or created by them
4. **Viewer** - Can only read tasks assigned to them

### Permission Matrix

| Permission | Owner | Admin | Member | Viewer |
|------------|-------|-------|--------|--------|
| TASK_CREATE | ✅ | ✅ | ✅ | ❌ |
| TASK_READ | ✅ | ✅ | ✅* | ✅* |
| TASK_UPDATE | ✅ | ✅ | ✅* | ❌ |
| TASK_DELETE | ✅ | ✅ | ❌ | ❌ |
| AUDIT_READ | ✅ | ✅ | ❌ | ❌ |

*Scoped to assigned/created tasks

### Data Visibility Rules

#### Task List Filtering
- **Owner/Admin**: See all tasks in organization
- **Member**: See tasks assigned to them OR created by them
- **Viewer**: See only tasks assigned to them

#### Task Access Control
- **Read**: Based on visibility rules above
- **Update**: Must be assignee OR creator (Members) OR Owner/Admin
- **Delete**: Only Owner/Admin can delete tasks

## Database Schema

### Tasks Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'todo',
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  organization_id UUID NOT NULL REFERENCES organizations(id),
  assignee_id UUID REFERENCES users(id),
  creator_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

### Row Level Security Policies

1. **View Policy**: Users can view tasks from their organization
2. **Create Policy**: Users can create tasks in their organization
3. **Update Policy**: Users can update tasks they created/assigned to (or Owner/Admin)
4. **Delete Policy**: Only Owner/Admin can delete tasks

## Audit Logging

### Logged Events
- Permission checks (GRANTED/DENIED)
- Task creation, updates, deletions
- Access attempts to restricted endpoints

### Log Format
```
[AUDIT] 2023-10-09T01:52:03.890Z - User: user-uuid | Permission: task:create | Result: GRANTED | Endpoint: /api/v1/tasks
```

### Console Output
- ✅ **GRANTED** access attempts (info level)
- 🚫 **DENIED** access attempts (warning level)

## Error Handling

### Common Error Responses

#### Insufficient Permissions
```json
{
  "statusCode": 403,
  "message": "Insufficient permissions. Required: task:delete",
  "error": "Forbidden"
}
```

#### Task Not Found
```json
{
  "statusCode": 404,
  "message": "Task not found",
  "error": "Not Found"
}
```

#### Organization Required
```json
{
  "statusCode": 400,
  "message": "User must be associated with an organization to create tasks",
  "error": "Bad Request"
}
```

## Usage Examples

### Frontend Integration

```typescript
// Create a task
const createTask = async (taskData: CreateTaskDto) => {
  const response = await fetch('/api/v1/tasks', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(taskData)
  });
  return response.json();
};

// List tasks with filters
const getTasks = async (filters: TaskFilterDto) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status.join(','));
  if (filters.priority) params.append('priority', filters.priority.join(','));
  if (filters.assigneeId) params.append('assigneeId', filters.assigneeId);
  if (filters.search) params.append('search', filters.search);
  
  const response = await fetch(`/api/v1/tasks?${params}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### Testing Access Control

```bash
# Test as Owner (should succeed)
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer <owner-token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","priority":"high"}'

# Test as Viewer (should fail)
curl -X POST http://localhost:3000/api/v1/tasks \
  -H "Authorization: Bearer <viewer-token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Task","priority":"high"}'
```

## Security Considerations

1. **JWT Token Validation**: All endpoints require valid JWT tokens
2. **Organization Scoping**: Tasks are automatically scoped to user's organization
3. **Role-Based Access**: Granular permissions prevent unauthorized access
4. **Audit Trail**: All access attempts are logged for security monitoring
5. **Row Level Security**: Database-level security policies provide defense in depth

## Performance Optimizations

1. **Database Indexes**: Optimized for common query patterns
2. **Efficient Filtering**: Server-side filtering reduces data transfer
3. **Caching**: JWT token validation can be cached
4. **Pagination**: Large task lists can be paginated (future enhancement)

## Future Enhancements

1. **Task Dependencies**: Support for task relationships
2. **File Attachments**: Upload files to tasks
3. **Comments System**: Task discussion threads
4. **Time Tracking**: Log time spent on tasks
5. **Task Templates**: Reusable task templates
6. **Bulk Operations**: Update/delete multiple tasks
7. **Advanced Filtering**: Date ranges, custom fields
8. **Task Analytics**: Progress reports and metrics
