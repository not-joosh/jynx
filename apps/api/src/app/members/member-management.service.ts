import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BackendSupabaseService } from '../supabase/supabase.service';

export interface UpdateMemberRoleDto {
  role: 'admin' | 'member' | 'viewer';
}

@Injectable()
export class MemberManagementService {
  constructor(private supabaseService: BackendSupabaseService) {}

  /**
   * Update a member's role
   */
  async updateMemberRole(
    organizationId: string,
    userId: string,
    updateRoleDto: UpdateMemberRoleDto,
    requesterId: string,
    requesterRole: string
  ): Promise<any> {
    // Check if requester has permission
    if (requesterRole !== 'owner') {
      throw new ForbiddenException('Only owners can change member roles');
    }

    // Get the member to update
    const { data: member, error: memberError } = await this.supabaseService.getClient()
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (memberError || !member) {
      throw new NotFoundException('Member not found');
    }

    // Prevent changing owner role
    if (member.role === 'owner') {
      throw new ForbiddenException('Cannot change owner role');
    }

    // Update the member's role
    const { data: updatedMember, error: updateError } = await this.supabaseService.getClient()
      .from('organization_members')
      .update({ 
        role: updateRoleDto.role,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .select(`
        *,
        users!organization_members_user_id_fkey(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .single();

    if (updateError) {
      throw new Error(`Failed to update member role: ${updateError.message}`);
    }

    return this.mapToMemberDto(updatedMember);
  }

  /**
   * Remove a member from the organization
   */
  async removeMember(
    organizationId: string,
    userId: string,
    requesterId: string,
    requesterRole: string
  ): Promise<void> {
    // Get the member to remove
    const { data: member, error: memberError } = await this.supabaseService.getClient()
      .from('organization_members')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (memberError || !member) {
      throw new NotFoundException('Member not found');
    }

    // Check permissions
    if (requesterRole === 'owner') {
      // Owners can remove anyone except themselves
      if (member.user_id === requesterId) {
        throw new ForbiddenException('Owners cannot remove themselves');
      }
    } else if (requesterRole === 'admin') {
      // Admins can only remove members and viewers
      if (member.role === 'admin' || member.role === 'owner') {
        throw new ForbiddenException('Admins cannot remove other admins or owners');
      }
    } else {
      throw new ForbiddenException('Insufficient permissions to remove members');
    }

    // Remove the member
    const { error: deleteError } = await this.supabaseService.getClient()
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', userId);

    if (deleteError) {
      throw new Error(`Failed to remove member: ${deleteError.message}`);
    }
  }

  /**
   * Get member details
   */
  async getMember(
    organizationId: string,
    userId: string
  ): Promise<any> {
    const { data: member, error } = await this.supabaseService.getClient()
      .from('organization_members')
      .select(`
        *,
        users!organization_members_user_id_fkey(
          id,
          email,
          first_name,
          last_name
        )
      `)
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .single();

    if (error || !member) {
      throw new NotFoundException('Member not found');
    }

    return this.mapToMemberDto(member);
  }

  private mapToMemberDto(data: any): any {
    const user = Array.isArray(data.users) ? data.users[0] : data.users;
    
    return {
      id: data.user_id,
      firstName: user?.first_name || 'Unknown',
      lastName: user?.last_name || 'User',
      email: user?.email || 'unknown@example.com',
      role: data.role,
      joinedAt: data.joined_at,
      joinedVia: data.joined_via
    };
  }
}

