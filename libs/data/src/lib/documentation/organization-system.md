# Organization & Multi-Tenant Architecture Documentation

## Overview

This application uses a **multi-tenant architecture** where each organization is completely isolated from others. Users belong to organizations and have specific roles within those organizations.

## Database Schema

### 1. Users Table
```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(50) DEFAULT 'viewer',
  current_organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. Organizations Table
```sql
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3. Organization Members Table
```sql
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);
```

## Registration Flow

When a user registers, the following happens:

### Step 1: Create User in Supabase Auth
- User account created in Supabase Auth system
- Email/password authentication handled by Supabase

### Step 2: Create User Profile
- User profile record created in `users` table
- Links to Supabase Auth user via `id` field
- Sets initial role as `owner`

### Step 3: Create Organization
- New organization created in `organizations` table
- User becomes the owner of this organization
- Organization name comes from registration form

### Step 4: Update User with Organization
- User's `current_organization_id` set to the new organization
- This allows the user to switch between organizations (future feature)

### Step 5: Create Organization Membership
- Membership record created in `organization_members` table
- User added to their own organization with `owner` role
- This enables role-based access control

### Step 6: Generate JWT Token
- JWT token includes:
  - User ID (`sub`)
  - Email
  - Organization ID
  - Role (`owner`)

## Role-Based Access Control (RBAC)

### Roles Hierarchy
```
OWNER > ADMIN > MEMBER > VIEWER
```

### Role Permissions

#### Owner
- ✅ Full control over organization
- ✅ Can delete organization
- ✅ Can manage all users
- ✅ Can manage all tasks/projects
- ✅ Can invite/remove members

#### Admin
- ✅ Can manage users (except owner)
- ✅ Can manage tasks/projects
- ✅ Can invite/remove members
- ❌ Cannot delete organization

#### Member
- ✅ Can create/edit their own tasks
- ✅ Can view organization tasks
- ❌ Cannot manage users
- ❌ Cannot invite members

#### Viewer
- ✅ Can view tasks assigned to them
- ✅ Can update task status
- ❌ Cannot create/edit tasks
- ❌ Cannot manage anything

## Multi-Tenant Data Isolation

### How It Works
1. **Organization Context**: Every request includes the user's current organization ID
2. **Data Filtering**: All queries filter by `organization_id`
3. **Complete Isolation**: Organizations cannot see each other's data

### Example Queries
```sql
-- Get tasks for current organization only
SELECT * FROM tasks 
WHERE organization_id = $1;

-- Get users in current organization only
SELECT u.* FROM users u
JOIN organization_members om ON u.id = om.user_id
WHERE om.organization_id = $1;
```

## Business Model Implications

### Pricing Tiers
- **Free**: 1 organization, 5 members
- **Pro**: Unlimited organizations, 50 members per org
- **Enterprise**: Unlimited everything

### User Experience
- Users can belong to multiple organizations
- Users can switch between organizations
- Each organization has its own data, tasks, projects
- Role permissions are per-organization

## Security Considerations

### Row Level Security (RLS)
```sql
-- Users can only see their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Organization members can see organization data
CREATE POLICY "Members can read organizations" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid()
    )
  );
```

### JWT Token Security
- Tokens include organization context
- Tokens expire after 7 days
- Tokens are verified on every request
- Invalid tokens result in 401 Unauthorized

## Future Enhancements

### Planned Features
- **Organization Switching**: Users can switch between organizations
- **Invitation System**: Send email invitations to join organizations
- **Organization Settings**: Customize organization preferences
- **Audit Logs**: Track all organization activities
- **Billing Integration**: Per-organization billing

### Scalability Considerations
- **Database Indexing**: Indexes on organization_id for performance
- **Caching**: Cache organization memberships
- **Rate Limiting**: Per-organization rate limits
- **Monitoring**: Track organization usage metrics

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Create user + organization
- `POST /api/v1/auth/login` - Authenticate user

### Organization Management (Future)
- `GET /api/v1/organizations` - List user's organizations
- `POST /api/v1/organizations` - Create new organization
- `PUT /api/v1/organizations/:id` - Update organization
- `DELETE /api/v1/organizations/:id` - Delete organization

### Member Management (Future)
- `GET /api/v1/organizations/:id/members` - List organization members
- `POST /api/v1/organizations/:id/members` - Invite new member
- `PUT /api/v1/organizations/:id/members/:userId` - Update member role
- `DELETE /api/v1/organizations/:id/members/:userId` - Remove member

## Testing Strategy

### Unit Tests
- Permission checking functions
- Role hierarchy validation
- Organization creation logic

### Integration Tests
- Complete registration flow
- Organization data isolation
- Role-based access control

### E2E Tests
- User registration journey
- Organization switching
- Member invitation flow
- Permission enforcement

## Monitoring & Analytics

### Key Metrics
- Organizations created per day
- Members per organization
- Role distribution
- Organization activity levels

### Alerts
- Failed organization creations
- Permission violations
- Unusual organization activity
- Database performance issues
