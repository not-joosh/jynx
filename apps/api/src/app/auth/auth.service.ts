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
        console.error('❌ Supabase Login Error:', error);
        
        // Handle specific Supabase auth errors
        if (error.code === 'email_not_confirmed') {
          throw new UnauthorizedException('Please check your email and click the confirmation link before logging in.');
        }
        
        if (error.code === 'invalid_credentials') {
          throw new UnauthorizedException('Invalid email or password.');
        }
        
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        throw new UnauthorizedException('Login failed. Please try again.');
      }

      console.log('✅ User authenticated with Supabase:', data.user.id);

      // Try to get user profile from database
      let userProfile = null;
      try {
        const { data: profileData, error: profileError } = await this.supabaseService.getUserProfile(data.user.id);
        
        if (profileError) {
          console.log('⚠️ User profile not found in database, using auth data only');
          // User exists in Supabase Auth but not in our database yet
          // This can happen if user was created before database tables were set up
          userProfile = {
            first_name: data.user.user_metadata?.first_name || 'User',
            last_name: data.user.user_metadata?.last_name || 'Name',
            role: 'owner', // Default to owner for existing users
            current_organization_id: null
          };
        } else {
          userProfile = profileData;
          console.log('✅ User profile found in database');
        }
      } catch (dbError) {
        console.log('⚠️ Database error, using auth data only:', dbError);
        // Fallback to auth metadata
        userProfile = {
          first_name: data.user.user_metadata?.first_name || 'User',
          last_name: data.user.user_metadata?.last_name || 'Name',
          role: 'owner',
          current_organization_id: null
        };
      }

      // Generate JWT token
      const payload = { 
        sub: data.user.id, 
        email: data.user.email,
        firstName: userProfile.first_name,
        lastName: userProfile.last_name,
        organizationId: userProfile.current_organization_id,
        role: userProfile.role || 'owner'
      };
      
      console.log('✅ Login successful, generating JWT token');
      
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
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('❌ Login failed:', error);
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
        console.error('❌ Supabase Auth Error:', authError);
        
        // Handle specific Supabase auth errors
        if (authError.code === 'user_already_registered') {
          // User exists in Supabase Auth but might not have confirmed email
          // Instead of failing, automatically resend confirmation email
          console.log('🔄 User already exists, resending confirmation email...');
          
          try {
            const resendResult = await this.supabaseService.resendConfirmation(createUserDto.email);
            
            if (resendResult.error) {
              console.error('❌ Failed to resend confirmation:', resendResult.error);
              throw new UnauthorizedException('An account with this email already exists. Please check your email and click the confirmation link.');
            }
            
            console.log('✅ Confirmation email resent successfully');
            
            // Return success response with resend message
            return {
              access_token: '', // No token since user isn't confirmed yet
              user: {
                id: '',
                email: createUserDto.email,
                firstName: createUserDto.firstName,
                lastName: createUserDto.lastName,
              },
              message: 'An account with this email already exists. We\'ve sent you a new confirmation email. Please check your inbox and click the confirmation link.'
            };
            
          } catch (resendError) {
            console.error('❌ Error resending confirmation:', resendError);
            throw new UnauthorizedException('An account with this email already exists. Please check your email and click the confirmation link.');
          }
        }
        
        if (authError.message?.includes('Email address is invalid')) {
          throw new UnauthorizedException('Please use a valid email address.');
        }
        
        console.error('❌ Error details:', JSON.stringify(authError, null, 2));
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
        firstName: createUserDto.firstName,
        lastName: createUserDto.lastName,
        organizationId: orgData.id,
        role: 'owner'
      };
      
      console.log('✅ Registration completed successfully');
      
      // Check if user needs email confirmation
      const needsEmailConfirmation = !authData.user.email_confirmed_at;
      
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: authData.user.id,
          email: authData.user.email,
          firstName: createUserDto.firstName,
          lastName: createUserDto.lastName,
        },
        message: needsEmailConfirmation 
          ? 'Registration successful! Please check your email and click the confirmation link to activate your account.'
          : 'Registration successful! You can now log in.'
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof InternalServerErrorException) {
        throw error;
      }
      console.error('❌ Registration failed:', error);
      throw new UnauthorizedException('Registration failed');
    }
  }

  async resendConfirmation(email: string): Promise<{ message: string }> {
    try {
      const { error } = await this.supabaseService.resendConfirmation(email);
      
      if (error) {
        console.error('❌ Resend confirmation error:', error);
        
        if (error.message?.includes('Email not found')) {
          throw new UnauthorizedException('No account found with this email address.');
        }
        
        if (error.message?.includes('already confirmed')) {
          throw new UnauthorizedException('This email has already been confirmed. You can log in now.');
        }
        
        throw new UnauthorizedException('Failed to resend confirmation email: ' + error.message);
      }
      
      console.log('✅ Confirmation email resent to:', email);
      
      return {
        message: 'Confirmation email has been resent. Please check your inbox and click the confirmation link.'
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('❌ Resend confirmation failed:', error);
      throw new UnauthorizedException('Failed to resend confirmation email');
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
