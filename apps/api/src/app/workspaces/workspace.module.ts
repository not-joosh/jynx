import { Module } from '@nestjs/common';
import { WorkspaceController, OrganizationMembersController } from './workspace.controller';
import { WorkspaceService } from './workspace.service';
import { BackendSupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [WorkspaceController, OrganizationMembersController],
  providers: [WorkspaceService, BackendSupabaseService],
  exports: [WorkspaceService],
})
export class WorkspaceModule {}
