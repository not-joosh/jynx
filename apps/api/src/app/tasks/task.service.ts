import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { BackendSupabaseService } from '../supabase/supabase.service';
import { TaskDto, CreateTaskDto, UpdateTaskDto, TaskFilterDto, TaskStatus } from '@challenge/data/backend';

@Injectable()
export class TaskService {
  constructor(private supabaseService: BackendSupabaseService) {}

  async createTask(createTaskDto: CreateTaskDto, creatorId: string, organizationId: string): Promise<TaskDto> {
    const taskData = {
      title: createTaskDto.title,
      description: createTaskDto.description || '',
      status: createTaskDto.status || TaskStatus.TODO,
      priority: createTaskDto.priority,
      organization_id: organizationId,
      assignee_id: createTaskDto.assigneeId || null,
      creator_id: creatorId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabaseService.createTask(taskData);

    if (error) {
      throw new Error(`Failed to create task: ${error.message}`);
    }

    return this.mapToTaskDto(data);
  }

  async getTasks(organizationId: string, userId: string, userRole: string, filter?: TaskFilterDto): Promise<TaskDto[]> {
    const { data, error } = await this.supabaseService.getTasks(organizationId, filter);

    if (error) {
      throw new Error(`Failed to fetch tasks: ${error.message}`);
    }

    // Filter tasks based on user role and permissions
    const accessibleTasks = data.filter(task => this.canAccessTask(task, userId, userRole));
    
    return accessibleTasks.map(task => this.mapToTaskDto(task));
  }

  async getTaskById(taskId: string, userId: string, userRole: string): Promise<TaskDto> {
    const { data, error } = await this.supabaseService.getTaskById(taskId);

    if (error) {
      throw new Error(`Failed to fetch task: ${error.message}`);
    }

    if (!data) {
      throw new NotFoundException('Task not found');
    }

    if (!this.canAccessTask(data, userId, userRole)) {
      throw new ForbiddenException('You do not have permission to access this task');
    }

    return this.mapToTaskDto(data);
  }

  async updateTask(taskId: string, updateTaskDto: UpdateTaskDto, userId: string, userRole: string): Promise<TaskDto> {
    // First, get the existing task to check permissions
    const existingTask = await this.getTaskById(taskId, userId, userRole);

    // Special case: if only marking as complete, use more lenient permissions
    const isOnlyMarkingComplete = updateTaskDto.status === TaskStatus.DONE && 
                                 !updateTaskDto.title && 
                                 !updateTaskDto.description && 
                                 !updateTaskDto.priority && 
                                 !updateTaskDto.assigneeId;

    if (isOnlyMarkingComplete) {
      // Allow assigned users to mark tasks as complete
      if (!this.canMarkAsComplete(existingTask, userId, userRole)) {
        throw new ForbiddenException('You can only mark tasks assigned to you as complete');
      }
    } else {
      // Check if user can edit this task for other updates
      if (!this.canEditTask(existingTask, userId, userRole)) {
        throw new ForbiddenException('You do not have permission to edit this task');
      }
    }

    const updateData = {
      ...updateTaskDto,
      updated_at: new Date().toISOString(),
    };

    // Handle completedAt field
    if (updateTaskDto.completedAt) {
      updateData['completed_at'] = updateTaskDto.completedAt.toISOString();
    }

    // If status is being changed to DONE, set completed_at
    if (updateTaskDto.status === TaskStatus.DONE && existingTask.status !== TaskStatus.DONE) {
      updateData['completed_at'] = new Date().toISOString();
    }

    const { data, error } = await this.supabaseService.updateTask(taskId, updateData);

    if (error) {
      throw new Error(`Failed to update task: ${error.message}`);
    }

    return this.mapToTaskDto(data);
  }

  async deleteTask(taskId: string, userId: string, userRole: string): Promise<void> {
    // First, get the existing task to check permissions
    const existingTask = await this.getTaskById(taskId, userId, userRole);

    // Check if user can delete this task
    if (!this.canDeleteTask(existingTask, userId, userRole)) {
      throw new ForbiddenException('You do not have permission to delete this task');
    }

    const { error } = await this.supabaseService.deleteTask(taskId);

    if (error) {
      throw new Error(`Failed to delete task: ${error.message}`);
    }
  }

  private canAccessTask(task: any, userId: string, userRole: string): boolean {
    // Owners and Admins can see all tasks
    if (userRole === 'owner' || userRole === 'admin') {
      return true;
    }

    // Members can see tasks assigned to them or created by them
    if (userRole === 'member') {
      return task.assignee_id === userId || task.creator_id === userId;
    }

    // Viewers can only see tasks assigned to them
    if (userRole === 'viewer') {
      return task.assignee_id === userId;
    }

    return false;
  }

  private canEditTask(task: TaskDto, userId: string, userRole: string): boolean {
    // Owners and Admins can edit all tasks
    if (userRole === 'owner' || userRole === 'admin') {
      return true;
    }

    // Members can edit tasks assigned to them or created by them
    if (userRole === 'member') {
      return task.assigneeId === userId || task.creatorId === userId;
    }

    // Viewers cannot edit tasks
    return false;
  }

  private canDeleteTask(task: TaskDto, userId: string, userRole: string): boolean {
    // Only Owners and Admins can delete tasks
    return userRole === 'owner' || userRole === 'admin';
  }

  private canMarkAsComplete(task: TaskDto, userId: string, userRole: string): boolean {
    // Users can mark tasks as complete if:
    // 1. The task is assigned to them
    // 2. The task is not already completed
    // 3. They have at least member role
    return (
      (userRole === 'member' || userRole === 'admin' || userRole === 'owner') &&
      task.assigneeId === userId &&
      task.status !== TaskStatus.DONE
    );
  }

  private mapToTaskDto(data: any): TaskDto {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      organizationId: data.organization_id,
      assigneeId: data.assignee_id,
      creatorId: data.creator_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    };
  }
}
