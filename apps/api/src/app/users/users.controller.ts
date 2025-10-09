import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserLookupService, UserLookupDto } from './user-lookup.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private userLookupService: UserLookupService) {}

  /**
   * Look up a user by email
   */
  @Post('lookup')
  async lookupUser(@Body() lookupDto: UserLookupDto) {
    const user = await this.userLookupService.lookupUserByEmail(lookupDto.email);
    
    if (!user) {
      return { found: false, message: 'User not found' };
    }

    return { found: true, user };
  }
}

