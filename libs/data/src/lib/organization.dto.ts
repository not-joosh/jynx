// ============================================================================
// ORGANIZATION DTOs - SIMPLIFIED FOR PROTOTYPE
// ============================================================================

export enum OrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  VIEWER = 'viewer'
}

export interface OrganizationDto {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateOrganizationDto {
  name: string;
  description?: string;
}

export interface UpdateOrganizationDto {
  name?: string;
  description?: string;
}

export interface OrganizationMemberDto {
  id: string;
  userId: string;
  organizationId: string;
  role: OrganizationRole;
  joinedAt: Date;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface InviteUserDto {
  email: string;
  role: OrganizationRole;
  message?: string;
}

export interface OrganizationInvitationDto {
  id: string;
  email: string;
  organizationId: string;
  role: OrganizationRole;
  invitedBy: string;
  token: string;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

export interface AcceptInvitationDto {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}
