import { Injectable } from '@nestjs/common';
import { BackendSupabaseService } from '../supabase/supabase.service';

export interface UserLookupDto {
  email: string;
}

export interface UserDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
}

@Injectable()
export class UserLookupService {
  constructor(private supabaseService: BackendSupabaseService) {}

  /**
   * Look up a user by email
   */
  async lookupUserByEmail(email: string): Promise<UserDto | null> {
    try {
      console.log('🔍 Looking up user by email:', email);
      
      const { data: user, error } = await this.supabaseService.getClient()
        .from('users')
        .select('id, email, first_name, last_name, role, current_organization_id')
        .eq('email', email.toLowerCase())
        .single();

      console.log('🔍 User lookup result:', { user, error });

      if (error) {
        console.log('❌ User lookup error:', error);
        return null;
      }

      if (!user) {
        console.log('❌ No user found for email:', email);
        return null;
      }

      console.log('✅ User found:', user);

      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        avatar: undefined // avatar_url column doesn't exist
      };
    } catch (error) {
      console.error('❌ Error looking up user:', error);
      return null;
    }
  }

  /**
   * Create an in-app notification for invitation
   */
  async createInvitationNotification(
    userId: string,
    organizationId: string,
    inviterName: string,
    organizationName: string,
    role: string,
    invitationId: string
  ): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient()
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'invitation',
          title: 'Organization Invitation',
          message: `${inviterName} invited you to join ${organizationName} as a ${role}`,
          data: {
            organizationId,
            invitationId,
            inviterName,
            organizationName,
            role,
            type: 'invitation'
          },
          read: false,
          created_at: new Date().toISOString()
        });

      if (error) {
        // If notifications table is missing in Supabase, skip gracefully
        if ((error as any).code === 'PGRST205') {
          console.warn("'notifications' table not found; skipping in-app notification creation.");
          return;
        }
        console.error('Error creating notification:', error);
      }
    } catch (error) {
      console.error('Error creating invitation notification:', error);
    }
  }
}
