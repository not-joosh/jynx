# Task Management Application

A full-stack task management application built with Nx monorepo, featuring role-based access control (RBAC) and multi-organization support.

## 🏗️ Architecture

### Backend (NestJS + TypeORM + Supabase PostgreSQL)
- **Framework**: NestJS with TypeORM
- **Database**: Supabase PostgreSQL
- **Authentication**: JWT with Supabase
- **Authorization**: Role-based access control (RBAC)

### Frontend (Angular + TailwindCSS)
- **Framework**: Angular 17+ with standalone components
- **Styling**: TailwindCSS with custom design system
- **State Management**: Angular services with RxJS
- **Authentication**: JWT token management

## 🧩 Core Features

### Data Models
- **Users**: User accounts with profile information
- **Organizations**: Multi-tenant organizations with hierarchy
- **Roles**: Owner, Admin, Viewer with permission inheritance
- **Permissions**: Granular access control for resources
- **Tasks**: Task management with organization scoping
- **Audit Logs**: Access and action logging

### Access Control Logic
- **Decorators/Guards**: Custom decorators for permission checking
- **Ownership**: Enforce resource ownership and organization-level access
- **Role Inheritance**: Implement hierarchical role permissions
- **Task Scoping**: Scope task visibility based on user role and organization
- **Audit Logging**: Console and file-based audit logging

## 🔐 Authentication & Authorization

### Authentication Flow
1. User registers → Account created in Supabase
2. User creates first organization → Organization setup3. JWT token stored and attached to all quests4. oken verification on all protected endpoints
### Role Hierarchy
```
Owner (Organization Creator)
├── Full organization control
├── User management
├── Role assignment
└── Audit log access

Admin (Organization Manager)
├── Task management
├── User invitation
├── Basic organization settings
└── Limited audit access

Viewer (Organization Member)
├── Task viewing
├── Basic task creation
└── Profile management
```

### Permission Matrix
| Resource | Owner | Admin | Viewer |
|----------|-------|-------|--------|
| Organization Settings | ✅ | ⚠️ | ❌ |
| User Management | ✅ | ⚠️ | ❌ |
| Task Management | ✅ | ✅ | ⚠️ |
| Task Viewing | ✅ | ✅ | ✅ |
| Audit Logs | ✅ | ⚠️ | ❌ |

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Environment Setup

#### Backend (.env)
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_JWT_AUD=authenticated

# Supabase Database Configuration
SUPABASE_DB_URL=postgresql://postgres:password@db.project.supabase.co:5432/postgres

NODE_ENV=development
```

#### Frontend (env.local.js)
```javascript
window.env = {
  SUPABASE_URL: 'your_supabase_url',
  SUPABASE_ANON_KEY: 'your_supabase_anon_key'
};
```

### Installation
```bash
# Install dependencies
npm install

# Start development servers
npx nx serve api      # Backend on :3001
npx nx serve dashboard # Frontend on :4200
```

## 📁 Project Structure

```
challenge/
├── apps/
│   ├── api/                 # NestJS Backend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── auth/    # JWT authentication
│   │   │   │   ├── user/    # User management
│   │   │   │   ├── organization/ # Organization CRUD
│   │   │   │   ├── task/    # Task management
│   │   │   │   └── audit/   # Audit logging
│   │   │   └── main.ts
│   │   └── .env
│   └── dashboard/           # Angular Frontend
│       ├── src/
│       │   ├── app/
│       │   │   ├── auth/    # Authentication components
│       │   │   ├── features/ # Feature modules
│       │   │   ├── core/    # Core services & guards
│       │   │   └── shared/  # Shared components
│       │   └── public/
│       │       └── env.local.js
├── libs/
│   ├── data/               # Shared data models
│   └── auth/               # Shared auth utilities
└── __DOCUMENTATION__/      # Project documentation
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/:id` - Get user by ID
- `GET /api/users/email/:email` - Get user by email
- `POST /api/users` - Create user
- `POST /api/users/with-organization` - Create user with organization

### Organizations
- `GET /api/organizations` - List user organizations
- `POST /api/organizations` - Create organization
- `PUT /api/organizations/:id` - Update organization
- `DELETE /api/organizations/:id` - Delete organization

### Tasks
- `GET /api/tasks` - List accessible tasks
- `POST /api/tasks` - Create task (with permission check)
- `PUT /api/tasks/:id` - Edit task (if permitted)
- `DELETE /api/tasks/:id` - Delete task (if permitted)

### Audit
- `GET /api/audit-log` - View access logs (Owner/Admin only)

## 🎨 Frontend Features

### Task Management Dashboard
- ✅ Create/Edit/Delete tasks
- ✅ Sort, filter, and categorize
- ✅ Drag-and-drop reordering
- ✅ Responsive design (mobile → desktop)

### Authentication UI
- ✅ Modern login/register forms
- ✅ JWT token management
- ✅ Automatic token attachment to requests
- ✅ Route protection with guards

### State Management
- ✅ Angular services with RxJS
- ✅ HTTP interceptors for auth
- ✅ Reactive forms with validation

## 🔒 Security Features

### JWT Authentication
- Supabase JWT verification
- Token refresh handling
- Secure token storage

### RBAC Implementation
- Role-based access control
- Permission decorators
- Resource-level authorization
- Organization scoping

### Audit Logging
- User action tracking
- Access attempt logging
- Security event monitoring

## 🧪 Testing

```bash
# Run unit tests
npx nx test api
npx nx test dashboard

# Run e2e tests
npx nx e2e dashboard-e2e
```

## 📦 Deployment

### Backend
- Deploy to Vercel, Railway, or similar
- Configure environment variables
- Set up Supabase database

### Frontend
- Deploy to Vercel, Netlify, or similar
- Configure environment variables
- Set up build pipeline

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.
