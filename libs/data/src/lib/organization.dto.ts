// ============================================================================
// ORGANIZATION DTOs - SIMPLIFIED FOR PROTOTYPE
// ============================================================================

export enum OrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member'
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
