import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AccessControlGuard } from '../common/guards/access-control.guard';
import { RequirePermission } from '../common/decorators/access-control.decorator';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto, TaskFilterDto, TaskDto } from '@challenge/data/backend';
import { Permission } from '../common/permissions';

@Controller('tasks')
@UseGuards(JwtAuthGuard, AccessControlGuard)
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Post()
  @RequirePermission({ permission: Permission.TASK_CREATE })
  async createTask(
    @Body() createTaskDto: CreateTaskDto,
    @Request() req: any
  ): Promise<TaskDto> {
    const userId = req.user.id; // Changed from req.user.sub to req.user.id
    const organizationId = req.user.organizationId;

    console.log('Creating task with userId:', userId, 'organizationId:', organizationId);

    if (!userId) {
      throw new Error('User ID not found in token');
    }

    if (!organizationId) {
      throw new Error('User must be associated with an organization to create tasks');
    }

    return this.taskService.createTask(createTaskDto, userId, organizationId);
  }

  @Get()
  @RequirePermission({ permission: Permission.TASK_READ })
  async getTasks(
    @Query() filter: TaskFilterDto,
    @Request() req: any
  ): Promise<TaskDto[]> {
    const userId = req.user.id;
    const organizationId = req.user.organizationId;
    const userRole = req.user.role;

    if (!organizationId) {
      throw new Error('User must be associated with an organization to view tasks');
    }

    return this.taskService.getTasks(organizationId, userId, userRole, filter);
  }

  @Get(':id')
  @RequirePermission({ permission: Permission.TASK_READ })
  async getTaskById(
    @Param('id') taskId: string,
    @Request() req: any
  ): Promise<TaskDto> {
    const userId = req.user.id;
    const userRole = req.user.role;

    return this.taskService.getTaskById(taskId, userId, userRole);
  }

  @Put(':id')
  @RequirePermission({ permission: Permission.TASK_UPDATE })
  async updateTask(
    @Param('id') taskId: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @Request() req: any
  ): Promise<TaskDto> {
    const userId = req.user.id;
    const userRole = req.user.role;

    return this.taskService.updateTask(taskId, updateTaskDto, userId, userRole);
  }

  @Delete(':id')
  @RequirePermission({ permission: Permission.TASK_DELETE })
  async deleteTask(
    @Param('id') taskId: string,
    @Request() req: any
  ): Promise<{ message: string }> {
    const userId = req.user.id;
    const userRole = req.user.role;

    await this.taskService.deleteTask(taskId, userId, userRole);
    return { message: 'Task deleted successfully' };
  }

  @Get('audit/logs')
  @RequirePermission({ permission: Permission.AUDIT_READ })
  async getAuditLogs(@Request() req: any): Promise<{ message: string }> {
    // For now, return a message indicating audit logs are available in console
    // In a real implementation, you'd query a database table for audit logs
    return { 
      message: 'Audit logs are currently logged to console. Check server logs for access attempts.' 
    };
  }
}