export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  VIEWER = 'viewer'
}

export enum Permission {
  // Organization permissions
  MANAGE_ORGANIZATION = 'manage_organization',
  MANAGE_USERS = 'manage_users',
  MANAGE_ROLES = 'manage_roles',
  
  // Task permissions
  CREATE_TASKS = 'create_tasks',
  EDIT_TASKS = 'edit_tasks',
  DELETE_TASKS = 'delete_tasks',
  VIEW_TASKS = 'view_tasks',
  
  // Audit permissions
  VIEW_AUDIT_LOGS = 'view_audit_logs',
  MANAGE_AUDIT_LOGS = 'manage_audit_logs'
}

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    Permission.MANAGE_ORGANIZATION,
    Permission.MANAGE_USERS,
    Permission.MANAGE_ROLES,
    Permission.CREATE_TASKS,
    Permission.EDIT_TASKS,
    Permission.DELETE_TASKS,
    Permission.VIEW_TASKS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.MANAGE_AUDIT_LOGS
  ],
  [Role.ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.CREATE_TASKS,
    Permission.EDIT_TASKS,
    Permission.DELETE_TASKS,
    Permission.VIEW_TASKS,
    Permission.VIEW_AUDIT_LOGS
  ],
  [Role.VIEWER]: [
    Permission.CREATE_TASKS,
    Permission.VIEW_TASKS
  ]
};

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) || false;
}

export function hasAnyPermission(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

export function hasAllPermissions(userRole: Role, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}
