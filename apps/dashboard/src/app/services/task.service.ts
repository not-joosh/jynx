import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { TaskDto, CreateTaskDto, UpdateTaskDto, TaskFilterDto, TaskStatus, TaskPriority } from '@challenge/data';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = 'http://localhost:3000/api/v1'; // TODO: Move to environment
  private tasksSubject = new BehaviorSubject<TaskDto[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Create a new task
  createTask(createTaskDto: CreateTaskDto): Observable<TaskDto> {
    return this.http.post<TaskDto>(`${this.apiUrl}/tasks`, createTaskDto);
  }

  // Get tasks with optional filters
  getTasks(filter?: TaskFilterDto): Observable<TaskDto[]> {
    let params = new HttpParams();
    
    if (filter?.status && filter.status.length > 0) {
      params = params.set('status', filter.status.join(','));
    }
    if (filter?.priority && filter.priority.length > 0) {
      params = params.set('priority', filter.priority.join(','));
    }
    if (filter?.assigneeId) {
      params = params.set('assigneeId', filter.assigneeId);
    }
    if (filter?.search) {
      params = params.set('search', filter.search);
    }

    return this.http.get<TaskDto[]>(`${this.apiUrl}/tasks`, { params });
  }

  // Get a specific task by ID
  getTaskById(taskId: string): Observable<TaskDto> {
    return this.http.get<TaskDto>(`${this.apiUrl}/tasks/${taskId}`);
  }

  // Update a task
  updateTask(taskId: string, updateTaskDto: UpdateTaskDto): Observable<TaskDto> {
    return this.http.put<TaskDto>(`${this.apiUrl}/tasks/${taskId}`, updateTaskDto);
  }

  // Delete a task
  deleteTask(taskId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/tasks/${taskId}`);
  }

  // Update local tasks list
  updateTasksList(tasks: TaskDto[]): void {
    this.tasksSubject.next(tasks);
  }

  // Get current tasks list
  getCurrentTasks(): TaskDto[] {
    return this.tasksSubject.value;
  }

  // Helper method to get tasks by status
  getTasksByStatus(status: TaskStatus): TaskDto[] {
    return this.getCurrentTasks().filter(task => task.status === status);
  }

  // Helper method to get tasks by priority
  getTasksByPriority(priority: TaskPriority): TaskDto[] {
    return this.getCurrentTasks().filter(task => task.priority === priority);
  }

  // Helper method to get task statistics
  getTaskStats(): { total: number; completed: number; inProgress: number; todo: number } {
    const tasks = this.getCurrentTasks();
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === TaskStatus.COMPLETED).length,
      inProgress: tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length,
      todo: tasks.filter(t => t.status === TaskStatus.TODO).length
    };
  }
}
