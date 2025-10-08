import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class BackendSupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env['SUPABASE_URL'] || process.env['NG_SUPABASE_URL'] || '';
    const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NG_SUPABASE_SERVICE_ROLE_KEY'] || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and Service Role Key must be provided');
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  // Auth methods
  async signUp(email: string, password: string, userData?: any) {
    return this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
  }

  async signInWithPassword(email: string, password: string) {
    return this.supabase.auth.signInWithPassword({
      email,
      password
    });
  }

  async getUser(userId: string) {
    return this.supabase.auth.admin.getUserById(userId);
  }

  // Database methods
  async createUserProfile(userData: any) {
    return this.supabase
      .from('users')
      .insert(userData)
      .select()
      .single();
  }

  async getUserProfile(userId: string) {
    return this.supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
  }

  async createOrganization(orgData: any) {
    return this.supabase
      .from('organizations')
      .insert(orgData)
      .select()
      .single();
  }

  async createOrganizationMember(memberData: any) {
    return this.supabase
      .from('organization_members')
      .insert(memberData);
  }
}
