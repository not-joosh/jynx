# Jynx - Task Management System with RBAC

A comprehensive task management application built with Angular frontend and NestJS backend, featuring role-based access control (RBAC) and JWT authentication.

## 🏗️ Architecture Overview

This project uses an **NX Monorepo** structure for optimal code sharing and maintainability:

```
challenge/
├── apps/
│   ├── api/                 # NestJS Backend
│   └── dashboard/           # Angular Frontend
├── libs/
│   ├── auth/               # Authentication & RBAC logic
│   ├── data/               # Shared DTOs and interfaces
│   └── ui/                 # Shared UI components
```

### Why NX Monorepo?
- **Code Sharing**: Auth logic, DTOs, and UI components shared between frontend/backend
- **Type Safety**: TypeScript interfaces ensure consistency across the stack
- **Single Source of Truth**: RBAC permissions defined once, used everywhere
- **Scalability**: Easy to add new apps (mobile, admin panel, etc.)

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (for database and auth)

### 1. Clone and Install
```bash
git clone <your-repo>
cd challenge
npm install
```

### 2. Environment Setup

Create `.env` file in the root directory:
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Database Configuration
DATABASE_URL=your_supabase_database_url
```

### 3. Database Setup
```bash
# Run migrations to set up the database schema
npm run migrate
```

### 4. Run Applications

**Backend (NestJS):**
```bash
npx nx serve api
# Runs on http://localhost:3000
```

**Frontend (Angular):**
```bash
npx nx serve dashboard
# Runs on http://localhost:4200
```

## 📊 Data Model

### Core Entities

#### Users
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  password_hash VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Organizations
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tasks
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  status VARCHAR NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
  priority VARCHAR NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  category VARCHAR NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Entity Relationship Diagram
```
Users (1) ──→ (M) Organizations [owner_id]
Users (1) ──→ (M) Tasks [assigned_to]
Users (1) ──→ (M) Tasks [created_by]
Organizations (1) ──→ (M) Tasks [organization_id]
```

## 🔐 Access Control Implementation

### Role Hierarchy
```
OWNER > ADMIN > MEMBER
```

### Permission Matrix
| Action | Owner | Admin | Member |
|--------|-------|-------|--------|
| Create Organization | ✅ | ❌ | ❌ |
| Manage Members | ✅ | ✅ | ❌ |
| Create Tasks | ✅ | ✅ | ✅ |
| Edit All Tasks | ✅ | ✅ | ❌ |
| Edit Own Tasks | ✅ | ✅ | ✅ |
| Delete Tasks | ✅ | ✅ | ❌ |
| View Audit Logs | ✅ | ✅ | ❌ |

### Implementation Details

#### 1. RBAC Guards
```typescript
@Injectable()
export class RbacGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const requiredRole = this.reflector.get<Role>('role', context.getHandler());
    const user = context.switchToHttp().getRequest().user;
    
    return this.hasRole(user, requiredRole);
  }
}
```

#### 2. Role Inheritance Logic
```typescript
const roleHierarchy = {
  [Role.OWNER]: [Role.OWNER, Role.ADMIN, Role.MEMBER],
  [Role.ADMIN]: [Role.ADMIN, Role.MEMBER],
  [Role.MEMBER]: [Role.MEMBER]
};
```

#### 3. JWT Integration
- **Authentication**: Supabase JWT tokens
- **Authorization**: Custom guards check roles from JWT payload
- **Middleware**: Token verification on all protected routes

## 📡 API Documentation

### Authentication Endpoints

#### POST /api/v1/auth/login
```json
// Request
{
  "email": "user@example.com",
  "password": "password123"
}

// Response
{
  "access_token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "member"
  }
}
```

### Task Management Endpoints

#### GET /api/v1/tasks
**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "Complete project",
      "description": "Finish the task management system",
      "status": "in_progress",
      "priority": "high",
      "category": "work",
      "dueDate": "2024-01-15T00:00:00Z",
      "assignedTo": "user_uuid",
      "createdBy": "user_uuid",
      "organizationId": "org_uuid"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10
}
```

#### POST /api/v1/tasks
**Headers:** `Authorization: Bearer <jwt_token>`

**Request:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "priority": "medium",
  "category": "personal",
  "dueDate": "2024-01-20T00:00:00Z",
  "assignedTo": "user_uuid"
}
```

#### PUT /api/v1/tasks/:id
**Headers:** `Authorization: Bearer <jwt_token>`

**Request:** Same as POST

#### DELETE /api/v1/tasks/:id
**Headers:** `Authorization: Bearer <jwt_token>`

**Response:** `204 No Content`

### Organization Management

#### GET /api/v1/users/workspaces
**Headers:** `Authorization: Bearer <jwt_token>`

**Response:**
```json
{
  "organizations": [
    {
      "id": "uuid",
      "name": "Acme Corp",
      "description": "Company organization",
      "role": "owner",
      "memberCount": 5
    }
  ]
}
```

### Audit Logs

#### GET /api/v1/audit-log
**Headers:** `Authorization: Bearer <jwt_token>`
**Access:** Owner/Admin only

**Response:**
```json
{
  "logs": [
    {
      "id": "uuid",
      "action": "CREATE_TASK",
      "resource": "Task",
      "resourceId": "task_uuid",
      "userId": "user_uuid",
      "timestamp": "2024-01-10T10:30:00Z",
      "details": {
        "taskTitle": "New Task",
        "organizationId": "org_uuid"
      }
    }
  ]
}
```

## 🧪 Testing Strategy

### Backend Testing
```bash
# Run all tests
npm run test

# Run specific test suites
npm run test:auth
npm run test:rbac
npm run test:api
```

### Frontend Testing
```bash
# Run Angular tests
npm run test:dashboard

# Run with coverage
npm run test:dashboard -- --coverage
```

### Test Coverage Areas
- ✅ **RBAC Logic**: Role hierarchy and permission checks
- ✅ **Authentication**: JWT token validation
- ✅ **API Endpoints**: Request/response handling
- ✅ **Frontend Components**: UI interactions and state management
- ✅ **Integration**: End-to-end user flows

## 🎨 Frontend Features

### Task Management Dashboard
- ✅ **Create/Edit/Delete Tasks**: Full CRUD operations
- ✅ **Drag & Drop**: Reorder tasks and change status
- ✅ **Filtering & Sorting**: By status, priority, category, assignee
- ✅ **Responsive Design**: Mobile-first approach with TailwindCSS
- ✅ **Real-time Updates**: Live data synchronization

### Authentication UI
- ✅ **Login Form**: Email/password authentication
- ✅ **JWT Storage**: Secure token management
- ✅ **Auto-logout**: Token expiration handling
- ✅ **Role-based UI**: Different views for different roles

## 🔧 Development Commands

```bash
# Build all applications
npm run build

# Build specific app
npm run build:api
npm run build:dashboard

# Run in development mode
npm run dev:api
npm run dev:dashboard

# Run tests
npm run test
npm run test:watch

# Lint code
npm run lint
npm run lint:fix
```

## 🚀 Deployment

### Production Build
```bash
# Build for production
npm run build:production

# The built files will be in:
# - dist/apps/api/ (Backend)
# - dist/apps/dashboard/browser/ (Frontend)
```

### Environment Variables for Production
Ensure all environment variables are set in your production environment:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `DATABASE_URL`

## 📝 Key Features Implemented

### Security
- ✅ **JWT Authentication**: Real token-based auth (no mocks)
- ✅ **RBAC System**: Three-tier role hierarchy
- ✅ **Permission Guards**: Endpoint-level access control
- ✅ **Audit Logging**: Track all user actions
- ✅ **CORS Protection**: Secure cross-origin requests

### User Experience
- ✅ **Intuitive UI**: Clean, modern interface
- ✅ **Responsive Design**: Works on all devices
- ✅ **Real-time Updates**: Live data synchronization
- ✅ **Drag & Drop**: Intuitive task management
- ✅ **Role-based Views**: Different UI for different roles

### Architecture
- ✅ **NX Monorepo**: Scalable, maintainable structure
- ✅ **Type Safety**: Full TypeScript implementation
- ✅ **Code Sharing**: Reusable libraries and components
- ✅ **Modular Design**: Clean separation of concerns
- ✅ **Test Coverage**: Comprehensive testing strategy

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.