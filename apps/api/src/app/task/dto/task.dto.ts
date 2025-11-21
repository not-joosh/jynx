import { TaskStatus, TaskPriority } from '@challenge/data';

export class CreateTaskDto {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  dueDate?: Date;
  order?: number;
  organizationId: string;
  createdById: string;
}

export class UpdateTaskDto {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: string;
  dueDate?: Date;
  order?: number;
}
