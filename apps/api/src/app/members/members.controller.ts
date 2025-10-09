import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessControlGuard } from '../common/guards/access-control.guard';
import { RequirePermission } from '../common/decorators/access-control.decorator';
import { MembersService } from './members.service';
import { Permission } from '../common/permissions';

@Controller('members')
@UseGuards(JwtAuthGuard, AccessControlGuard)
export class MembersController {
  constructor(private membersService: MembersService) {}

  @Get()
  @RequirePermission({ permission: Permission.USER_READ })
  async getOrganizationMembers(@Request() req: any) {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      throw new Error('User must be associated with an organization to view members');
    }

    return this.membersService.getOrganizationMembers(organizationId);
  }
}
