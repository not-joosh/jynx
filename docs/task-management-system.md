# Task Management System Documentation

## Overview

The Task Management System provides a complete solution for managing tasks across multiple organizations with role-based access control, modern UI, and comprehensive CRUD operations.

## System Architecture

### Frontend Components

1. **TaskService** (`apps/dashboard/src/app/services/task.service.ts`)
   - HTTP client service for task operations
   - Observable-based data management
   - Local state management with BehaviorSubject

2. **TasksComponent** (`apps/dashboard/src/app/features/tasks/tasks.component.ts`)
   - Main task management interface
   - Organization switching functionality
   - CRUD operations with permission checks
   - Advanced filtering and search

3. **Task Templates** (`apps/dashboard/src/app/features/tasks/tasks.component.html`)
   - Modern, responsive UI design
   - Modal-based task creation/editing
   - Professional organization switcher
   - Real-time filtering interface

### Backend Components

1. **TaskController** (`apps/api/src/app/tasks/task.controller.ts`)
   - RESTful API endpoints
   - Permission-based access control
   - Request validation and error handling

2. **TaskService** (`apps/api/src/app/tasks/task.service.ts`)
   - Business logic implementation
   - Organization-scoped data access
   - Role-based data filtering

3. **Access Control System**
   - `@RequirePermission` decorator
   - `AccessControlGuard` for automatic permission checking
   - Audit logging for security monitoring

## Features

### 🏢 Organization Management

**Organization Switcher**
- Dropdown interface for switching between organizations
- Visual organization cards with role indicators
- Current organization highlighting
- Smooth transitions and animations

**Multi-Organization Support**
- Tasks are scoped to specific organizations
- Users can belong to multiple organizations
- Role-based access per organization

### 📋 Task Management

**Task CRUD Operations**
- ✅ **Create**: Add new tasks with title, description, priority
- ✅ **Read**: View tasks with advanced filtering
- ✅ **Update**: Edit task details, status, and priority
- ✅ **Delete**: Remove tasks (with confirmation)

**Task Properties**
- **Title**: Required task name
- **Description**: Optional detailed description
- **Status**: Draft, Todo, In Progress, Review, Done, Archived
- **Priority**: Critical, High, Medium, Low
- **Assignee**: Optional user assignment
- **Timestamps**: Created, Updated, Completed dates

### 🔍 Advanced Filtering

**Filter Options**
- **Status Filter**: Multiple status selection
- **Priority Filter**: Multiple priority selection
- **Search**: Text search in title and description
- **Clear Filters**: Reset all filters

**Real-time Updates**
- Filters apply instantly as you type/select
- Task count updates dynamically
- Smooth UI transitions

### 🎨 Modern UI Design

**Design Principles**
- **Professional**: Clean, business-appropriate styling
- **Responsive**: Works on desktop, tablet, and mobile
- **Accessible**: Proper focus states and keyboard navigation
- **Consistent**: Matches overall application design

**Visual Elements**
- **Status Badges**: Color-coded status indicators
- **Priority Badges**: Color-coded priority levels
- **Hover Effects**: Subtle animations and transitions
- **Loading States**: Spinner indicators during operations

## User Interface

### Main Tasks Page

```
┌─────────────────────────────────────────────────────────────┐
│ Tasks                    [Organization Switcher ▼] [Create] │
├─────────────────────────────────────────────────────────────┤
│ Filters                                                    │
│ ┌─────────────┬─────────────┬─────────────┐                │
│ │ Status      │ Priority    │ Search      │                │
│ │ ☐ Todo      │ ☐ Critical  │ [Search...] │                │
│ │ ☐ Progress  │ ☐ High      │             │                │
│ │ ☐ Review    │ ☐ Medium    │             │                │
│ │ ☐ Done      │ ☐ Low       │             │                │
│ └─────────────┴─────────────┴─────────────┘                │
├─────────────────────────────────────────────────────────────┤
│ Tasks (5)                                                  │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Task Title                    [Status] [Priority] [⚙][🗑]│ │
│ │ Description text...                                     │ │
│ │ Created Oct 9, 2023                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Another Task                 [Status] [Priority] [⚙][🗑]│ │
│ │ Another description...                                 │ │
│ │ Created Oct 8, 2023                                     │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Organization Switcher

```
┌─────────────────────────────────────┐
│ Switch Organization                 │
├─────────────────────────────────────┤
│ 🏢 Jynx Inc.              [Owner] ● │
│ 🏢 Acme Corp              [Member]  │
│ 🏢 Tech Solutions          [Admin]   │
└─────────────────────────────────────┘
```

### Task Creation Modal

```
┌─────────────────────────────────────┐
│ Create New Task                     │
├─────────────────────────────────────┤
│ Title: [________________________]  │
│ Description:                        │
│ [_____________________________]    │
│ [_____________________________]    │
│ Priority: [Medium ▼]               │
├─────────────────────────────────────┤
│                    [Cancel] [Create]│
└─────────────────────────────────────┘
```

## API Integration

### Frontend Service Methods

```typescript
// Create a new task
createTask(createTaskDto: CreateTaskDto): Observable<TaskDto>

// Get tasks with filters
getTasks(filter?: TaskFilterDto): Observable<TaskDto[]>

// Get specific task
getTaskById(taskId: string): Observable<TaskDto>

// Update task
updateTask(taskId: string, updateTaskDto: UpdateTaskDto): Observable<TaskDto>

// Delete task
deleteTask(taskId: string): Observable<{ message: string }>

// Local state management
updateTasksList(tasks: TaskDto[]): void
getCurrentTasks(): TaskDto[]
getTasksByStatus(status: TaskStatus): TaskDto[]
getTaskStats(): TaskStats
```

### Backend API Endpoints

```http
POST   /api/v1/tasks              # Create task
GET    /api/v1/tasks              # List tasks (with filters)
GET    /api/v1/tasks/:id          # Get specific task
PUT    /api/v1/tasks/:id          # Update task
DELETE /api/v1/tasks/:id          # Delete task
GET    /api/v1/tasks/audit/logs   # Get audit logs
```

## Permission System

### Role-Based Access Control

| Permission | Owner | Admin | Member | Viewer |
|------------|-------|-------|--------|--------|
| TASK_CREATE | ✅ | ✅ | ✅ | ❌ |
| TASK_READ | ✅ | ✅ | ✅* | ✅* |
| TASK_UPDATE | ✅ | ✅ | ✅* | ❌ |
| TASK_DELETE | ✅ | ✅ | ❌ | ❌ |

*Scoped to assigned/created tasks

### UI Permission Checks

```typescript
// Create button visibility
*ngIf="authService.hasPermission(Permission.TASK_CREATE)"

// Edit button visibility
*ngIf="authService.hasPermission(Permission.TASK_UPDATE)"

// Delete button visibility
*ngIf="authService.hasPermission(Permission.TASK_DELETE)"
```

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

## Usage Examples

### Creating a Task

```typescript
// Component method
onCreateTask(): void {
  if (!this.authService.hasPermission(Permission.TASK_CREATE)) {
    return;
  }
  
  this.createTaskForm = {
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM
  };
  this.showCreateModal = true;
}

// Service call
createTask(): void {
  this.taskService.createTask(this.createTaskForm).subscribe({
    next: (newTask) => {
      this.tasks.unshift(newTask);
      this.applyFilters();
      this.showCreateModal = false;
    },
    error: (error) => console.error('Error creating task:', error)
  });
}
```

### Filtering Tasks

```typescript
// Apply filters
private applyFilters(): void {
  let filtered = [...this.tasks];

  // Status filter
  if (this.filter.status && this.filter.status.length > 0) {
    filtered = filtered.filter(task => 
      this.filter.status!.includes(task.status)
    );
  }

  // Priority filter
  if (this.filter.priority && this.filter.priority.length > 0) {
    filtered = filtered.filter(task => 
      this.filter.priority!.includes(task.priority)
    );
  }

  // Search filter
  if (this.filter.search) {
    const searchTerm = this.filter.search.toLowerCase();
    filtered = filtered.filter(task => 
      task.title.toLowerCase().includes(searchTerm) ||
      (task.description && task.description.toLowerCase().includes(searchTerm))
    );
  }

  this.filteredTasks = filtered;
}
```

### Organization Switching

```typescript
// Switch organization
switchOrganization(org: Organization): void {
  this.currentOrganization = org;
  this.showOrganizationDropdown = false;
  this.loadTasks(); // Reload tasks for new organization
}

// Load organizations (mock data)
private loadOrganizations(): void {
  this.organizations = [
    { id: 'org1', name: 'Jynx Inc.', role: 'owner' },
    { id: 'org2', name: 'Acme Corp', role: 'member' },
    { id: 'org3', name: 'Tech Solutions', role: 'admin' }
  ];
  this.currentOrganization = this.organizations[0];
}
```

## Styling and Theming

### CSS Classes

```css
/* Status badges */
.status-todo { @apply bg-blue-100 text-blue-800; }
.status-in-progress { @apply bg-yellow-100 text-yellow-800; }
.status-review { @apply bg-purple-100 text-purple-800; }
.status-done { @apply bg-green-100 text-green-800; }

/* Priority badges */
.priority-critical { @apply bg-red-100 text-red-800; }
.priority-high { @apply bg-orange-100 text-orange-800; }
.priority-medium { @apply bg-yellow-100 text-yellow-800; }
.priority-low { @apply bg-green-100 text-green-800; }

/* Animations */
@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Responsive Design

```css
/* Mobile adjustments */
@media (max-width: 768px) {
  .grid-cols-1.md\\:grid-cols-3 {
    grid-template-columns: 1fr;
  }
  
  .flex.items-center.justify-between {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
}
```

## Error Handling

### Frontend Error Handling

```typescript
// Service error handling
createTask(): void {
  this.isLoading = true;
  this.taskService.createTask(this.createTaskForm).subscribe({
    next: (newTask) => {
      // Success handling
      this.tasks.unshift(newTask);
      this.isLoading = false;
    },
    error: (error) => {
      console.error('Error creating task:', error);
      // Show error message to user
      this.isLoading = false;
    }
  });
}
```

### Backend Error Responses

```json
// Permission denied
{
  "statusCode": 403,
  "message": "Insufficient permissions. Required: task:create",
  "error": "Forbidden"
}

// Task not found
{
  "statusCode": 404,
  "message": "Task not found",
  "error": "Not Found"
}
```

## Performance Optimizations

### Frontend Optimizations

1. **Lazy Loading**: Tasks component loads only when needed
2. **OnPush Change Detection**: Optimized change detection strategy
3. **Virtual Scrolling**: For large task lists (future enhancement)
4. **Caching**: Local state management with BehaviorSubject

### Backend Optimizations

1. **Database Indexes**: Optimized for common query patterns
2. **Efficient Filtering**: Server-side filtering reduces data transfer
3. **Pagination**: Large task lists can be paginated (future enhancement)
4. **Caching**: JWT token validation can be cached

## Security Considerations

1. **JWT Authentication**: All API calls require valid tokens
2. **Permission Checks**: Both frontend and backend permission validation
3. **Organization Scoping**: Tasks automatically scoped to user's organization
4. **Audit Logging**: All access attempts logged for security monitoring
5. **Input Validation**: Proper validation of all user inputs

## Future Enhancements

### Planned Features

1. **Task Dependencies**: Support for task relationships
2. **File Attachments**: Upload files to tasks
3. **Comments System**: Task discussion threads
4. **Time Tracking**: Log time spent on tasks
5. **Task Templates**: Reusable task templates
6. **Bulk Operations**: Update/delete multiple tasks
7. **Advanced Filtering**: Date ranges, custom fields
8. **Task Analytics**: Progress reports and metrics
9. **Real-time Updates**: WebSocket integration for live updates
10. **Mobile App**: Native mobile application

### Technical Improvements

1. **State Management**: NgRx integration for complex state
2. **Testing**: Comprehensive unit and integration tests
3. **Accessibility**: WCAG 2.1 AA compliance
4. **Internationalization**: Multi-language support
5. **Offline Support**: Service worker for offline functionality

## Migration Guide

### Database Migration

1. **Run Migration Script**:
   ```bash
   # Windows
   ./scripts/migrate-tasks.bat
   
   # Linux/Mac
   ./scripts/migrate-tasks.sh
   ```

2. **Manual Migration**:
   - Copy SQL from `migration_tasks.sql`
   - Execute in Supabase SQL Editor
   - Verify table creation and policies

### Frontend Integration

1. **Import TaskService**:
   ```typescript
   import { TaskService } from '../services/task.service';
   ```

2. **Add to Component**:
   ```typescript
   constructor(private taskService: TaskService) {}
   ```

3. **Update Routes**:
   ```typescript
   {
     path: 'tasks',
     loadComponent: () => import('./features/tasks/tasks.component').then(m => m.TasksComponent)
   }
   ```

## Troubleshooting

### Common Issues

1. **Tasks Not Loading**:
   - Check API endpoint availability
   - Verify JWT token validity
   - Check organization membership

2. **Permission Errors**:
   - Verify user role in organization
   - Check permission matrix
   - Review audit logs

3. **UI Issues**:
   - Check Tailwind CSS compilation
   - Verify component imports
   - Check browser console for errors

### Debug Tools

1. **Browser DevTools**: Network tab for API calls
2. **Console Logging**: Detailed error messages
3. **Audit Logs**: Backend access attempt logging
4. **Supabase Dashboard**: Database query monitoring

## Conclusion

The Task Management System provides a comprehensive, secure, and user-friendly solution for managing tasks across multiple organizations. With its modern UI, robust permission system, and scalable architecture, it serves as a solid foundation for enterprise task management needs.

The system is designed to be:
- **User-friendly**: Intuitive interface with clear navigation
- **Secure**: Role-based access control with audit logging
- **Scalable**: Supports multiple organizations and users
- **Maintainable**: Clean code architecture with comprehensive documentation
- **Extensible**: Easy to add new features and enhancements
