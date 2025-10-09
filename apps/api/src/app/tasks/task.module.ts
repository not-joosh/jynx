import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { BackendSupabaseService } from '../supabase/supabase.service';

@Module({
  controllers: [TaskController],
  providers: [TaskService, BackendSupabaseService],
  exports: [TaskService],
})
export class TaskModule {}
