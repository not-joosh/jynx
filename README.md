# Task Management System

A comprehensive task management application built with Angular frontend and NestJS backend, featuring role-based access control (RBAC) and organization management.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Setup Instructions

1. **Clone and Install Dependencies**
   ```bash
   git clone <your-repo-url>
   cd challenge
   npm install
   ```

2. **Environment Configuration**
   Create `.env` files in both `apps/api` and `apps/dashboard`:
   
   **Backend (.env)**
   ```env
   JWT_SECRET=your-super-secret-jwt-key-here
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
   PORT=3000
   ```

   **Frontend (.env)**
   ```env
   SUPABASE_URL=your-supabase-url
   SUPABASE_ANON_KEY=your-supabase-anon-key
   API_BASE_URL=http://localhost:3000/api/v1
   ```

3. **Database Setup**
   - Create a new Supabase project
   - Run the SQL migrations in `database/migrations/` in order
   - Enable Row Level Security (RLS) policies

4. **Run the Applications**
   ```bash
   # Start backend API
   npx nx serve api
   
   # Start frontend dashboard (in another terminal)
npx nx serve dashboard
```

5. **Access the Application**
   - Frontend: http://localhost:4200
   - Backend API: http://localhost:3000

## 🏗️ Architecture Overview

### NX Monorepo Structure
```
challenge/
├── apps/
│   ├── api/                 # NestJS backend API
│   ├── dashboard/           # Angular frontend
│   └── dashboard-e2e/       # End-to-end tests
├── libs/
│   ├── auth/               # Authentication & RBAC logic
│   ├── data/               # Shared DTOs and types
│   └── ui/                 # Shared UI components
└── database/
    └── migrations/         # SQL migration scripts
```

### Shared Libraries Rationale
- **`@challenge/auth`**: Centralized authentication, JWT handling, and RBAC logic
- **`@challenge/data`**: Shared data models, DTOs, and enums across frontend/backend
- **`@challenge/ui`**: Reusable UI components and styling

## 📊 Data Model

### Core Entities

#### Users
- `id` (UUID, Primary Key)
- `email` (Unique)
- `first_name`, `last_name`
- `created_at`, `updated_at`

#### Organizations
- `id` (UUID, Primary Key)
- `name`
- `created_at`, `updated_at`

#### Organization Members
- `user_id` (FK to Users)
- `organization_id` (FK to Organizations)
- `role` (ENUM: owner, admin, member)
- `joined_at`

#### Tasks
- `id` (UUID, Primary Key)
- `title`, `description`
- `status` (ENUM: todo, in_progress, blocked, completed)
- `priority` (ENUM: critical, high, medium, low)
- `organization_id` (FK to Organizations)
- `assignee_id` (FK to Users, nullable)
- `creator_id` (FK to Users)
- `created_at`, `updated_at`, `completed_at`

#### Notifications
- `id` (UUID, Primary Key)
- `user_id` (FK to Users)
- `type` (ENUM: info, warning, error, invitation)
- `title`, `message`
- `is_read`, `created_at`

### Entity Relationship Diagram
```
Users ──┐
        ├── OrganizationMembers ──┐
        │                        │
Organizations ───────────────────┘
        │
        ├── Tasks ──┐
        │           │
        └── Notifications ──┘
```

## 🔐 Access Control Implementation

### Role Hierarchy
```
OWNER > ADMIN > MEMBER
```

### Permission System
- **OWNER**: Full access to organization and all tasks
- **ADMIN**: Can manage tasks, invite/remove members, change roles (except owner)
- **MEMBER**: Can create tasks, complete assigned tasks, view organization data

### JWT Integration
- JWT tokens contain: `userId`, `organizationId`, `role`
- Frontend extracts role from JWT for permission checks
- Backend validates JWT and enforces permissions via guards

### Permission Guards
- `JwtAuthGuard`: Validates JWT token
- `AccessControlGuard`: Checks user permissions for specific actions
- `@RequirePermission()` decorator: Declarative permission requirements

## 🔌 API Documentation

### Authentication Endpoints
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password"
}

Response:
{
  "access_token": "jwt-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "admin"
  }
}
```

### Task Management
```http
GET /api/v1/tasks
Authorization: Bearer <jwt-token>

POST /api/v1/tasks
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Task Title",
  "description": "Task description",
  "priority": "high",
  "assigneeId": "user-uuid"
}

PUT /api/v1/tasks/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "Updated Title",
  "status": "completed"
}
```

### Organization Management
```http
GET /api/v1/users/workspaces
Authorization: Bearer <jwt-token>

POST /api/v1/organizations/:id/invitations
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "email": "newuser@example.com",
  "role": "member"
}

GET /api/v1/members
Authorization: Bearer <jwt-token>
```

### Notifications
```http
GET /api/v1/notifications
Authorization: Bearer <jwt-token>

PUT /api/v1/notifications/:id/read
Authorization: Bearer <jwt-token>

DELETE /api/v1/notifications/:id
Authorization: Bearer <jwt-token>
```

## 🧪 Testing Strategy

### Backend Testing
- **Jest** for unit tests
- **RBAC Logic**: Test permission checks and role hierarchy
- **Authentication**: Test JWT validation and user management
- **API Endpoints**: Test CRUD operations and error handling

### Frontend Testing
- **Jest/Karma** for component tests
- **Component Logic**: Test task management, member management
- **State Management**: Test authentication state and user permissions
- **UI Interactions**: Test forms, modals, and navigation

### Test Commands
```bash
# Run all tests
npx nx test

# Run specific test suites
npx nx test dashboard --testPathPattern="auth.service.spec.ts"
npx nx test api --testPathPattern="tasks.spec.ts"
```

## 🔮 Future Considerations

### Attribute-Based Access Control (ABAC)
While the current system uses Role-Based Access Control (RBAC), consider migrating to **Attribute-Based Access Control (ABAC)** for more granular permissions:

#### Benefits of ABAC:
- **Dynamic Permissions**: Based on user attributes, resource attributes, and environmental context
- **Fine-grained Control**: Permissions based on time, location, data sensitivity, etc.
- **Scalability**: Easier to manage complex permission scenarios
- **Compliance**: Better support for regulatory requirements

#### ABAC Implementation Example:
```typescript
// Instead of: hasRole('admin')
// Use: hasPermission('task:edit', { 
//   resource: task, 
//   context: { timeOfDay: 'business-hours', location: 'office' }
// })
```

#### Migration Path:
1. **Phase 1**: Extend current RBAC with attribute checks
2. **Phase 2**: Introduce policy engine (e.g., Open Policy Agent)
3. **Phase 3**: Migrate to full ABAC with context-aware permissions

### Additional Enhancements
- **Real-time Updates**: WebSocket integration for live task updates
- **File Attachments**: Task file uploads and management
- **Advanced Filtering**: Complex task queries and saved filters
- **Audit Logging**: Comprehensive activity tracking
- **Mobile App**: React Native or Flutter mobile application
- **API Rate Limiting**: Protect against abuse and ensure fair usage

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📞 Support

For questions or issues, please open an issue in the repository or contact the development team.