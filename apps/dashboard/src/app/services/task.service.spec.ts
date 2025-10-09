import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TaskService } from './task.service';
import { TaskDto, TaskStatus, TaskPriority, CreateTaskDto, UpdateTaskDto, TaskFilterDto } from '@challenge/data';
import { environment } from '../../environments/environment';

describe('TaskService', () => {
  let service: TaskService;
  let httpMock: HttpTestingController;

  const mockTask: TaskDto = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    organizationId: 'org-1',
    assigneeId: 'user-1',
    creatorId: 'creator-1',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-01-01'),
    completedAt: null
  };

  const mockCreateTaskDto: CreateTaskDto = {
    title: 'New Task',
    description: 'New Description',
    priority: TaskPriority.HIGH,
    status: TaskStatus.TODO,
    assigneeId: 'user-1',
    organizationId: 'org-1'
  };

  const mockUpdateTaskDto: UpdateTaskDto = {
    title: 'Updated Task',
    description: 'Updated Description',
    priority: TaskPriority.LOW,
    status: TaskStatus.IN_PROGRESS,
    assigneeId: 'user-2'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [TaskService]
    });
    service = TestBed.inject(TaskService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTasks', () => {
    it('should fetch tasks with filter', () => {
      const filter: TaskFilterDto = {
        status: [TaskStatus.TODO],
        priority: [TaskPriority.HIGH],
        search: 'test'
      };

      service.getTasks(filter).subscribe(tasks => {
        expect(tasks).toEqual([mockTask]);
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/tasks') && req.method === 'GET');
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('status')).toBe(TaskStatus.TODO);
      expect(req.request.params.get('priority')).toBe(TaskPriority.HIGH);
      expect(req.request.params.get('search')).toBe('test');
      
      req.flush([mockTask]);
    });

    it('should fetch tasks without filter', () => {
      service.getTasks({}).subscribe(tasks => {
        expect(tasks).toEqual([mockTask]);
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/tasks') && req.method === 'GET');
      expect(req.request.method).toBe('GET');
      
      req.flush([mockTask]);
    });

    it('should handle HTTP errors', () => {
      const filter: TaskFilterDto = {};
      
      service.getTasks(filter).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(req => req.url.includes('/api/v1/tasks') && req.method === 'GET');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('createTask', () => {
    it('should create a task successfully', () => {
      service.createTask(mockCreateTaskDto).subscribe(task => {
        expect(task).toEqual(mockTask);
      });

      const req = httpMock.expectOne(`http://localhost:3000/api/v1/tasks`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCreateTaskDto);
      
      req.flush(mockTask);
    });

    it('should handle creation errors', () => {
      service.createTask(mockCreateTaskDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`http://localhost:3000/api/v1/tasks`);
      req.flush('Bad Request', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', () => {
      const taskId = '1';
      const updatedTask = { ...mockTask, title: 'Updated Task' };

      service.updateTask(taskId, mockUpdateTaskDto).subscribe(task => {
        expect(task).toEqual(updatedTask);
      });

      const req = httpMock.expectOne(`http://localhost:3000/api/v1/tasks/${taskId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockUpdateTaskDto);
      
      req.flush(updatedTask);
    });

    it('should handle update errors', () => {
      const taskId = '1';

      service.updateTask(taskId, mockUpdateTaskDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`http://localhost:3000/api/v1/tasks/${taskId}`);
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', () => {
      const taskId = '1';

      service.deleteTask(taskId).subscribe(response => {
        expect(response).toEqual({});
      });

      const req = httpMock.expectOne(`http://localhost:3000/api/v1/tasks/${taskId}`);
      expect(req.request.method).toBe('DELETE');
      
      req.flush({});
    });

    it('should handle deletion errors', () => {
      const taskId = '1';

      service.deleteTask(taskId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(403);
        }
      });

      const req = httpMock.expectOne(`http://localhost:3000/api/v1/tasks/${taskId}`);
      req.flush('Forbidden', { status: 403, statusText: 'Forbidden' });
    });
  });

  describe('getTaskStats', () => {
    it('should fetch task statistics', () => {
      const mockStats = {
        total: 10,
        completed: 3,
        inProgress: 4,
        todo: 3,
        overdue: 1
      };

      // Mock the tasksSubject to return tasks for stats calculation
      service['tasksSubject'].next([
        { ...mockTask, status: TaskStatus.COMPLETED },
        { ...mockTask, status: TaskStatus.IN_PROGRESS },
        { ...mockTask, status: TaskStatus.TODO }
      ]);

      const stats = service.getTaskStats();

      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('inProgress');
      expect(stats).toHaveProperty('todo');
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.completed).toBe('number');
      expect(typeof stats.inProgress).toBe('number');
      expect(typeof stats.todo).toBe('number');
    });

    it('should handle stats errors', () => {
      // Since getTaskStats is synchronous, we don't need to test error handling
      // But we can test edge cases like empty tasks
      service['tasksSubject'].next([]);
      
      const stats = service.getTaskStats();
      
      expect(stats.total).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.inProgress).toBe(0);
      expect(stats.todo).toBe(0);
    });
  });

  describe('updateTasksList', () => {
    it('should update the tasks list', () => {
      const tasks = [mockTask];
      
      service.updateTasksList(tasks);
      
      // This method doesn't return anything, just updates internal state
      // We can test that it doesn't throw an error
      expect(() => service.updateTasksList(tasks)).not.toThrow();
    });
  });


  describe('URL Construction', () => {
    it('should construct correct URLs for different endpoints', () => {
      // Test getTasks URL
      service.getTasks({}).subscribe();
      httpMock.expectOne(`http://localhost:3000/api/v1/tasks`);

      // Test createTask URL
      service.createTask(mockCreateTaskDto).subscribe();
      httpMock.expectOne(`http://localhost:3000/api/v1/tasks`);

      // Test updateTask URL
      service.updateTask('1', mockUpdateTaskDto).subscribe();
      httpMock.expectOne(`http://localhost:3000/api/v1/tasks/1`);

      // Test deleteTask URL
      service.deleteTask('1').subscribe();
      httpMock.expectOne(`http://localhost:3000/api/v1/tasks/1`);

      // Test getTaskStats URL - this is synchronous, no HTTP call
      const stats = service.getTaskStats();
      expect(stats).toBeDefined();
    });
  });

  describe('Request Body Validation', () => {
    it('should send correct body for createTask', () => {
      service.createTask(mockCreateTaskDto).subscribe();

      const req = httpMock.expectOne(`http://localhost:3000/api/v1/tasks`);
      expect(req.request.body).toEqual(mockCreateTaskDto);
      expect(req.request.body.title).toBe('New Task');
      expect(req.request.body.description).toBe('New Description');
      expect(req.request.body.priority).toBe(TaskPriority.HIGH);
      expect(req.request.body.status).toBe(TaskStatus.TODO);
      expect(req.request.body.assigneeId).toBe('user-1');
      expect(req.request.body.organizationId).toBe('org-1');
      
      req.flush(mockTask);
    });

    it('should send correct body for updateTask', () => {
      service.updateTask('1', mockUpdateTaskDto).subscribe();

      const req = httpMock.expectOne(`http://localhost:3000/api/v1/tasks/1`);
      expect(req.request.body).toEqual(mockUpdateTaskDto);
      expect(req.request.body.title).toBe('Updated Task');
      expect(req.request.body.description).toBe('Updated Description');
      expect(req.request.body.priority).toBe(TaskPriority.LOW);
      expect(req.request.body.status).toBe(TaskStatus.IN_PROGRESS);
      expect(req.request.body.assigneeId).toBe('user-2');
      
      req.flush(mockTask);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', () => {
      service.getTasks({}).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.name).toBe('HttpErrorResponse');
        }
      });

      const req = httpMock.expectOne(`http://localhost:3000/api/v1/tasks`);
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle timeout errors', () => {
      service.getTasks({}).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(0);
        }
      });

      const req = httpMock.expectOne(`http://localhost:3000/api/v1/tasks`);
      req.flush(null, { status: 0, statusText: 'Unknown Error' });
    });
  });
});
