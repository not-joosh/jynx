import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ACCESS_CONTROL_KEY, AccessControlOptions } from '../decorators/access-control.decorator';
import { Permission, hasPermission } from '../permissions';

@Injectable()
export class AccessControlGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const accessControlOptions = this.reflector.getAllAndOverride<AccessControlOptions>(
      ACCESS_CONTROL_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!accessControlOptions) {
      return true; // No access control required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    const { permission, resourceOwnerId, organizationId } = accessControlOptions;
    
    // Get user's role from JWT payload
    const userRole = user.role || 'viewer';
    
    // Check if user has the required permission
    const hasRequiredPermission = hasPermission(userRole, permission, resourceOwnerId);
    
    if (!hasRequiredPermission) {
      // Log access attempt for audit
      this.logAccessAttempt(user.id, permission, 'DENIED', request.url);
      throw new ForbiddenException(`Insufficient permissions. Required: ${permission}`);
    }

    // Log successful access for audit
    this.logAccessAttempt(user.id, permission, 'GRANTED', request.url);
    
    return true;
  }

  private logAccessAttempt(userId: string, permission: Permission, result: 'GRANTED' | 'DENIED', endpoint: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[AUDIT] ${timestamp} - User: ${userId} | Permission: ${permission} | Result: ${result} | Endpoint: ${endpoint}`;
    
    if (result === 'DENIED') {
      console.warn(`🚫 ${logMessage}`);
    } else {
      console.log(`✅ ${logMessage}`);
    }
  }
}