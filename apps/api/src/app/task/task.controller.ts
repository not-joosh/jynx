import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';
import { Permission } from '@challenge/auth';

@Controller('tasks')
@UseGuards(PermissionsGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @RequirePermissions(Permission.VIEW_TASKS)
  async findAll(@Param('organizationId') organizationId: string) {
    return this.taskService.findAll(organizationId);
  }

  @Post()
  @RequirePermissions(Permission.CREATE_TASKS)
  async create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @Put(':id')
  @RequirePermissions(Permission.EDIT_TASKS)
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(id, updateTaskDto);
  }

  @Delete(':id')
  @RequirePermissions(Permission.DELETE_TASKS)
  async remove(@Param('id') id: string) {
    return this.taskService.remove(id);
  }
}
