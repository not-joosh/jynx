# Authentication System Documentation

## Overview
This document outlines the complete authentication system for Jynx, a task management application using Supabase for authentication and JWT tokens for API access.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Supabase      │
│   (Angular)     │    │   (NestJS)      │    │   (Auth + DB)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │ 1. Login/Register     │                       │
         ├──────────────────────►│                       │
         │                       │ 2. Auth with Supabase │
         │                       ├──────────────────────►│
         │                       │ 3. User Data          │
         │                       │◄──────────────────────┤
         │ 4. JWT Token          │                       │
         │◄──────────────────────┤                       │
         │                       │                       │
         │ 5. API Requests       │                       │
         │    (with JWT)         │                       │
         ├──────────────────────►│                       │
         │                       │ 6. Verify JWT         │
         │                       │ 7. Process Request    │
         │ 8. Response           │                       │
         │◄──────────────────────┤                       │
```

## Authentication Flow

### 1. User Registration Flow (Complete Implementation)

**Step-by-Step Registration Process:**

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant SA as Supabase Auth
    participant DB as Supabase Database

    U->>F: Fill multi-step registration form
    Note over F: Step 1: Personal Info<br/>Step 2: Organization Setup<br/>Step 3: Password Setup
    F->>F: Validate form (password confirmation)
    F->>B: POST /auth/register
    Note over B: Registration payload:<br/>{email, password, firstName,<br/>lastName, organizationName}
    
    B->>SA: Create user in Supabase Auth
    Note over SA: signUp(email, password, userData)
    SA-->>B: ✅ User created + auth token
    
    B->>DB: Create user profile in users table
    Note over DB: INSERT INTO users<br/>(id, email, first_name, last_name, role)
    DB-->>B: ✅ User profile created
    
    B->>DB: Create organization in organizations table
    Note over DB: INSERT INTO organizations<br/>(name, description, owner_id)
    DB-->>B: ✅ Organization created
    
    B->>DB: Update user with organization ID
    Note over DB: UPDATE users SET<br/>current_organization_id = org_id
    DB-->>B: ✅ User updated with organization
    
    B->>DB: Create organization membership
    Note over DB: INSERT INTO organization_members<br/>(user_id, organization_id, role)
    DB-->>B: ✅ Membership created
    
    B->>B: Generate JWT token with organization context
    Note over B: JWT payload:<br/>{sub: userId, email,<br/>organizationId, role: 'owner'}
    
    B-->>F: Return JWT + user data
    F->>F: Store JWT in localStorage
    F->>F: Navigate to dashboard
```

**Database Records Created During Registration:**

1. **Supabase Auth Users Table** (managed by Supabase):
   ```sql
   id: "550e8400-e29b-41d4-a716-446655440000"
   email: "user@example.com"
   encrypted_password: "hashed_password"
   email_confirmed_at: "2024-01-01T00:00:00Z"
   ```

2. **Users Table** (our custom table):
   ```sql
   id: "550e8400-e29b-41d4-a716-446655440000"  -- Links to auth.users
   email: "user@example.com"
   first_name: "John"
   last_name: "Doe"
   role: "owner"
   current_organization_id: "org-uuid-here"
   created_at: "2024-01-01T00:00:00Z"
   updated_at: "2024-01-01T00:00:00Z"
   ```

3. **Organizations Table**:
   ```sql
   id: "org-uuid-here"
   name: "John's Company"
   description: ""
   owner_id: "550e8400-e29b-41d4-a716-446655440000"
   created_at: "2024-01-01T00:00:00Z"
   updated_at: "2024-01-01T00:00:00Z"
   ```

4. **Organization Members Table**:
   ```sql
   id: "member-uuid-here"
   user_id: "550e8400-e29b-41d4-a716-446655440000"
   organization_id: "org-uuid-here"
   role: "owner"
   joined_at: "2024-01-01T00:00:00Z"
   ```

**Registration Flow Implementation Details:**

```typescript
// Backend: apps/api/src/app/auth/auth.service.ts
async register(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
  try {
    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await this.supabaseService.signUp(
      createUserDto.email,
      createUserDto.password,
      {
        first_name: createUserDto.firstName,
        last_name: createUserDto.lastName,
      }
    );

    if (authError) {
      throw new UnauthorizedException('Registration failed: ' + authError.message);
    }

    console.log('✅ User created in Supabase Auth:', authData.user.id);

    // Step 2: Create user profile in database
    const { error: profileError } = await this.supabaseService.createUserProfile({
      id: authData.user.id,
      email: createUserDto.email,
      first_name: createUserDto.firstName,
      last_name: createUserDto.lastName,
      role: 'owner', // First user becomes owner
    });

    if (profileError) {
      throw new InternalServerErrorException('Failed to create user profile: ' + profileError.message);
    }

    console.log('✅ User profile created in database');

    // Step 3: Create organization
    const { data: orgData, error: orgError } = await this.supabaseService.createOrganization({
      name: createUserDto.organizationName,
      description: '', // organizationDescription not in DTO
      owner_id: authData.user.id,
    });

    if (orgError) {
      throw new InternalServerErrorException('Failed to create organization: ' + orgError.message);
    }

    console.log('✅ Organization created:', orgData.id);

    // Step 4: Update user with organization
    const { error: updateError } = await this.supabaseService.getClient()
      .from('users')
      .update({ current_organization_id: orgData.id })
      .eq('id', authData.user.id);

    if (updateError) {
      throw new InternalServerErrorException('Failed to update user with organization: ' + updateError.message);
    }

    console.log('✅ User updated with organization');

    // Step 5: Create organization membership
    const { error: memberError } = await this.supabaseService.createOrganizationMember({
      user_id: authData.user.id,
      organization_id: orgData.id,
      role: 'owner',
    });

    if (memberError) {
      throw new InternalServerErrorException('Failed to create organization membership: ' + memberError.message);
    }

    console.log('✅ Organization membership created');

    // Step 6: Generate JWT token
    const payload = { 
      sub: authData.user.id, 
      email: authData.user.email,
      organizationId: orgData.id,
      role: 'owner'
    };
    
    console.log('✅ Registration completed successfully');
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: authData.user.id,
        email: authData.user.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      },
    };
  } catch (error) {
    if (error instanceof UnauthorizedException || error instanceof InternalServerErrorException) {
      throw error;
    }
    console.error('❌ Registration failed:', error);
    throw new UnauthorizedException('Registration failed');
  }
}
```

**Frontend Registration Form Flow:**

```typescript
// Frontend: apps/dashboard/src/app/features/auth/register/register.component.ts
onSubmit() {
  if (this.registerForm.valid) {
    const formValue = this.registerForm.value;
    const createUserDto: CreateUserDto = {
      email: formValue.email,
      password: formValue.password,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      organizationName: formValue.organizationName,
    };

    this.authService.register(createUserDto).subscribe({
      next: (response) => {
        console.log('✅ Registration successful:', response);
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('❌ Registration failed:', error);
        this.errorMessage = error.error?.message || 'Registration failed';
      }
    });
  }
}
```

**Error Handling During Registration:**

1. **Supabase Auth Errors:**
   - Email already exists
   - Weak password
   - Invalid email format

2. **Database Errors:**
   - User profile creation fails
   - Organization creation fails
   - Membership creation fails

3. **JWT Generation Errors:**
   - Invalid secret key
   - Token signing failure

**Success Criteria:**
- ✅ User created in Supabase Auth
- ✅ User profile created in database
- ✅ Organization created
- ✅ User added to organization as owner
- ✅ JWT token generated with organization context
- ✅ User redirected to dashboard

### 2. User Login Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend API
    participant S as Supabase Auth
    participant DB as Supabase DB

    U->>F: Enter credentials
    F->>B: POST /auth/login
    B->>S: Authenticate user
    S-->>B: Auth success + user data
    B->>DB: Fetch user profile
    B->>B: Generate JWT token
    B-->>F: Return JWT + user data
    F->>F: Store JWT in localStorage
    F->>F: Navigate to dashboard
```

### 3. API Request Flow (Authenticated)

```mermaid
sequenceDiagram
    participant F as Frontend
    participant B as Backend API
    participant DB as Supabase DB

    F->>F: Add JWT to request headers
    F->>B: API Request (with JWT)
    B->>B: Verify JWT signature
    B->>B: Check JWT expiration
    B->>B: Extract user ID from JWT
    B->>DB: Query with user context
    DB-->>B: Return data
    B-->>F: Return response
```

## Technical Implementation

### Frontend (Angular)

#### 1. Authentication Service (`auth.service.ts`)
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<UserDto | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Login with Supabase
  login(loginDto: LoginDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/auth/login`, loginDto)
      .pipe(tap(response => {
        this.setToken(response.access_token);
        this.currentUserSubject.next(response.user);
      }));
  }

  // Register with Supabase
  register(createUserDto: CreateUserDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.apiUrl}/auth/register`, createUserDto)
      .pipe(tap(response => {
        this.setToken(response.access_token);
        this.currentUserSubject.next(response.user);
      }));
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
}
```

#### 2. HTTP Interceptor (`auth.interceptor.ts`)
```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();
  
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    return next(authReq);
  }
  
  return next(req);
};
```

#### 3. Route Guard (`auth.guard.ts`)
```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['/auth/login']);
      return false;
    }
  }
}
```

### Backend (NestJS)

#### 1. Authentication Module (`auth.module.ts`)
```typescript
@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.register({
      secret: backendConfig.jwt.secret,
      signOptions: { expiresIn: backendConfig.jwt.expiresIn },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

#### 2. Authentication Service (`auth.service.ts`)
```typescript
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private supabaseService: SupabaseService
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    // Authenticate with Supabase
    const { data, error } = await this.supabaseService.auth.signInWithPassword({
      email: loginDto.email,
      password: loginDto.password,
    });

    if (error) throw new UnauthorizedException('Invalid credentials');

    // Fetch user profile from database
    const userProfile = await this.getUserProfile(data.user.id);

    // Generate JWT token
    const payload = { 
      sub: data.user.id, 
      email: data.user.email,
      organizationId: userProfile.currentOrganizationId 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
      },
    };
  }

  async register(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    // Create user in Supabase Auth
    const { data, error } = await this.supabaseService.auth.signUp({
      email: createUserDto.email,
      password: createUserDto.password,
    });

    if (error) throw new UnauthorizedException('Registration failed');

    // Create user profile in database
    const userProfile = await this.createUserProfile({
      id: data.user.id,
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
    });

    // Create organization
    const organization = await this.createOrganization({
      name: createUserDto.organizationName,
      description: createUserDto.organizationDescription,
      ownerId: data.user.id,
    });

    // Update user with organization
    await this.updateUserOrganization(data.user.id, organization.id);

    // Generate JWT token
    const payload = { 
      sub: data.user.id, 
      email: data.user.email,
      organizationId: organization.id 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: data.user.id,
        email: data.user.email,
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
      },
    };
  }
}
```

#### 3. JWT Strategy (`jwt.strategy.ts`)
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: backendConfig.jwt.secret,
    });
  }

  async validate(payload: any) {
    const user = await this.authService.validateToken(payload);
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
```

#### 4. JWT Guard (`jwt-auth.guard.ts`)
```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  current_organization_id UUID REFERENCES organizations(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Organizations Table
```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Organization Members Table
```sql
CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  role VARCHAR(50) DEFAULT 'viewer',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);
```

## Security Considerations

### 1. JWT Token Security
- **Secret Key**: Stored in environment variables, never in code
- **Expiration**: Tokens expire after 7 days (configurable)
- **Signature Verification**: All tokens verified on each request
- **Storage**: Tokens stored in localStorage (consider httpOnly cookies for production)

### 2. Password Security
- **Hashing**: Passwords hashed using bcryptjs (10 rounds)
- **Validation**: Minimum 6 characters, confirmation required
- **Supabase**: Handles password complexity requirements

### 3. API Security
- **CORS**: Configured for specific origins
- **Rate Limiting**: Implemented on authentication endpoints
- **Input Validation**: All inputs validated using DTOs
- **SQL Injection**: Protected by TypeORM parameterized queries

### 4. Route Protection
- **Guards**: All protected routes use AuthGuard
- **Redirects**: Unauthenticated users redirected to login
- **Token Refresh**: Automatic token validation on route changes

## Environment Configuration

### Frontend (.env)
```bash
NG_APP_SUPABASE_URL=https://your-project.supabase.co
NG_APP_SUPABASE_ANON_KEY=your-anon-key
NG_APP_API_URL=http://localhost:3000/api/v1
```

### Backend (.env)
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-jwt-secret-key
JWT_EXPIRES_IN=7d
API_PORT=3000
FRONTEND_URL=http://localhost:4200
```

## Error Handling

### Authentication Errors
- **Invalid Credentials**: 401 Unauthorized
- **Token Expired**: 401 Unauthorized with specific message
- **Missing Token**: 401 Unauthorized
- **Invalid Token**: 401 Unauthorized

### Registration Errors
- **Email Already Exists**: 409 Conflict
- **Weak Password**: 400 Bad Request
- **Invalid Email**: 400 Bad Request
- **Password Mismatch**: 400 Bad Request (frontend validation)

## Testing Strategy

### Unit Tests
- Authentication service methods
- JWT token generation/validation
- Password hashing/verification
- Route guard logic

### Integration Tests
- Complete login flow
- Complete registration flow
- API endpoint protection
- Database operations

### E2E Tests
- User registration journey
- User login journey
- Protected route access
- Token expiration handling

## Monitoring and Logging

### Authentication Events
- Login attempts (success/failure)
- Registration attempts
- Token generation
- Token validation failures
- Password reset requests

### Security Monitoring
- Failed login attempts per IP
- Suspicious activity patterns
- Token usage patterns
- API endpoint access patterns

## Future Enhancements

### Planned Features
- **Two-Factor Authentication**: SMS/Email OTP
- **Social Login**: Google, GitHub, etc.
- **Password Reset**: Email-based reset flow
- **Session Management**: Multiple device sessions
- **Audit Logging**: Comprehensive activity logs
- **Role-Based Access**: Granular permissions

### Security Improvements
- **Refresh Tokens**: Separate refresh token mechanism
- **Device Fingerprinting**: Track device-specific tokens
- **Geolocation**: Location-based access control
- **Rate Limiting**: Advanced rate limiting strategies
- **Security Headers**: Comprehensive security headers
