import { Controller, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessControlGuard } from '../common/guards/access-control.guard';
import { RequirePermission } from '../common/decorators/access-control.decorator';
import { Permission } from '../common/permissions';
import { MemberManagementService, UpdateMemberRoleDto } from './member-management.service';

@Controller('organizations/:organizationId/members')
@UseGuards(JwtAuthGuard, AccessControlGuard)
export class MemberManagementController {
  constructor(private memberManagementService: MemberManagementService) {}

  /**
   * Update a member's role
   */
  @Put(':userId/role')
  @RequirePermission({ permission: Permission.USER_UPDATE })
  async updateMemberRole(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @Body() updateRoleDto: UpdateMemberRoleDto,
    @Request() req: any
  ) {
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    return this.memberManagementService.updateMemberRole(
      organizationId,
      userId,
      updateRoleDto,
      requesterId,
      requesterRole
    );
  }

  /**
   * Remove a member from the organization
   */
  @Delete(':userId')
  @RequirePermission({ permission: Permission.USER_DELETE })
  async removeMember(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string,
    @Request() req: any
  ) {
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    await this.memberManagementService.removeMember(
      organizationId,
      userId,
      requesterId,
      requesterRole
    );

    return { message: 'Member removed successfully' };
  }

  /**
   * Get member details
   */
  @Put(':userId')
  @RequirePermission({ permission: Permission.USER_READ })
  async getMember(
    @Param('organizationId') organizationId: string,
    @Param('userId') userId: string
  ) {
    return this.memberManagementService.getMember(organizationId, userId);
  }
}

