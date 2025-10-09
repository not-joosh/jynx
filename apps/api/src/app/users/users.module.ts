import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UserLookupService } from './user-lookup.service';
import { BackendSupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [UsersController],
  providers: [UserLookupService, BackendSupabaseService],
  exports: [UserLookupService],
})
export class UsersModule {}

