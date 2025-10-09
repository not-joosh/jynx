import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { MemberManagementService } from './member-management.service';
import { MemberManagementController } from './member-management.controller';
import { BackendSupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [MembersController, MemberManagementController],
  providers: [MembersService, MemberManagementService, BackendSupabaseService],
  exports: [MembersService, MemberManagementService],
})
export class MembersModule {}
