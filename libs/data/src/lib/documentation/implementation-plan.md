# Organization Invitations & Workspace Management - Implementation Plan

## Phase 1: Database Schema & Backend Foundation (Week 1)

### 1.1 Database Tables
```sql
-- Organization Invitations Table
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by UUID REFERENCES users(id) ON DELETE CASCADE,
  invited_email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'member', 'viewer')),
  token VARCHAR(255) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  personal_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update Organization Members Table
ALTER TABLE organization_members 
ADD COLUMN invited_by UUID REFERENCES users(id),
ADD COLUMN invitation_id UUID REFERENCES organization_invitations(id),
ADD COLUMN joined_via VARCHAR(50) DEFAULT 'direct' CHECK (joined_via IN ('direct', 'invitation', 'owner'));

-- Create Indexes
CREATE INDEX idx_org_invitations_email ON organization_invitations(invited_email);
CREATE INDEX idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX idx_org_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX idx_org_invitations_status ON organization_invitations(status);
```

### 1.2 Backend API Endpoints
```typescript
// Invitation Management
POST   /api/v1/organizations/:id/invitations
GET    /api/v1/organizations/:id/invitations
GET    /api/v1/organizations/:id/invitations/:invitationId
PUT    /api/v1/organizations/:id/invitations/:invitationId
DELETE /api/v1/organizations/:id/invitations/:invitationId

// Invitation Acceptance
GET    /api/v1/invitations/:token
POST   /api/v1/invitations/:token/accept
POST   /api/v1/invitations/:token/decline

// Workspace Management
GET    /api/v1/users/workspaces
POST   /api/v1/users/workspaces/switch
GET    /api/v1/organizations/:id/members
```

### 1.3 Backend Services
- **InvitationService**: Handle invitation CRUD operations
- **EmailService**: Send invitation emails with templates
- **TokenService**: Generate and validate invitation tokens
- **WorkspaceService**: Manage user workspace switching

## Phase 2: Backend Implementation (Week 2)

### 2.1 Invitation Service
```typescript
@Injectable()
export class InvitationService {
  async createInvitation(orgId: string, createInvitationDto: CreateInvitationDto, inviterId: string): Promise<InvitationDto>
  async getInvitations(orgId: string): Promise<InvitationDto[]>
  async getInvitationByToken(token: string): Promise<InvitationDto>
  async acceptInvitation(token: string, acceptDto: AcceptInvitationDto): Promise<AuthResponseDto>
  async declineInvitation(token: string, declineDto: DeclineInvitationDto): Promise<void>
  async cancelInvitation(orgId: string, invitationId: string): Promise<void>
  async resendInvitation(orgId: string, invitationId: string): Promise<void>
}
```

### 2.2 Email Service
```typescript
@Injectable()
export class EmailService {
  async sendInvitationEmail(invitation: InvitationDto): Promise<void>
  async sendInvitationReminder(invitation: InvitationDto): Promise<void>
  async sendInvitationAcceptedNotification(invitation: InvitationDto): Promise<void>
}
```

### 2.3 Workspace Service
```typescript
@Injectable()
export class WorkspaceService {
  async getUserWorkspaces(userId: string): Promise<WorkspaceDto[]>
  async switchWorkspace(userId: string, orgId: string): Promise<WorkspaceSwitchResponseDto>
  async getOrganizationMembers(orgId: string): Promise<OrganizationMemberDto[]>
  async removeMember(orgId: string, userId: string): Promise<void>
}
```

### 2.4 Controllers
```typescript
@Controller('organizations/:id/invitations')
export class InvitationController {
  @Post()
  @UseGuards(JwtAuthGuard)
  async createInvitation(@Param('id') orgId: string, @Body() dto: CreateInvitationDto): Promise<InvitationDto>
  
  @Get()
  @UseGuards(JwtAuthGuard)
  async getInvitations(@Param('id') orgId: string): Promise<InvitationDto[]>
  
  @Delete(':invitationId')
  @UseGuards(JwtAuthGuard)
  async cancelInvitation(@Param('id') orgId: string, @Param('invitationId') invitationId: string): Promise<void>
}

@Controller('invitations')
export class InvitationAcceptanceController {
  @Get(':token')
  async getInvitationByToken(@Param('token') token: string): Promise<InvitationDto>
  
  @Post(':token/accept')
  async acceptInvitation(@Param('token') token: string, @Body() dto: AcceptInvitationDto): Promise<AuthResponseDto>
  
  @Post(':token/decline')
  async declineInvitation(@Param('token') token: string, @Body() dto: DeclineInvitationDto): Promise<void>
}

@Controller('users/workspaces')
export class WorkspaceController {
  @Get()
  @UseGuards(JwtAuthGuard)
  async getUserWorkspaces(): Promise<WorkspaceDto[]>
  
  @Post('switch')
  @UseGuards(JwtAuthGuard)
  async switchWorkspace(@Body() dto: SwitchWorkspaceDto): Promise<WorkspaceSwitchResponseDto>
}
```

## Phase 3: Frontend Components (Week 3)

### 3.1 Core Components
```typescript
// Workspace Switcher Component
@Component({
  selector: 'app-workspace-switcher',
  template: `
    <div class="workspace-switcher">
      <button (click)="toggleDropdown()" class="current-workspace">
        🏢 {{ currentWorkspace?.name }} ▼
      </button>
      <div *ngIf="showDropdown" class="workspace-dropdown">
        <div *ngFor="let workspace of workspaces" 
             (click)="switchWorkspace(workspace)"
             class="workspace-item">
          🏢 {{ workspace.name }}
          <span *ngIf="workspace.isCurrent" class="current-badge">Current</span>
        </div>
        <div class="create-new" (click)="createNewOrganization()">
          [+ Create New Organization]
        </div>
      </div>
    </div>
  `
})
export class WorkspaceSwitcherComponent {
  workspaces: WorkspaceDto[] = [];
  currentWorkspace: WorkspaceDto | null = null;
  showDropdown = false;
}

// Invitation Modal Component
@Component({
  selector: 'app-invitation-modal',
  template: `
    <div class="modal-overlay" (click)="close()">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h2>✉️ Invite Team Members</h2>
        <form [formGroup]="invitationForm" (ngSubmit)="sendInvitation()">
          <input formControlName="email" placeholder="Email address" />
          <div class="role-selection">
            <label><input type="radio" formControlName="role" value="admin"> Admin</label>
            <label><input type="radio" formControlName="role" value="member"> Member</label>
            <label><input type="radio" formControlName="role" value="viewer"> Viewer</label>
          </div>
          <textarea formControlName="message" placeholder="Personal message (optional)"></textarea>
          <div class="modal-actions">
            <button type="submit" [disabled]="invitationForm.invalid">Send Invitation</button>
            <button type="button" (click)="close()">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class InvitationModalComponent {
  invitationForm: FormGroup;
  @Output() invitationSent = new EventEmitter<InvitationDto>();
  @Output() closed = new EventEmitter<void>();
}

// Invitation Acceptance Component
@Component({
  selector: 'app-invitation-acceptance',
  template: `
    <div class="invitation-page">
      <div class="invitation-card">
        <h1>🎉 You're Invited!</h1>
        <div class="organization-info">
          <h2>🏢 {{ invitation?.organization.name }}</h2>
          <p>{{ invitation?.organization.description }}</p>
          <p>👤 Your role: {{ invitation?.role }}</p>
        </div>
        <form [formGroup]="acceptanceForm" (ngSubmit)="acceptInvitation()">
          <input formControlName="firstName" placeholder="First Name" />
          <input formControlName="lastName" placeholder="Last Name" />
          <input formControlName="password" type="password" placeholder="Password" />
          <input formControlName="confirmPassword" type="password" placeholder="Confirm Password" />
          <div class="actions">
            <button type="submit" [disabled]="acceptanceForm.invalid">Accept Invitation</button>
            <button type="button" (click)="declineInvitation()">Decline</button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class InvitationAcceptanceComponent {
  invitation: InvitationDto | null = null;
  acceptanceForm: FormGroup;
}
```

### 3.2 Services
```typescript
@Injectable()
export class InvitationService {
  constructor(private http: HttpClient) {}
  
  createInvitation(orgId: string, dto: CreateInvitationDto): Observable<InvitationDto> {
    return this.http.post<InvitationDto>(`/api/v1/organizations/${orgId}/invitations`, dto);
  }
  
  getInvitations(orgId: string): Observable<InvitationDto[]> {
    return this.http.get<InvitationDto[]>(`/api/v1/organizations/${orgId}/invitations`);
  }
  
  getInvitationByToken(token: string): Observable<InvitationDto> {
    return this.http.get<InvitationDto>(`/api/v1/invitations/${token}`);
  }
  
  acceptInvitation(token: string, dto: AcceptInvitationDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`/api/v1/invitations/${token}/accept`, dto);
  }
  
  declineInvitation(token: string, dto: DeclineInvitationDto): Observable<void> {
    return this.http.post<void>(`/api/v1/invitations/${token}/decline`, dto);
  }
}

@Injectable()
export class WorkspaceService {
  constructor(private http: HttpClient) {}
  
  getUserWorkspaces(): Observable<WorkspaceDto[]> {
    return this.http.get<WorkspaceDto[]>('/api/v1/users/workspaces');
  }
  
  switchWorkspace(orgId: string): Observable<WorkspaceSwitchResponseDto> {
    return this.http.post<WorkspaceSwitchResponseDto>('/api/v1/users/workspaces/switch', { organizationId: orgId });
  }
  
  getOrganizationMembers(orgId: string): Observable<OrganizationMemberDto[]> {
    return this.http.get<OrganizationMemberDto[]>(`/api/v1/organizations/${orgId}/members`);
  }
}
```

## Phase 4: Integration & Testing (Week 4)

### 4.1 Email Templates
```html
<!-- Invitation Email Template -->
<!DOCTYPE html>
<html>
<head>
    <title>You're Invited to Join {{organizationName}}</title>
</head>
<body>
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <h1>🎉 You're Invited!</h1>
        
        <p>Hi there!</p>
        
        <p><strong>{{inviterName}}</strong> has invited you to join <strong>{{organizationName}}</strong> as a <strong>{{role}}</strong>.</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>🏢 {{organizationName}}</h3>
            <p>{{organizationDescription}}</p>
            <p><strong>Your Role:</strong> {{role}}</p>
        </div>
        
        <p>{{personalMessage}}</p>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{invitationLink}}" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Accept Invitation
            </a>
        </div>
        
        <p style="color: #666; font-size: 14px;">
            This invitation expires in 7 days. If you don't want to join, you can simply ignore this email.
        </p>
    </div>
</body>
</html>
```

### 4.2 Testing Strategy
```typescript
// Unit Tests
describe('InvitationService', () => {
  it('should create invitation successfully', async () => {
    const dto: CreateInvitationDto = {
      email: 'test@example.com',
      role: 'member',
      message: 'Welcome!'
    };
    
    const result = await invitationService.createInvitation('org-1', dto, 'user-1');
    
    expect(result.invitedEmail).toBe('test@example.com');
    expect(result.role).toBe('member');
    expect(result.status).toBe('pending');
  });
});

// Integration Tests
describe('Invitation Flow', () => {
  it('should complete full invitation flow', async () => {
    // 1. Create invitation
    const invitation = await invitationService.createInvitation('org-1', dto, 'user-1');
    
    // 2. Get invitation by token
    const retrieved = await invitationService.getInvitationByToken(invitation.token);
    
    // 3. Accept invitation
    const authResponse = await invitationService.acceptInvitation(invitation.token, acceptDto);
    
    // 4. Verify user is added to organization
    const members = await workspaceService.getOrganizationMembers('org-1');
    expect(members).toContain(jasmine.objectContaining({ userId: authResponse.user.id }));
  });
});

// E2E Tests
describe('Invitation E2E', () => {
  it('should allow user to invite and accept invitation', async () => {
    // 1. Login as organization owner
    await loginAsOwner();
    
    // 2. Navigate to team management
    await page.goto('/dashboard/organizations');
    
    // 3. Click invite member
    await page.click('[data-testid="invite-member"]');
    
    // 4. Fill invitation form
    await page.fill('[data-testid="email-input"]', 'newuser@example.com');
    await page.click('[data-testid="role-member"]');
    await page.fill('[data-testid="message-input"]', 'Welcome to our team!');
    
    // 5. Send invitation
    await page.click('[data-testid="send-invitation"]');
    
    // 6. Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();
    
    // 7. Check email (mock)
    const email = await getLastEmail();
    expect(email.to).toBe('newuser@example.com');
    expect(email.subject).toContain('invited');
    
    // 8. Accept invitation
    await page.goto(email.invitationLink);
    await page.fill('[data-testid="first-name"]', 'New');
    await page.fill('[data-testid="last-name"]', 'User');
    await page.fill('[data-testid="password"]', 'password123');
    await page.fill('[data-testid="confirm-password"]', 'password123');
    
    // 9. Accept invitation
    await page.click('[data-testid="accept-invitation"]');
    
    // 10. Verify redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
  });
});
```

## Phase 5: Production Deployment (Week 5)

### 5.1 Environment Configuration
```bash
# Email Service Configuration
EMAIL_SERVICE_URL=smtp://smtp.gmail.com:587
EMAIL_FROM=noreply@jynx.app
EMAIL_USERNAME=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# Frontend URL for invitation links
FRONTEND_URL=https://jynx.app
INVITATION_BASE_URL=https://jynx.app/auth/invite

# Rate Limiting
INVITATION_RATE_LIMIT=10
INVITATION_RATE_WINDOW=3600
```

### 5.2 Security Considerations
- **Token Security**: Use cryptographically secure random tokens
- **Rate Limiting**: Limit invitation sending per organization
- **Email Validation**: Validate email addresses before sending
- **Permission Checks**: Ensure only authorized users can invite
- **Token Expiration**: 7-day expiration for invitations

### 5.3 Monitoring & Analytics
- **Invitation Metrics**: Track invitation success rates
- **User Engagement**: Monitor workspace switching patterns
- **Error Tracking**: Log and monitor invitation failures
- **Performance**: Monitor API response times

## Success Criteria

### Technical Metrics
- [ ] < 200ms invitation creation time
- [ ] 99.9% email delivery rate
- [ ] < 1% invitation token conflicts
- [ ] 100% secure token generation

### User Experience Metrics
- [ ] < 3 clicks to send invitation
- [ ] < 30 seconds to accept invitation
- [ ] < 2 seconds workspace switching
- [ ] Clear error messages for all failure cases

### Business Metrics
- [ ] Increased organization growth
- [ ] Higher user engagement
- [ ] Reduced support tickets
- [ ] Improved team collaboration

## Future Enhancements

### Phase 6: Advanced Features
- **Bulk Invitations**: Invite multiple users at once
- **Invitation Templates**: Pre-defined invitation messages
- **Domain Restrictions**: Limit invitations to specific domains
- **Guest Access**: Temporary access for external collaborators
- **Organization Hierarchies**: Parent-child organization relationships

### Phase 7: Enterprise Features
- **SSO Integration**: Single sign-on for enterprise
- **Custom Roles**: User-defined permission sets
- **Audit Logging**: Track all invitation activities
- **Analytics Dashboard**: Organization growth metrics
- **API Access**: Programmatic invitation management