import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, TaskStatus, TaskPriority } from '@challenge/data';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(Task)
    private taskRepository: Repository<Task>,
  ) {}

  async findAll(organizationId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { organizationId, isActive: true },
      order: { order: 'ASC', createdAt: 'DESC' },
    });
  }

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    const task = this.taskRepository.create(createTaskDto);
    return this.taskRepository.save(task);
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<Task> {
    await this.taskRepository.update(id, updateTaskDto);
    return this.taskRepository.findOne({ where: { id } });
  }

  async remove(id: string): Promise<void> {
    await this.taskRepository.update(id, { isActive: false });
  }

  async findOne(id: string): Promise<Task> {
    return this.taskRepository.findOne({ where: { id, isActive: true } });
  }
}
