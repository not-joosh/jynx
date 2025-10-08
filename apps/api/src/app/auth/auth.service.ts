import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto, CreateUserDto, AuthResponseDto } from '@challenge/data/backend';
import { BackendSupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private supabaseService: BackendSupabaseService
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    try {
      // Authenticate with Supabase
      const { data, error } = await this.supabaseService.signInWithPassword(
        loginDto.email,
        loginDto.password
      );

      if (error) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Get user profile from database
      const { data: userProfile, error: profileError } = await this.supabaseService.getUserProfile(data.user.id);
      
      if (profileError) {
        throw new InternalServerErrorException('Failed to fetch user profile');
      }

      // Generate JWT token
      const payload = { 
        sub: data.user.id, 
        email: data.user.email,
        organizationId: userProfile.current_organization_id,
        role: userProfile.role || 'viewer'
      };
      
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: userProfile.first_name,
          lastName: userProfile.last_name,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new UnauthorizedException('Login failed');
    }
  }

  async register(createUserDto: CreateUserDto): Promise<AuthResponseDto> {
    try {
      // Step 1: Create user in Supabase Auth
      const { data: authData, error: authError } = await this.supabaseService.signUp(
        createUserDto.email,
        createUserDto.password,
        {
          first_name: createUserDto.firstName,
          last_name: createUserDto.lastName,
        }
      );

      if (authError) {
        throw new UnauthorizedException('Registration failed: ' + authError.message);
      }

      console.log('✅ User created in Supabase Auth:', authData.user.id);

      // Step 2: Create user profile in database
      const { error: profileError } = await this.supabaseService.createUserProfile({
        id: authData.user.id,
        email: createUserDto.email,
        first_name: createUserDto.firstName,
        last_name: createUserDto.lastName,
        role: 'owner', // First user becomes owner
      });

      if (profileError) {
        console.error('❌ Failed to create user profile:', profileError.message);
        throw new InternalServerErrorException('Failed to create user profile: ' + profileError.message);
      }

      console.log('✅ User profile created in database');

      // Step 3: Create organization
      const { data: orgData, error: orgError } = await this.supabaseService.createOrganization({
        name: createUserDto.organizationName,
        description: '', // organizationDescription not in DTO
        owner_id: authData.user.id,
      });

      if (orgError) {
        console.error('❌ Failed to create organization:', orgError.message);
        throw new InternalServerErrorException('Failed to create organization: ' + orgError.message);
      }

      console.log('✅ Organization created:', orgData.id);

      // Step 4: Update user with organization
      const { error: updateError } = await this.supabaseService.getClient()
        .from('users')
        .update({ current_organization_id: orgData.id })
        .eq('id', authData.user.id);

      if (updateError) {
        console.error('❌ Failed to update user with organization:', updateError.message);
        throw new InternalServerErrorException('Failed to update user with organization: ' + updateError.message);
      }

      console.log('✅ User updated with organization');

      // Step 5: Create organization membership
      const { error: memberError } = await this.supabaseService.createOrganizationMember({
        user_id: authData.user.id,
        organization_id: orgData.id,
        role: 'owner',
      });

      if (memberError) {
        console.error('❌ Failed to create organization membership:', memberError.message);
        throw new InternalServerErrorException('Failed to create organization membership: ' + memberError.message);
      }

      console.log('✅ Organization membership created');

      // Step 6: Generate JWT token
      const payload = { 
        sub: authData.user.id, 
        email: authData.user.email,
        organizationId: orgData.id,
        role: 'owner'
      };
      
      console.log('✅ Registration completed successfully');
      
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: authData.user.id,
          email: authData.user.email,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof InternalServerErrorException) {
        throw error;
      }
      console.error('❌ Registration failed:', error);
      throw new UnauthorizedException('Registration failed');
    }
  }

  async validateToken(payload: any): Promise<any> {
    try {
      const { data: userProfile } = await this.supabaseService.getUserProfile(payload.sub);
      if (userProfile) {
        return {
          id: userProfile.id,
          email: userProfile.email,
          firstName: userProfile.first_name,
          lastName: userProfile.last_name,
          role: userProfile.role,
          organizationId: userProfile.current_organization_id,
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}
