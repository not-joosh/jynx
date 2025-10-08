// ============================================================================
// SIMPLE AUDIT LOGGING DTOs FOR PROTOTYPE
// ============================================================================

export enum AuditAction {
  USER_LOGIN = 'user:login',
  USER_LOGOUT = 'user:logout',
  USER_REGISTER = 'user:register',
  ORGANIZATION_CREATE = 'organization:create',
  ORGANIZATION_UPDATE = 'organization:update',
  TASK_CREATE = 'task:create',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  TASK_ASSIGN = 'task:assign'
}

export interface AuditLogDto {
  id: string;
  userId: string;
  organizationId: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  description: string;
  timestamp: Date;
}

export interface CreateAuditLogDto {
  userId: string;
  organizationId: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  description: string;
}
