# Proposed Authentication Implementation Plan

## Phase 1: Supabase Integration Setup

### 1.1 Install Supabase Client
```bash
npm install @supabase/supabase-js
```

### 1.2 Create Supabase Service
```typescript
// apps/api/src/app/supabase/supabase.service.ts
@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(
      process.env['SUPABASE_URL'],
      process.env['SUPABASE_SERVICE_ROLE_KEY']
    );
  }

  get auth() {
    return this.supabase.auth;
  }

  get database() {
    return this.supabase;
  }
}
```

### 1.3 Update Authentication Service
Replace mock authentication with real Supabase calls:

```typescript
// apps/api/src/app/auth/auth.service.ts
async login(loginDto: LoginDto): Promise<AuthResponseDto> {
  const { data, error } = await this.supabaseService.auth.signInWithPassword({
    email: loginDto.email,
    password: loginDto.password,
  });

  if (error) throw new UnauthorizedException('Invalid credentials');

  // Fetch user profile
  const { data: profile } = await this.supabaseService.database
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .single();

  // Generate JWT
  const payload = { sub: data.user.id, email: data.user.email };
  return {
    access_token: this.jwtService.sign(payload),
    user: {
      id: data.user.id,
      email: data.user.email,
      firstName: profile.first_name,
      lastName: profile.last_name,
    },
  };
}
```

## Phase 2: Database Schema Implementation

### 2.1 Create Database Tables
Execute these SQL commands in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  current_organization_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organizations table
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Organization members table
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'viewer')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);

-- Add foreign key constraint
ALTER TABLE public.users 
ADD CONSTRAINT fk_users_current_organization 
FOREIGN KEY (current_organization_id) 
REFERENCES public.organizations(id);

-- Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_organizations_owner_id ON public.organizations(owner_id);
CREATE INDEX idx_organization_members_user_id ON public.organization_members(user_id);
CREATE INDEX idx_organization_members_organization_id ON public.organization_members(organization_id);
```

### 2.2 Set up Row Level Security (RLS)
```sql
-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can read own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Organization owners can read their organizations
CREATE POLICY "Owners can read organizations" ON public.organizations
  FOR SELECT USING (auth.uid() = owner_id);

-- Organization members can read organizations they belong to
CREATE POLICY "Members can read organizations" ON public.organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid()
    )
  );

-- Organization members can read membership data
CREATE POLICY "Members can read membership" ON public.organization_members
  FOR SELECT USING (user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.organizations 
      WHERE id = organization_members.organization_id 
      AND owner_id = auth.uid()
    )
  );
```

## Phase 3: Registration Flow Implementation

### 3.1 Update Registration Service
```typescript
async register(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
  // Step 1: Create user in Supabase Auth
  const { data: authData, error: authError } = await this.supabaseService.auth.signUp({
    email: createUserDto.email,
    password: createUserDto.password,
    options: {
      data: {
        first_name: createUserDto.firstName,
        last_name: createUserDto.lastName,
      }
    }
  });

  if (authError) throw new UnauthorizedException('Registration failed');

  // Step 2: Create user profile in database
  const { error: profileError } = await this.supabaseService.database
    .from('users')
    .insert({
      id: authData.user.id,
      email: createUserDto.email,
      first_name: createUserDto.firstName,
      last_name: createUserDto.lastName,
    });

  if (profileError) throw new InternalServerErrorException('Failed to create user profile');

  // Step 3: Create organization
  const { data: orgData, error: orgError } = await this.supabaseService.database
    .from('organizations')
    .insert({
      name: createUserDto.organizationName,
      description: createUserDto.organizationDescription,
      owner_id: authData.user.id,
    })
    .select()
    .single();

  if (orgError) throw new InternalServerErrorException('Failed to create organization');

  // Step 4: Update user with organization
  await this.supabaseService.database
    .from('users')
    .update({ current_organization_id: orgData.id })
    .eq('id', authData.user.id);

  // Step 5: Create organization membership
  await this.supabaseService.database
    .from('organization_members')
    .insert({
      user_id: authData.user.id,
      organization_id: orgData.id,
      role: 'owner',
    });

  // Step 6: Generate JWT token
  const payload = { 
    sub: authData.user.id, 
    email: authData.user.email,
    organizationId: orgData.id 
  };
  
  return {
    access_token: this.jwtService.sign(payload),
    user: {
      id: authData.user.id,
      email: authData.user.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
    },
  };
}
```

## Phase 4: Frontend Updates

### 4.1 Update Environment Configuration
```typescript
// apps/dashboard/src/environments/environment.ts
export const environment = {
  production: false,
  supabase: {
    url: 'https://jtdteelgmbzskeaksbmi.supabase.co',
    anonKey: 'your-actual-anon-key',
  },
  api: {
    baseUrl: 'http://localhost:3000/api/v1',
  },
  app: {
    name: 'Jynx',
    version: '1.0.0',
  },
};
```

### 4.2 Update Registration Form
The registration form now includes:
- ✅ Password confirmation field
- ✅ Real-time validation
- ✅ Step-by-step progression
- ✅ Error handling for Supabase responses

## Phase 5: Testing and Validation

### 5.1 Test Registration Flow
1. Fill out registration form with password confirmation
2. Verify password matching validation
3. Complete multi-step form
4. Check Supabase Auth user creation
5. Verify database records (users, organizations, members)
6. Confirm JWT token generation
7. Test dashboard access

### 5.2 Test Login Flow
1. Use created credentials to login
2. Verify Supabase authentication
3. Check JWT token generation
4. Confirm user data retrieval
5. Test protected route access

### 5.3 Test API Protection
1. Make API requests without token (should fail)
2. Make API requests with invalid token (should fail)
3. Make API requests with valid token (should succeed)
4. Test token expiration handling

## Phase 6: Production Considerations

### 6.1 Security Hardening
- [ ] Implement rate limiting
- [ ] Add CORS configuration
- [ ] Set up security headers
- [ ] Configure HTTPS in production
- [ ] Implement proper error logging

### 6.2 Performance Optimization
- [ ] Add database connection pooling
- [ ] Implement caching strategies
- [ ] Optimize JWT token size
- [ ] Add request/response compression

### 6.3 Monitoring and Analytics
- [ ] Set up authentication event logging
- [ ] Implement user activity tracking
- [ ] Add performance monitoring
- [ ] Set up error alerting

## Implementation Timeline

### Week 1: Foundation
- [ ] Set up Supabase project
- [ ] Create database schema
- [ ] Implement basic Supabase service
- [ ] Update authentication service

### Week 2: Core Features
- [ ] Implement registration flow
- [ ] Implement login flow
- [ ] Add JWT token handling
- [ ] Update frontend forms

### Week 3: Testing & Refinement
- [ ] Comprehensive testing
- [ ] Error handling improvements
- [ ] Performance optimization
- [ ] Security review

### Week 4: Production Readiness
- [ ] Security hardening
- [ ] Monitoring setup
- [ ] Documentation completion
- [ ] Deployment preparation

## Success Metrics

### Technical Metrics
- [ ] 100% test coverage for authentication flows
- [ ] < 200ms average authentication response time
- [ ] 99.9% authentication service uptime
- [ ] Zero security vulnerabilities

### User Experience Metrics
- [ ] < 3 steps to complete registration
- [ ] < 2 seconds to login
- [ ] Clear error messages for all failure cases
- [ ] Intuitive multi-step form progression

### Security Metrics
- [ ] All API endpoints protected
- [ ] JWT tokens properly validated
- [ ] Password security requirements met
- [ ] No sensitive data exposure
