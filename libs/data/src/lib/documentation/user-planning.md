# User Planning & Onboarding Flow

## Overview
TaskFlow is a multi-tenant task management application with organization-based access control. Users can create their own organizations or be invited to existing ones.

## User Journey

### 1. New User Registration (Multi-step Form)
```
Step 1: Personal Information
├── First Name
├── Last Name
└── Email

Step 2: Organization Setup
├── Organization Name
├── Organization Description (optional)
└── Role Selection (Owner)

Step 3: Account Creation
├── Password
├── Password Confirmation
└── Terms & Conditions
```

### 2. Invited User Registration
```
Step 1: Accept Invitation
├── Verify Email
└── View Organization Details

Step 2: Personal Information
├── First Name
├── Last Name
└── Password Setup

Step 3: Account Activation
└── Redirect to Dashboard
```

## User States
- **Pending**: Invited but not yet registered
- **Active**: Fully registered and active
- **Suspended**: Temporarily disabled
- **Deleted**: Soft-deleted user

## Organization Hierarchy
```
Organization
├── Owner (1 per org)
├── Admins (multiple)
└── Viewers (multiple)
```

## Role Permissions

### Owner
- Full organization control
- User management
- Organization settings
- All task operations

### Admin
- User management (except owner)
- Task management
- Project management
- Organization settings (limited)

### Viewer
- View tasks assigned to them
- Update task status
- Comment on tasks
- View organization members (limited info)

## Access Control Matrix

| Resource | Owner | Admin | Viewer |
|----------|-------|-------|--------|
| Organization Settings | ✅ Full | ⚠️ Limited | ❌ None |
| User Management | ✅ Full | ⚠️ Limited | ❌ None |
| Task Creation | ✅ Full | ✅ Full | ❌ None |
| Task Assignment | ✅ Full | ✅ Full | ⚠️ Self only |
| Task Viewing | ✅ All | ✅ All | ⚠️ Assigned only |
| Project Management | ✅ Full | ✅ Full | ❌ None |
