// ============================================================================
// ORGANIZATION INVITATION DTOs
// ============================================================================

export interface CreateInvitationDto {
  email: string;
  role: 'admin' | 'member' | 'viewer';
  message?: string;
}

export interface InvitationDto {
  id: string;
  organizationId: string;
  invitedBy: string;
  invitedEmail: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdAt: Date;
  acceptedAt?: Date;
  organization: {
    id: string;
    name: string;
    description?: string;
  };
  inviter: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface AcceptInvitationDto {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface OrganizationMemberDto {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  joinedAt: Date;
  joinedVia: 'direct' | 'invitation' | 'owner';
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  invitedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface DeclineInvitationDto {
  token: string;
  reason?: string;
}

export interface InvitationResponseDto {
  invitation: InvitationDto;
  message: string;
}

export interface WorkspaceDto {
  id: string;
  name: string;
  description?: string;
  role: string;
  memberCount: number;
  isCurrent: boolean;
  joinedAt: Date;
  organization: {
    id: string;
    name: string;
    description?: string;
    ownerId: string;
  };
}

export interface SwitchWorkspaceDto {
  organizationId: string;
}

export interface WorkspaceSwitchResponseDto {
  workspace: WorkspaceDto;
  accessToken: string;
  message: string;
}

export interface InvitationStatsDto {
  total: number;
  pending: number;
  accepted: number;
  declined: number;
  expired: number;
}

export interface OrganizationStatsDto {
  memberCount: number;
  invitationCount: number;
  pendingInvitations: number;
  recentActivity: Array<{
    type: 'invitation_sent' | 'invitation_accepted' | 'member_joined' | 'member_left';
    user: string;
    timestamp: Date;
    details?: string;
  }>;
}
