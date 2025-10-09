import { Module } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { BackendSupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, BackendSupabaseService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
