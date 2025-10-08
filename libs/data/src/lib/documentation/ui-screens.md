# UI Screens - TaskFlow Prototype

## Core Screens

### 1. Authentication Screens
- **Login Page** (`/auth/login`)
  - Email & Password form
  - "Create Account" link
  - "Forgot Password" link

- **Register Page** (`/auth/register`)
  - Multi-step form:
    1. Personal Info (First Name, Last Name, Email)
    2. Organization Setup (Organization Name, Description)
    3. Password Setup (Password, Confirm Password)

- **Invitation Accept Page** (`/auth/invite/:token`)
  - Show organization details
  - Personal info form
  - Password setup

### 2. Dashboard Screens
- **Main Dashboard** (`/dashboard`)
  - Organization switcher (if user has multiple orgs)
  - Quick stats (Total tasks, My tasks, Completed today)
  - Recent activity feed
  - Quick task creation

- **Organization Settings** (`/dashboard/settings`)
  - Organization name & description
  - Member management
  - Invite new members

### 3. Task Management Screens
- **Task List** (`/dashboard/tasks`)
  - Filter by status, priority, assignee
  - Search functionality
  - Create new task button
  - Task cards with basic info

- **Task Detail** (`/dashboard/tasks/:id`)
  - Task title, description, status, priority
  - Assignee selection
  - Status update buttons
  - Edit/Delete actions

- **Create/Edit Task** (`/dashboard/tasks/new` or `/dashboard/tasks/:id/edit`)
  - Title, description, priority
  - Assignee dropdown
  - Save/Cancel buttons

### 4. User Management Screens
- **Team Members** (`/dashboard/team`)
  - List of organization members
  - Role indicators (Owner, Admin, Viewer)
  - Invite new member button
  - Remove member action (for admins)

- **Invite Member** (`/dashboard/team/invite`)
  - Email input
  - Role selection (Admin, Viewer)
  - Send invitation button

### 5. Profile Screens
- **User Profile** (`/dashboard/profile`)
  - Personal information (Name, Email)
  - Change password
  - Organization memberships

## Navigation Structure

```
Header Navigation:
├── Logo (TaskFlow)
├── Organization Switcher (if multiple orgs)
├── Main Menu
│   ├── Dashboard
│   ├── Tasks
│   ├── Team
│   └── Settings
└── User Menu
    ├── Profile
    └── Logout
```

## Responsive Design
- **Mobile**: Collapsible sidebar, stacked layout
- **Tablet**: Sidebar with icons only
- **Desktop**: Full sidebar with labels

## Color Scheme
- **Primary**: Blue (#3B82F6)
- **Success**: Green (#10B981)
- **Warning**: Yellow (#F59E0B)
- **Error**: Red (#EF4444)
- **Neutral**: Gray (#6B7280)

## Task Status Colors
- **Draft**: Gray (#6B7280)
- **Todo**: Blue (#3B82F6)
- **In Progress**: Yellow (#F59E0B)
- **Review**: Purple (#8B5CF6)
- **Done**: Green (#10B981)
- **Archived**: Gray (#9CA3AF)

## Priority Colors
- **Critical**: Red (#EF4444)
- **High**: Orange (#F97316)
- **Medium**: Yellow (#F59E0B)
- **Low**: Green (#10B981)
