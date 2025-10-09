import { Module } from '@nestjs/common';
import { InvitationController, InvitationAcceptanceController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { UserLookupService } from '../users/user-lookup.service';
import { BackendSupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [InvitationController, InvitationAcceptanceController],
  providers: [InvitationService, UserLookupService, BackendSupabaseService],
  exports: [InvitationService],
})
export class InvitationModule {}
