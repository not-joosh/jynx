import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { BackendSupabaseService } from '../supabase/supabase.service';
import { UserLookupService } from '../users/user-lookup.service';
import { CreateInvitationDto, InvitationDto, AcceptInvitationDto, DeclineInvitationDto } from '@challenge/data/backend';
import { randomBytes } from 'crypto';

@Injectable()
export class InvitationService {
  constructor(
    private supabaseService: BackendSupabaseService,
    private userLookupService: UserLookupService
  ) {}

  /**
   * Create a new invitation for an organization
   */
  async createInvitation(
    organizationId: string,
    createInvitationDto: CreateInvitationDto,
    inviterId: string
  ): Promise<InvitationDto> {
    try {
      // Check if inviter has permission to invite (owner or admin)
      const { data: membership, error: membershipError } = await this.supabaseService.getClient()
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', inviterId)
        .single();

      if (membershipError || !membership) {
        throw new UnauthorizedException('You are not a member of this organization');
      }

      if (!['owner', 'admin'].includes(membership.role)) {
        throw new UnauthorizedException('Only owners and admins can send invitations');
      }

      // Look up the user by email
      const invitedUser = await this.userLookupService.lookupUserByEmail(createInvitationDto.email);
      
      // Only allow invitations for existing users (no email invitations)
      if (!invitedUser) {
        throw new BadRequestException('User not found. Only existing users can be invited to organizations.');
      }

      // Check if user is already a member
      const { data: existingMember } = await this.supabaseService.getClient()
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', organizationId)
        .eq('user_id', invitedUser.id)
        .single();

      if (existingMember) {
        throw new BadRequestException('User is already a member of this organization');
      }

      // Check if there's already a pending invitation
      const { data: existingInvitation } = await this.supabaseService.getClient()
        .from('organization_invitations')
        .select('id, status')
        .eq('organization_id', organizationId)
        .eq('invited_email', createInvitationDto.email)
        .eq('status', 'pending')
        .single();

      if (existingInvitation) {
        throw new BadRequestException('A pending invitation already exists for this email');
      }

      // Generate secure token
      const token = this.generateSecureToken();

      // Create invitation
      const { data: invitation, error: invitationError } = await this.supabaseService.getClient()
        .from('organization_invitations')
        .insert({
          organization_id: organizationId,
          invited_by: inviterId,
          invited_email: createInvitationDto.email,
          role: createInvitationDto.role,
          token: token,
          personal_message: createInvitationDto.message,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        })
        .select(`
          *,
          organizations (
            id,
            name,
            description
          ),
          inviter:users!invited_by (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .single();

      if (invitationError) {
        console.error('❌ Failed to create invitation:', invitationError);
        throw new BadRequestException('Failed to create invitation');
      }

      console.log('✅ Invitation created successfully:', invitation.id);

      // Create in-app notification for the invited user
      try {
        const inviter = invitation.inviter;
        const organization = invitation.organizations;
        const inviterName = `${inviter.first_name} ${inviter.last_name}`;
        
        await this.userLookupService.createInvitationNotification(
          invitedUser.id,
          organizationId,
          inviterName,
          organization.name,
          createInvitationDto.role,
          invitation.id
        );
        
        console.log('✅ In-app notification created for invited user:', invitedUser.id);
      } catch (notificationError) {
        console.error('❌ Failed to create in-app notification:', notificationError);
        // Don't fail the invitation creation if notification fails
      }

      return this.mapInvitationToDto(invitation);
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ Create invitation failed:', error);
      throw new BadRequestException('Failed to create invitation');
    }
  }

  /**
   * Get all invitations for an organization
   */
  async getInvitations(organizationId: string, userId: string): Promise<InvitationDto[]> {
    try {
      // Check if user has permission to view invitations
      const { data: membership, error: membershipError } = await this.supabaseService.getClient()
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single();

      if (membershipError || !membership) {
        throw new UnauthorizedException('You are not a member of this organization');
      }

      if (!['owner', 'admin'].includes(membership.role)) {
        throw new UnauthorizedException('Only owners and admins can view invitations');
      }

      const { data: invitations, error: invitationsError } = await this.supabaseService.getClient()
        .from('organization_invitations')
        .select(`
          *,
          organizations (
            id,
            name,
            description
          ),
          inviter:users!invited_by (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      if (invitationsError) {
        console.error('❌ Failed to get invitations:', invitationsError);
        throw new BadRequestException('Failed to get invitations');
      }

      return invitations.map(invitation => this.mapInvitationToDto(invitation));
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ Get invitations failed:', error);
      throw new BadRequestException('Failed to get invitations');
    }
  }

  /**
   * Get invitation by token (for acceptance page)
   */
  async getInvitationByToken(token: string): Promise<InvitationDto> {
    try {
      const { data: invitation, error: invitationError } = await this.supabaseService.getClient()
        .from('organization_invitations')
        .select(`
          *,
          organizations (
            id,
            name,
            description
          ),
          inviter:users!invited_by (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('token', token)
        .single();

      if (invitationError || !invitation) {
        throw new NotFoundException('Invitation not found or invalid');
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        // Mark as expired
        await this.supabaseService.getClient()
          .from('organization_invitations')
          .update({ status: 'expired' })
          .eq('id', invitation.id);
        
        throw new BadRequestException('Invitation has expired');
      }

      // Check if invitation is already accepted or declined
      if (invitation.status !== 'pending') {
        throw new BadRequestException(`Invitation has already been ${invitation.status}`);
      }

      return this.mapInvitationToDto(invitation);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ Get invitation by token failed:', error);
      throw new BadRequestException('Failed to get invitation');
    }
  }

  /**
   * Accept an invitation
   */
  async acceptInvitation(token: string, acceptDto: AcceptInvitationDto): Promise<any> {
    try {
      // Get invitation details
      const invitation = await this.getInvitationByToken(token);

      // Check if user already exists
      let userId: string;
      const { data: existingUser } = await this.supabaseService.getUserProfileByEmail(invitation.invitedEmail);

      if (existingUser) {
        userId = existingUser.id;
      } else {
        // Create new user in Supabase Auth
        const { data: authData, error: authError } = await this.supabaseService.signUp(
          invitation.invitedEmail,
          acceptDto.password,
          {
            first_name: acceptDto.firstName,
            last_name: acceptDto.lastName,
          }
        );

        if (authError) {
          console.error('❌ Failed to create user:', authError);
          throw new BadRequestException('Failed to create user account');
        }

        userId = authData.user.id;

        // Create user profile in database
        const { error: profileError } = await this.supabaseService.createUserProfile({
          id: userId,
          email: invitation.invitedEmail,
          first_name: acceptDto.firstName,
          last_name: acceptDto.lastName,
          role: invitation.role,
          current_organization_id: invitation.organizationId,
        });

        if (profileError) {
          console.error('❌ Failed to create user profile:', profileError);
          throw new BadRequestException('Failed to create user profile');
        }
      }

      // Add user to organization
      const { error: memberError } = await this.supabaseService.createOrganizationMember({
        user_id: userId,
        organization_id: invitation.organizationId,
        role: invitation.role,
        invited_by: invitation.invitedBy,
        invitation_id: invitation.id,
        joined_via: 'invitation',
      });

      if (memberError) {
        console.error('❌ Failed to add user to organization:', memberError);
        throw new BadRequestException('Failed to add user to organization');
      }

      // Mark invitation as accepted
      const { error: updateError } = await this.supabaseService.getClient()
        .from('organization_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date(),
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('❌ Failed to update invitation status:', updateError);
        throw new BadRequestException('Failed to update invitation status');
      }

      console.log('✅ Invitation accepted successfully');

      // Generate JWT token for the new user
      const payload = {
        sub: userId,
        email: invitation.invitedEmail,
        organizationId: invitation.organizationId,
        role: invitation.role,
      };

      return {
        access_token: 'jwt-token-here', // This will be generated by JwtService
        user: {
          id: userId,
          email: invitation.invitedEmail,
          firstName: acceptDto.firstName,
          lastName: acceptDto.lastName,
        },
        message: 'Welcome to the organization!',
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ Accept invitation failed:', error);
      throw new BadRequestException('Failed to accept invitation');
    }
  }

  /**
   * Decline an invitation
   */
  async declineInvitation(token: string, declineDto: DeclineInvitationDto): Promise<void> {
    try {
      const invitation = await this.getInvitationByToken(token);

      // Mark invitation as declined
      const { error: updateError } = await this.supabaseService.getClient()
        .from('organization_invitations')
        .update({
          status: 'declined',
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('❌ Failed to decline invitation:', updateError);
        throw new BadRequestException('Failed to decline invitation');
      }

      console.log('✅ Invitation declined successfully');
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ Decline invitation failed:', error);
      throw new BadRequestException('Failed to decline invitation');
    }
  }

  /**
   * Cancel an invitation
   */
  async cancelInvitation(organizationId: string, invitationId: string, userId: string): Promise<void> {
    try {
      // Check if user has permission to cancel invitations
      const { data: membership, error: membershipError } = await this.supabaseService.getClient()
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single();

      if (membershipError || !membership) {
        throw new UnauthorizedException('You are not a member of this organization');
      }

      if (!['owner', 'admin'].includes(membership.role)) {
        throw new UnauthorizedException('Only owners and admins can cancel invitations');
      }

      // Delete invitation
      const { error: deleteError } = await this.supabaseService.getClient()
        .from('organization_invitations')
        .delete()
        .eq('id', invitationId)
        .eq('organization_id', organizationId);

      if (deleteError) {
        console.error('❌ Failed to cancel invitation:', deleteError);
        throw new BadRequestException('Failed to cancel invitation');
      }

      console.log('✅ Invitation cancelled successfully');
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ Cancel invitation failed:', error);
      throw new BadRequestException('Failed to cancel invitation');
    }
  }

  /**
   * Resend an invitation
   */
  async resendInvitation(organizationId: string, invitationId: string, userId: string): Promise<void> {
    try {
      // Check if user has permission to resend invitations
      const { data: membership, error: membershipError } = await this.supabaseService.getClient()
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', userId)
        .single();

      if (membershipError || !membership) {
        throw new UnauthorizedException('You are not a member of this organization');
      }

      if (!['owner', 'admin'].includes(membership.role)) {
        throw new UnauthorizedException('Only owners and admins can resend invitations');
      }

      // Generate new token and extend expiration
      const newToken = this.generateSecureToken();
      const newExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Update invitation
      const { error: updateError } = await this.supabaseService.getClient()
        .from('organization_invitations')
        .update({
          token: newToken,
          expires_at: newExpiresAt,
          status: 'pending',
        })
        .eq('id', invitationId)
        .eq('organization_id', organizationId);

      if (updateError) {
        console.error('❌ Failed to resend invitation:', updateError);
        throw new BadRequestException('Failed to resend invitation');
      }

      console.log('✅ Invitation resent successfully');
      
      // Create new in-app notification for the invited user
      try {
        // Get invitation details to create notification
        const { data: invitation } = await this.supabaseService.getClient()
          .from('organization_invitations')
          .select(`
            *,
            organizations (
              id,
              name,
              description
            ),
            inviter:users!invited_by (
              id,
              first_name,
              last_name,
              email
            )
          `)
          .eq('id', invitationId)
          .single();

        if (invitation) {
          // Look up the invited user
          const invitedUser = await this.userLookupService.lookupUserByEmail(invitation.invited_email);
          if (invitedUser) {
            const inviter = invitation.inviter;
            const organization = invitation.organizations;
            const inviterName = `${inviter.first_name} ${inviter.last_name}`;
            
            await this.userLookupService.createInvitationNotification(
              invitedUser.id,
              organizationId,
              inviterName,
              organization.name,
              invitation.role,
              invitation.id
            );
            
            console.log('✅ Resend notification created for invited user:', invitedUser.id);
          }
        }
      } catch (notificationError) {
        console.error('❌ Failed to create resend notification:', notificationError);
        // Don't fail the resend if notification fails
      }
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ Resend invitation failed:', error);
      throw new BadRequestException('Failed to resend invitation');
    }
  }

  /**
   * Accept an invitation by ID (for in-app notifications)
   */
  async acceptInvitationById(organizationId: string, invitationId: string, userId: string): Promise<any> {
    try {
      // Get invitation details
      const { data: invitation, error: invitationError } = await this.supabaseService.getClient()
        .from('organization_invitations')
        .select(`
          *,
          organizations (
            id,
            name,
            description
          ),
          inviter:users!invited_by (
            id,
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', invitationId)
        .eq('organization_id', organizationId)
        .single();

      if (invitationError || !invitation) {
        throw new NotFoundException('Invitation not found');
      }

      // Check if invitation is expired
      if (new Date(invitation.expires_at) < new Date()) {
        throw new BadRequestException('Invitation has expired');
      }

      // Check if invitation is already accepted or declined
      if (invitation.status !== 'pending') {
        throw new BadRequestException(`Invitation has already been ${invitation.status}`);
      }

      // Add user to organization
      const { error: memberError } = await this.supabaseService.createOrganizationMember({
        user_id: userId,
        organization_id: organizationId,
        role: invitation.role,
        invited_by: invitation.invited_by,
        invitation_id: invitation.id,
        joined_via: 'invitation',
      });

      if (memberError) {
        console.error('❌ Failed to add user to organization:', memberError);
        throw new BadRequestException('Failed to add user to organization');
      }

      // Mark invitation as accepted
      const { error: updateError } = await this.supabaseService.getClient()
        .from('organization_invitations')
        .update({
          status: 'accepted',
          accepted_at: new Date(),
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('❌ Failed to update invitation status:', updateError);
        throw new BadRequestException('Failed to update invitation status');
      }

      console.log('✅ Invitation accepted successfully');

      return {
        message: 'Welcome to the organization!',
        organization: {
          id: invitation.organizations.id,
          name: invitation.organizations.name,
          description: invitation.organizations.description,
        }
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ Accept invitation by ID failed:', error);
      throw new BadRequestException('Failed to accept invitation');
    }
  }

  /**
   * Decline an invitation by ID (for in-app notifications)
   */
  async declineInvitationById(organizationId: string, invitationId: string, userId: string): Promise<void> {
    try {
      // Get invitation details
      const { data: invitation, error: invitationError } = await this.supabaseService.getClient()
        .from('organization_invitations')
        .select('*')
        .eq('id', invitationId)
        .eq('organization_id', organizationId)
        .single();

      if (invitationError || !invitation) {
        throw new NotFoundException('Invitation not found');
      }

      // Check if invitation is already accepted or declined
      if (invitation.status !== 'pending') {
        throw new BadRequestException(`Invitation has already been ${invitation.status}`);
      }

      // Mark invitation as declined
      const { error: updateError } = await this.supabaseService.getClient()
        .from('organization_invitations')
        .update({
          status: 'declined',
        })
        .eq('id', invitation.id);

      if (updateError) {
        console.error('❌ Failed to decline invitation:', updateError);
        throw new BadRequestException('Failed to decline invitation');
      }

      console.log('✅ Invitation declined successfully');
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      console.error('❌ Decline invitation by ID failed:', error);
      throw new BadRequestException('Failed to decline invitation');
    }
  }

  /**
   * Get user ID by email
   */
  private async getUserIdByEmail(email: string): Promise<string | null> {
    try {
      const { data: user } = await this.supabaseService.getUserProfileByEmail(email);
      return user?.id || null;
    } catch {
      return null;
    }
  }

  /**
   * Generate secure token for invitation
   */
  private generateSecureToken(): string {
    return randomBytes(32).toString('hex');
  }

  /**
   * Map database invitation to DTO
   */
  private mapInvitationToDto(invitation: any): InvitationDto {
    return {
      id: invitation.id,
      organizationId: invitation.organization_id,
      invitedBy: invitation.invited_by,
      invitedEmail: invitation.invited_email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: new Date(invitation.expires_at),
      createdAt: new Date(invitation.created_at),
      acceptedAt: invitation.accepted_at ? new Date(invitation.accepted_at) : undefined,
      organization: {
        id: invitation.organizations.id,
        name: invitation.organizations.name,
        description: invitation.organizations.description,
      },
      inviter: {
        id: invitation.inviter.id,
        firstName: invitation.inviter.first_name,
        lastName: invitation.inviter.last_name,
        email: invitation.inviter.email,
      },
    };
  }
}
