import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { BackendSupabaseService } from '../supabase/supabase.service';
import { NotificationsService } from '../notifications/notifications.service';

@Module({
  controllers: [TaskController],
  providers: [TaskService, BackendSupabaseService, NotificationsService],
  exports: [TaskService],
})
export class TaskModule {}
