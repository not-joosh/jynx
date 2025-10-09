import { Injectable } from '@nestjs/common';
import { BackendSupabaseService } from '../supabase/supabase.service';

@Injectable()
export class MembersService {
  constructor(private supabaseService: BackendSupabaseService) {}

  async getOrganizationMembers(organizationId: string): Promise<any[]> {
    const { data, error } = await this.supabaseService.getOrganizationMembers(organizationId);
    
    if (error) {
      console.error('Supabase error:', error);
      throw new Error(`Failed to fetch organization members: ${error.message}`);
    }

    if (!data || data.length === 0) {
      console.log('No members found for organization:', organizationId);
      return [];
    }

    console.log('Raw members data:', JSON.stringify(data, null, 2));

        return data.map(member => {
          // Handle both array and object cases for users
          let user;
          if (Array.isArray(member.users)) {
            user = member.users[0]; // Take first user if it's an array
          } else {
            user = member.users; // Use directly if it's an object
          }

          return {
            id: member.user_id,
            firstName: user?.first_name || 'Unknown',
            lastName: user?.last_name || 'User',
            email: user?.email || 'unknown@example.com',
            role: member.role,
            joinedAt: member.joined_at,
            joinedVia: member.joined_via
          };
        });
  }
}
