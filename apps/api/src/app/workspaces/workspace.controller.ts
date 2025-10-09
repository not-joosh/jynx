import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { WorkspaceService } from './workspace.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SwitchWorkspaceDto } from '@challenge/data/backend';

@Controller('users/workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspaceController {
  constructor(private workspaceService: WorkspaceService) {}

  /**
   * Get all workspaces for the current user
   */
  @Get()
  async getUserWorkspaces(@Request() req: any) {
    return this.workspaceService.getUserWorkspaces(req.user.id);
  }

  /**
   * Switch to a different workspace
   */
  @Post('switch')
  async switchWorkspace(
    @Body() switchDto: SwitchWorkspaceDto,
    @Request() req: any
  ) {
    return this.workspaceService.switchWorkspace(req.user.id, switchDto.organizationId);
  }
}

@Controller('organizations/:id/members')
@UseGuards(JwtAuthGuard)
export class OrganizationMembersController {
  constructor(private workspaceService: WorkspaceService) {}

  /**
   * Get all members of an organization
   */
  @Get()
  async getOrganizationMembers(
    @Param('id') organizationId: string,
    @Request() req: any
  ) {
    return this.workspaceService.getOrganizationMembers(organizationId, req.user.id);
  }

  /**
   * Remove a member from organization
   */
  @Delete(':memberId')
  async removeMember(
    @Param('id') organizationId: string,
    @Param('memberId') memberId: string,
    @Request() req: any
  ) {
    await this.workspaceService.removeMember(organizationId, memberId, req.user.id);
    return { message: 'Member removed successfully' };
  }

  /**
   * Update member role
   */
  @Put(':memberId/role')
  async updateMemberRole(
    @Param('id') organizationId: string,
    @Param('memberId') memberId: string,
    @Body() body: { role: string },
    @Request() req: any
  ) {
    await this.workspaceService.updateMemberRole(organizationId, memberId, body.role, req.user.id);
    return { message: 'Member role updated successfully' };
  }
}
