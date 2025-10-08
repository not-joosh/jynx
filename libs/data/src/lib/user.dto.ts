// ============================================================================
// USER DTOs - SIMPLIFIED FOR PROTOTYPE
// ============================================================================

import { OrganizationRole } from './organization.dto';

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserDto {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  organizationName?: string; // For new organization creation
  invitationToken?: string; // For invited users
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface UserProfileDto extends UserDto {
  organizations: UserOrganizationDto[];
  currentOrganizationId?: string;
}

export interface UserOrganizationDto {
  organizationId: string;
  organizationName: string;
  role: OrganizationRole;
  joinedAt: Date;
}
