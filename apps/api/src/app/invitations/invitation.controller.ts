import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { InvitationService } from './invitation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateInvitationDto, AcceptInvitationDto, DeclineInvitationDto } from '@challenge/data/backend';

@Controller('organizations/:id/invitations')
@UseGuards(JwtAuthGuard)
export class InvitationController {
  constructor(private invitationService: InvitationService) {}

  /**
   * Create a new invitation
   */
  @Post()
  async createInvitation(
    @Param('id') organizationId: string,
    @Body() createInvitationDto: CreateInvitationDto,
    @Request() req: any
  ) {
    return this.invitationService.createInvitation(
      organizationId,
      createInvitationDto,
      req.user.id
    );
  }

  /**
   * Get all invitations for an organization
   */
  @Get()
  async getInvitations(
    @Param('id') organizationId: string,
    @Request() req: any
  ) {
    return this.invitationService.getInvitations(organizationId, req.user.id);
  }

  /**
   * Cancel an invitation
   */
  @Delete(':invitationId')
  async cancelInvitation(
    @Param('id') organizationId: string,
    @Param('invitationId') invitationId: string,
    @Request() req: any
  ) {
    await this.invitationService.cancelInvitation(organizationId, invitationId, req.user.id);
    return { message: 'Invitation cancelled successfully' };
  }

  /**
   * Resend an invitation
   */
  @Put(':invitationId/resend')
  async resendInvitation(
    @Param('id') organizationId: string,
    @Param('invitationId') invitationId: string,
    @Request() req: any
  ) {
    await this.invitationService.resendInvitation(organizationId, invitationId, req.user.id);
    return { message: 'Invitation resent successfully' };
  }

  /**
   * Accept an invitation by ID (for in-app notifications)
   */
  @Post(':invitationId/accept')
  async acceptInvitationById(
    @Param('id') organizationId: string,
    @Param('invitationId') invitationId: string,
    @Request() req: any
  ) {
    return this.invitationService.acceptInvitationById(organizationId, invitationId, req.user.id);
  }

  /**
   * Decline an invitation by ID (for in-app notifications)
   */
  @Post(':invitationId/decline')
  async declineInvitationById(
    @Param('id') organizationId: string,
    @Param('invitationId') invitationId: string,
    @Request() req: any
  ) {
    await this.invitationService.declineInvitationById(organizationId, invitationId, req.user.id);
    return { message: 'Invitation declined successfully' };
  }
}

@Controller('invitations')
export class InvitationAcceptanceController {
  constructor(private invitationService: InvitationService) {}

  /**
   * Get invitation by token (for acceptance page)
   */
  @Get(':token')
  async getInvitationByToken(@Param('token') token: string) {
    return this.invitationService.getInvitationByToken(token);
  }

  /**
   * Accept an invitation
   */
  @Post(':token/accept')
  async acceptInvitation(
    @Param('token') token: string,
    @Body() acceptDto: AcceptInvitationDto
  ) {
    return this.invitationService.acceptInvitation(token, acceptDto);
  }

  /**
   * Decline an invitation
   */
  @Post(':token/decline')
  async declineInvitation(
    @Param('token') token: string,
    @Body() declineDto: DeclineInvitationDto
  ) {
    await this.invitationService.declineInvitation(token, declineDto);
    return { message: 'Invitation declined successfully' };
  }
}
