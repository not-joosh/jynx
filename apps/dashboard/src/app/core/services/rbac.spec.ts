import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { AngularAuthService } from '@challenge/auth';
import { OrganizationRole } from '@challenge/data';
import { Role, Permission } from '@challenge/auth';

describe('RBAC Permission System', () => {
  let authService: AngularAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AngularAuthService]
    });
    authService = TestBed.inject(AngularAuthService);
  });

  describe('Role Hierarchy', () => {
    it('should respect role hierarchy: OWNER > ADMIN > MEMBER', () => {
      // Test owner permissions
      authService.updateCurrentUser({
        id: 'owner-id',
        email: 'owner@example.com',
        firstName: 'Owner',
        lastName: 'User',
        role: OrganizationRole.OWNER
      });

      expect(authService.hasRole(Role.OWNER)).toBe(true);
      expect(authService.hasRole(Role.ADMIN)).toBe(true);
      expect(authService.hasRole(Role.MEMBER)).toBe(true);

      // Test admin permissions
      authService.updateCurrentUser({
        id: 'admin-id',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: OrganizationRole.ADMIN
      });

      expect(authService.hasRole(Role.OWNER)).toBe(false);
      expect(authService.hasRole(Role.ADMIN)).toBe(true);
      expect(authService.hasRole(Role.MEMBER)).toBe(true);

      // Test member permissions
      authService.updateCurrentUser({
        id: 'member-id',
        email: 'member@example.com',
        firstName: 'Member',
        lastName: 'User',
        role: OrganizationRole.MEMBER
      });

      expect(authService.hasRole(Role.OWNER)).toBe(false);
      expect(authService.hasRole(Role.ADMIN)).toBe(false);
      expect(authService.hasRole(Role.MEMBER)).toBe(true);
    });
  });

  describe('Task Permissions', () => {
    describe('OWNER Role', () => {
      beforeEach(() => {
        authService.updateCurrentUser({
          id: 'owner-id',
          email: 'ratificarjosh@gmail.com',
          firstName: 'Josh',
          lastName: 'Ratificar',
          role: OrganizationRole.OWNER
        });
      });

      it('should have all task permissions', () => {
        expect(authService.hasPermission(Permission.TASK_CREATE)).toBe(true);
        expect(authService.hasPermission(Permission.TASK_READ)).toBe(true);
        expect(authService.hasPermission(Permission.TASK_UPDATE)).toBe(true);
        expect(authService.hasPermission(Permission.TASK_DELETE)).toBe(true);
      });

      it('should be able to create tasks', () => {
        expect(authService.hasPermission(Permission.TASK_CREATE)).toBe(true);
      });

      it('should be able to edit any task', () => {
        expect(authService.hasPermission(Permission.TASK_UPDATE)).toBe(true);
      });

      it('should be able to delete any task', () => {
        expect(authService.hasPermission(Permission.TASK_DELETE)).toBe(true);
      });
    });

    describe('ADMIN Role', () => {
      beforeEach(() => {
        authService.updateCurrentUser({
          id: 'admin-id',
          email: 'elitecrewcpt@gmail.com',
          firstName: 'Elite',
          lastName: 'Crew',
          role: OrganizationRole.ADMIN
        });
      });

      it('should have most task permissions', () => {
        expect(authService.hasPermission(Permission.TASK_CREATE)).toBe(true);
        expect(authService.hasPermission(Permission.TASK_READ)).toBe(true);
        expect(authService.hasPermission(Permission.TASK_UPDATE)).toBe(true);
        expect(authService.hasPermission(Permission.TASK_DELETE)).toBe(true);
      });

      it('should be able to create tasks', () => {
        expect(authService.hasPermission(Permission.TASK_CREATE)).toBe(true);
      });

      it('should be able to edit tasks', () => {
        expect(authService.hasPermission(Permission.TASK_UPDATE)).toBe(true);
      });

      it('should be able to delete tasks', () => {
        expect(authService.hasPermission(Permission.TASK_DELETE)).toBe(true);
      });
    });

    describe('MEMBER Role', () => {
      beforeEach(() => {
        authService.updateCurrentUser({
          id: 'member-id',
          email: 'joshratificar@gmail.com',
          firstName: 'Josh',
          lastName: 'Ratificar',
          role: OrganizationRole.MEMBER
        });
      });

      it('should have limited task permissions', () => {
        expect(authService.hasPermission(Permission.TASK_CREATE)).toBe(true);
        expect(authService.hasPermission(Permission.TASK_READ)).toBe(true);
        expect(authService.hasPermission(Permission.TASK_UPDATE)).toBe(true);
        expect(authService.hasPermission(Permission.TASK_DELETE)).toBe(false);
      });

      it('should be able to create tasks', () => {
        expect(authService.hasPermission(Permission.TASK_CREATE)).toBe(true);
      });

      it('should be able to edit tasks', () => {
        expect(authService.hasPermission(Permission.TASK_UPDATE)).toBe(true);
      });

      it('should not be able to delete tasks', () => {
        expect(authService.hasPermission(Permission.TASK_DELETE)).toBe(false);
      });

      it('should be able to view tasks', () => {
        expect(authService.hasPermission(Permission.TASK_READ)).toBe(true);
      });
    });
  });

  describe('Organization Management Permissions', () => {
    describe('OWNER Role', () => {
      beforeEach(() => {
        authService.updateCurrentUser({
          id: 'owner-id',
          email: 'ratificarjosh@gmail.com',
          firstName: 'Josh',
          lastName: 'Ratificar',
          role: OrganizationRole.OWNER
        });
      });

      it('should have all organization permissions', () => {
        expect(authService.hasPermission(Permission.ORG_READ)).toBe(true);
        expect(authService.hasPermission(Permission.ORG_CREATE)).toBe(true);
        expect(authService.hasPermission(Permission.ORG_UPDATE)).toBe(true);
        expect(authService.hasPermission(Permission.ORG_DELETE)).toBe(true);
      });

      it('should be able to manage organizations', () => {
        expect(authService.hasPermission(Permission.ORG_UPDATE)).toBe(true);
      });

      it('should be able to delete organizations', () => {
        expect(authService.hasPermission(Permission.ORG_DELETE)).toBe(true);
      });
    });

    describe('ADMIN Role', () => {
      beforeEach(() => {
        authService.updateCurrentUser({
          id: 'admin-id',
          email: 'elitecrewcpt@gmail.com',
          firstName: 'Elite',
          lastName: 'Crew',
          role: OrganizationRole.ADMIN
        });
      });

      it('should have limited organization permissions', () => {
        expect(authService.hasPermission(Permission.ORG_READ)).toBe(true);
        expect(authService.hasPermission(Permission.ORG_CREATE)).toBe(false);
        expect(authService.hasPermission(Permission.ORG_UPDATE)).toBe(true);
        expect(authService.hasPermission(Permission.ORG_DELETE)).toBe(false);
      });

      it('should be able to update organizations', () => {
        expect(authService.hasPermission(Permission.ORG_UPDATE)).toBe(true);
      });

      it('should not be able to delete organizations', () => {
        expect(authService.hasPermission(Permission.ORG_DELETE)).toBe(false);
      });
    });

    describe('MEMBER Role', () => {
      beforeEach(() => {
        authService.updateCurrentUser({
          id: 'member-id',
          email: 'joshratificar@gmail.com',
          firstName: 'Josh',
          lastName: 'Ratificar',
          role: OrganizationRole.MEMBER
        });
      });

      it('should have read-only organization permissions', () => {
        expect(authService.hasPermission(Permission.ORG_READ)).toBe(true);
        expect(authService.hasPermission(Permission.ORG_CREATE)).toBe(false);
        expect(authService.hasPermission(Permission.ORG_UPDATE)).toBe(false);
        expect(authService.hasPermission(Permission.ORG_DELETE)).toBe(false);
      });

      it('should be able to read organizations', () => {
        expect(authService.hasPermission(Permission.ORG_READ)).toBe(true);
      });

      it('should not be able to modify organizations', () => {
        expect(authService.hasPermission(Permission.ORG_UPDATE)).toBe(false);
        expect(authService.hasPermission(Permission.ORG_DELETE)).toBe(false);
      });
    });
  });

  describe('Real Account RBAC Testing', () => {
    const testAccounts = [
      {
        email: 'ratificarjosh@gmail.com',
        password: 'magic123',
        role: OrganizationRole.ADMIN,
        expectedPermissions: {
          canCreateTasks: true,
          canEditTasks: true,
          canDeleteTasks: true,
          canManageOrgs: true
        }
      },
      {
        email: 'elitecrewcpt@gmail.com',
        password: 'magic123',
        role: OrganizationRole.MEMBER,
        expectedPermissions: {
          canCreateTasks: true,
          canEditTasks: true,
          canDeleteTasks: false,
          canManageOrgs: false
        }
      },
      {
        email: 'joshratificar@gmail.com',
        password: 'magic123',
        role: OrganizationRole.MEMBER,
        expectedPermissions: {
          canCreateTasks: true,
          canEditTasks: true,
          canDeleteTasks: false,
          canManageOrgs: false
        }
      }
    ];

    testAccounts.forEach((account, index) => {
      describe(`Real Account ${index + 1}: ${account.email}`, () => {
        beforeEach(() => {
          authService.updateCurrentUser({
            id: `user-${index + 1}`,
            email: account.email,
            firstName: 'Test',
            lastName: 'User',
            role: account.role
          });
        });

        it('should have correct task permissions', () => {
          expect(authService.hasPermission(Permission.TASK_CREATE)).toBe(account.expectedPermissions.canCreateTasks);
          expect(authService.hasPermission(Permission.TASK_UPDATE)).toBe(account.expectedPermissions.canEditTasks);
          expect(authService.hasPermission(Permission.TASK_DELETE)).toBe(account.expectedPermissions.canDeleteTasks);
        });

        it('should have correct organization permissions', () => {
          expect(authService.hasPermission(Permission.ORG_UPDATE)).toBe(account.expectedPermissions.canManageOrgs);
        });

        it('should have correct role hierarchy', () => {
          expect(authService.hasRole(Role.OWNER)).toBe(false);
          expect(authService.hasRole(Role.ADMIN)).toBe(account.role === OrganizationRole.ADMIN);
          expect(authService.hasRole(Role.MEMBER)).toBe(true);
        });
      });
    });
  });

  describe('Permission Edge Cases', () => {
    it('should handle undefined user gracefully', () => {
      authService.updateCurrentUser(null as any);

      expect(authService.hasPermission(Permission.TASK_CREATE)).toBe(false);
      expect(authService.hasPermission(Permission.TASK_READ)).toBe(false);
      expect(authService.hasRole(Role.ADMIN)).toBe(false);
    });

    it('should handle invalid role gracefully', () => {
      authService.updateCurrentUser({
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'invalid-role' as any
      });

      expect(authService.hasRole(Role.ADMIN)).toBe(false);
      expect(authService.hasRole(Role.VIEWER)).toBe(false);
      expect(authService.hasRole(Role.OWNER)).toBe(false);
    });

    it('should handle permission checks for non-existent permissions', () => {
      authService.updateCurrentUser({
        id: 'admin-id',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: OrganizationRole.ADMIN
      });

      // Test with non-existent permission
      expect(authService.hasPermission('non-existent:permission' as any)).toBe(false);
    });
  });

  describe('State Management', () => {
    it('should maintain user state across role changes', () => {
      const user = {
        id: 'user-id',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: OrganizationRole.VIEWER
      };

      authService.updateCurrentUser(user);
      expect(authService.getCurrentUser()).toEqual(user);

      // Change role
      const updatedUser = { ...user, role: OrganizationRole.ADMIN };
      authService.updateCurrentUser(updatedUser);
      expect(authService.getCurrentUser()).toEqual(updatedUser);

      // Verify permissions changed
      expect(authService.hasPermission(Permission.TASK_CREATE)).toBe(true);
    });

    it('should clear permissions on logout', () => {
      authService.updateCurrentUser({
        id: 'admin-id',
        email: 'admin@example.com',
        firstName: 'Admin',
        lastName: 'User',
        role: OrganizationRole.ADMIN
      });

      expect(authService.hasPermission(Permission.TASK_CREATE)).toBe(true);

      authService.logout();

      expect(authService.hasPermission(Permission.TASK_CREATE)).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
    });
  });
});
