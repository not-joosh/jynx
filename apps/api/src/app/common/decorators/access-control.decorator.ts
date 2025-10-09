import { SetMetadata } from '@nestjs/common';
import { Permission } from '../permissions';

export interface AccessControlOptions {
  permission: Permission;
  resourceOwnerId?: string;
  organizationId?: string;
}

export const ACCESS_CONTROL_KEY = 'access_control';

export const RequirePermission = (options: AccessControlOptions) =>
  SetMetadata(ACCESS_CONTROL_KEY, options);