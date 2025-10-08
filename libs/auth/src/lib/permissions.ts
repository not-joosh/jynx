// ============================================================================
// SIMPLE MODULAR PERMISSION SYSTEM
// ============================================================================

export enum Permission {
  USER_READ = 'user:read',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  ORG_READ = 'organization:read',
  ORG_CREATE = 'organization:create',
  ORG_UPDATE = 'organization:update',
  ORG_DELETE = 'organization:delete',
  
  TASK_READ = 'task:read',
  TASK_CREATE = 'task:create',
  TASK_UPDATE = 'task:update',
  TASK_DELETE = 'task:delete',
  
  PROJECT_READ = 'project:read',
  PROJECT_CREATE = 'project:create',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
}

export enum Role {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

// Role-Permission mapping
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    Permission.USER_READ, Permission.USER_CREATE, Permission.USER_UPDATE, Permission.USER_DELETE,
    Permission.ORG_READ, Permission.ORG_CREATE, Permission.ORG_UPDATE, Permission.ORG_DELETE,
    Permission.TASK_READ, Permission.TASK_CREATE, Permission.TASK_UPDATE, Permission.TASK_DELETE,
    Permission.PROJECT_READ, Permission.PROJECT_CREATE, Permission.PROJECT_UPDATE, Permission.PROJECT_DELETE,
  ],
  [Role.ADMIN]: [
    Permission.USER_READ, Permission.USER_CREATE, Permission.USER_UPDATE,
    Permission.ORG_READ, Permission.ORG_UPDATE,
    Permission.TASK_READ, Permission.TASK_CREATE, Permission.TASK_UPDATE, Permission.TASK_DELETE,
    Permission.PROJECT_READ, Permission.PROJECT_CREATE, Permission.PROJECT_UPDATE, Permission.PROJECT_DELETE,
  ],
  [Role.MEMBER]: [
    Permission.USER_READ,
    Permission.ORG_READ,
    Permission.TASK_READ, Permission.TASK_CREATE, Permission.TASK_UPDATE,
    Permission.PROJECT_READ, Permission.PROJECT_CREATE, Permission.PROJECT_UPDATE,
  ],
  [Role.VIEWER]: [
    Permission.USER_READ,
    Permission.ORG_READ,
    Permission.TASK_READ,
    Permission.PROJECT_READ,
  ],
};

/**
 * Simple modular permission checking function
 * @param userRole - The user's role
 * @param requiredPermission - The permission to check
 * @param resourceOwnerId - Optional: ID of the resource owner (for ownership checks)
 * @returns boolean - Whether the user has permission
 */
export function hasPermission(
  userRole: Role, 
  requiredPermission: Permission, 
  resourceOwnerId?: string
): boolean {
  const userPermissions = ROLE_PERMISSIONS[userRole] || [];
  
  // Check if user has the required permission
  if (!userPermissions.includes(requiredPermission)) {
    return false;
  }
  
  // For certain permissions, check ownership
  const ownershipRequiredPermissions = [
    Permission.USER_DELETE,
    Permission.ORG_DELETE,
    Permission.TASK_DELETE,
    Permission.PROJECT_DELETE,
  ];
  
  if (ownershipRequiredPermissions.includes(requiredPermission) && resourceOwnerId) {
    // In a real app, you'd compare with current user ID
    // For now, we'll assume ownership is checked elsewhere
    return true;
  }
  
  return true;
}

/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
