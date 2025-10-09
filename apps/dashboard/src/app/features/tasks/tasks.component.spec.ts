import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { TasksComponent } from './tasks.component';
import { TaskService } from '../../services/task.service';
import { WorkspaceService } from '../../services/workspace.service';
import { AngularAuthService } from '@challenge/auth';
import { NotificationService } from '../../services/notification.service';
import { TaskDto, TaskStatus, TaskPriority, OrganizationRole, Permission } from '@challenge/data';

describe('TasksComponent', () => {
  let component: TasksComponent;
  let fixture: ComponentFixture<TasksComponent>;
  let mockTaskService: jasmine.SpyObj<TaskService>;
  let mockWorkspaceService: jasmine.SpyObj<WorkspaceService>;
  let mockAuthService: jasmine.SpyObj<AngularAuthService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;

  const mockTask: TaskDto = {
    id: '1',
    title: 'Test Task',
    description: 'Test Description',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    organizationId: 'org-1',
    assigneeId: 'user-1',
    creatorId: 'creator-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null
  };

  const mockCompletedTask: TaskDto = {
    ...mockTask,
    id: '2',
    title: 'Completed Task',
    status: TaskStatus.COMPLETED,
    completedAt: new Date()
  };

  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: OrganizationRole.ADMIN
  };

  const mockOrganization = {
    id: 'org-1',
    name: 'Test Org',
    description: 'Test Description',
    role: OrganizationRole.ADMIN,
    memberCount: 5
  };

  beforeEach(async () => {
    const taskServiceSpy = jasmine.createSpyObj('TaskService', [
      'getTasks', 'createTask', 'updateTask', 'deleteTask', 'getTaskStats', 'updateTasksList'
    ]);
    const workspaceServiceSpy = jasmine.createSpyObj('WorkspaceService', [
      'getUserWorkspaces', 'switchWorkspace'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AngularAuthService', [
      'getCurrentUser', 'hasRole', 'hasPermission', 'updateCurrentUser'
    ]);
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', [
      'getNotifications', 'markAsRead', 'removeNotification'
    ]);

    await TestBed.configureTestingModule({
      imports: [TasksComponent, FormsModule],
      providers: [
        { provide: TaskService, useValue: taskServiceSpy },
        { provide: WorkspaceService, useValue: workspaceServiceSpy },
        { provide: AngularAuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TasksComponent);
    component = fixture.componentInstance;
    mockTaskService = TestBed.inject(TaskService) as jasmine.SpyObj<TaskService>;
    mockWorkspaceService = TestBed.inject(WorkspaceService) as jasmine.SpyObj<WorkspaceService>;
    mockAuthService = TestBed.inject(AngularAuthService) as jasmine.SpyObj<AngularAuthService>;
    mockNotificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;

    // Setup default mock returns
    mockAuthService.getCurrentUser.and.returnValue(mockUser);
    mockAuthService.hasRole.and.returnValue(true);
    mockAuthService.hasPermission.and.returnValue(true);
    mockTaskService.getTasks.and.returnValue(of([mockTask]));
    mockWorkspaceService.getUserWorkspaces.and.returnValue(of([mockOrganization]));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should load user data and organizations on init', () => {
      spyOn(component, 'loadUserData');
      spyOn(component, 'loadOrganizations');
      
      component.ngOnInit();
      
      expect(component.loadUserData).toHaveBeenCalled();
      expect(component.loadOrganizations).toHaveBeenCalled();
    });

    it('should load tasks when organization is selected', () => {
      spyOn(component, 'loadTasks');
      component.currentOrganization = mockOrganization;
      
      component.loadOrganizations();
      
      expect(component.loadTasks).toHaveBeenCalled();
    });
  });

  describe('Task Creation', () => {
    beforeEach(() => {
      component.currentOrganization = mockOrganization;
      component.createTaskForm = {
        title: 'New Task',
        description: 'New Description',
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
        assigneeId: 'user-1'
      };
    });

    it('should create a task successfully', () => {
      mockTaskService.createTask.and.returnValue(of(mockTask));
      spyOn(component, 'closeCreateModal');
      
      component.createTask();
      
      expect(mockTaskService.createTask).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'New Description',
        priority: TaskPriority.HIGH,
        status: TaskStatus.TODO,
        assigneeId: 'user-1',
        organizationId: 'org-1'
      });
      expect(component.closeCreateModal).toHaveBeenCalled();
    });

    it('should handle task creation error', () => {
      const error = new Error('Creation failed');
      mockTaskService.createTask.and.returnValue(throwError(() => error));
      spyOn(console, 'error');
      
      component.createTask();
      
      expect(console.error).toHaveBeenCalledWith('Error creating task:', error);
    });
  });

  describe('Task Updates', () => {
    beforeEach(() => {
      component.selectedTask = mockTask;
      component.editTaskForm = {
        title: 'Updated Task',
        description: 'Updated Description',
        priority: TaskPriority.LOW,
        status: TaskStatus.IN_PROGRESS,
        assigneeId: 'user-2'
      };
    });

    it('should update a task successfully', () => {
      const updatedTask = { ...mockTask, title: 'Updated Task' };
      mockTaskService.updateTask.and.returnValue(of(updatedTask));
      spyOn(component, 'closeEditModal');
      
      component.updateTask();
      
      expect(mockTaskService.updateTask).toHaveBeenCalledWith('1', {
        title: 'Updated Task',
        description: 'Updated Description',
        priority: TaskPriority.LOW,
        status: TaskStatus.IN_PROGRESS,
        assigneeId: 'user-2'
      });
      expect(component.closeEditModal).toHaveBeenCalled();
    });

    it('should handle task update error', () => {
      const error = new Error('Update failed');
      mockTaskService.updateTask.and.returnValue(throwError(() => error));
      spyOn(console, 'error');
      
      component.updateTask();
      
      expect(console.error).toHaveBeenCalledWith('Error updating task:', error);
    });
  });

  describe('Task Completion', () => {
    it('should mark task as complete', () => {
      component.selectedTask = mockTask;
      const completedTask = { ...mockTask, status: TaskStatus.COMPLETED, completedAt: new Date() };
      mockTaskService.updateTask.and.returnValue(of(completedTask));
      spyOn(component, 'applyFilters');
      
      component.markTaskAsComplete(mockTask);
      
      expect(mockTaskService.updateTask).toHaveBeenCalledWith('1', {
        status: TaskStatus.COMPLETED,
        completedAt: jasmine.any(Date)
      });
      expect(component.showCompleted).toBe(true);
      expect(component.applyFilters).toHaveBeenCalled();
    });
  });

  describe('Task Deletion', () => {
    it('should delete a task successfully', () => {
      component.selectedTask = mockTask;
      mockTaskService.deleteTask.and.returnValue(of({}));
      spyOn(component, 'closeDeleteModal');
      
      component.deleteTask();
      
      expect(mockTaskService.deleteTask).toHaveBeenCalledWith('1');
      expect(component.closeDeleteModal).toHaveBeenCalled();
    });

    it('should handle task deletion error', () => {
      const error = new Error('Deletion failed');
      mockTaskService.deleteTask.and.returnValue(throwError(() => error));
      spyOn(console, 'error');
      
      component.deleteTask();
      
      expect(console.error).toHaveBeenCalledWith('Error deleting task:', error);
    });
  });

  describe('Permission Checks', () => {
    it('should allow owners to edit tasks', () => {
      mockAuthService.hasRole.and.returnValue(true);
      
      const canEdit = component.canEditTask(mockTask);
      
      expect(canEdit).toBe(true);
    });

    it('should allow admins to edit tasks', () => {
      mockAuthService.hasRole.and.returnValue(true);
      
      const canEdit = component.canEditTask(mockTask);
      
      expect(canEdit).toBe(true);
    });

    it('should not allow members to edit tasks they are not assigned to', () => {
      mockAuthService.hasRole.and.returnValue(false);
      const unassignedTask = { ...mockTask, assigneeId: 'other-user' };
      
      const canEdit = component.canEditTask(unassignedTask);
      
      expect(canEdit).toBe(false);
    });

    it('should allow members to complete tasks assigned to them', () => {
      mockAuthService.hasRole.and.returnValue(false);
      const assignedTask = { ...mockTask, assigneeId: 'user-1' };
      
      const canComplete = component.canMarkAsComplete(assignedTask);
      
      expect(canComplete).toBe(true);
    });

    it('should not allow members to complete tasks not assigned to them', () => {
      mockAuthService.hasRole.and.returnValue(false);
      const unassignedTask = { ...mockTask, assigneeId: 'other-user' };
      
      const canComplete = component.canMarkAsComplete(unassignedTask);
      
      expect(canComplete).toBe(false);
    });
  });

  describe('Task Filtering', () => {
    beforeEach(() => {
      component.tasks = [mockTask, mockCompletedTask];
    });

    it('should filter out completed tasks by default', () => {
      component.showCompleted = false;
      
      component.applyFilters();
      
      expect(component.filteredTasks.length).toBe(1);
      expect(component.filteredTasks[0].id).toBe('1');
    });

    it('should show completed tasks when showCompleted is true', () => {
      component.showCompleted = true;
      
      component.applyFilters();
      
      expect(component.filteredTasks.length).toBe(2);
    });

    it('should filter by status', () => {
      component.selectedStatus = TaskStatus.TODO;
      
      component.applyFilters();
      
      expect(component.filteredTasks.length).toBe(1);
      expect(component.filteredTasks[0].status).toBe(TaskStatus.TODO);
    });

    it('should filter by priority', () => {
      component.selectedPriority = TaskPriority.MEDIUM;
      
      component.applyFilters();
      
      expect(component.filteredTasks.length).toBe(1);
      expect(component.filteredTasks[0].priority).toBe(TaskPriority.MEDIUM);
    });

    it('should filter by search term', () => {
      component.filter.search = 'Test';
      
      component.applyFilters();
      
      expect(component.filteredTasks.length).toBe(1);
      expect(component.filteredTasks[0].title).toContain('Test');
    });

    it('should clear all filters', () => {
      component.selectedStatus = TaskStatus.TODO;
      component.selectedPriority = TaskPriority.MEDIUM;
      component.filter.search = 'Test';
      
      component.clearFilters();
      
      expect(component.selectedStatus).toBe('');
      expect(component.selectedPriority).toBe('');
      expect(component.filter.search).toBe('');
    });
  });

  describe('Task Status Detection', () => {
    it('should detect completed tasks correctly', () => {
      expect(component.isTaskCompleted(mockTask)).toBe(false);
      expect(component.isTaskCompleted(mockCompletedTask)).toBe(true);
    });

    it('should handle old status values', () => {
      const oldCompletedTask = { ...mockTask, status: 'done' as any };
      const oldCompletedTask2 = { ...mockTask, status: 'completed' as any };
      
      expect(component.isTaskCompleted(oldCompletedTask)).toBe(true);
      expect(component.isTaskCompleted(oldCompletedTask2)).toBe(true);
    });
  });

  describe('Status Display', () => {
    it('should return correct display names for statuses', () => {
      expect(component.getStatusDisplayName(TaskStatus.TODO)).toBe('To Do');
      expect(component.getStatusDisplayName(TaskStatus.IN_PROGRESS)).toBe('In Progress');
      expect(component.getStatusDisplayName(TaskStatus.BLOCKED)).toBe('Blocked');
      expect(component.getStatusDisplayName(TaskStatus.COMPLETED)).toBe('Completed');
    });

    it('should handle old status values', () => {
      expect(component.getStatusDisplayName('done' as any)).toBe('Completed');
      expect(component.getStatusDisplayName('draft' as any)).toBe('To Do');
      expect(component.getStatusDisplayName('review' as any)).toBe('Blocked');
      expect(component.getStatusDisplayName('archived' as any)).toBe('Completed');
    });
  });

  describe('Assignee Management', () => {
    beforeEach(() => {
      component.allMembers = [
        { id: 'user-1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        { id: 'user-2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }
      ];
    });

    it('should get assignee name correctly', () => {
      expect(component.getAssigneeName('user-1')).toBe('John Doe');
      expect(component.getAssigneeName('user-2')).toBe('Jane Smith');
      expect(component.getAssigneeName('unknown')).toBe('Unknown User');
      expect(component.getAssigneeName(null)).toBe('Unassigned');
    });

    it('should return loading message when members not loaded', () => {
      component.allMembers = [];
      
      expect(component.getAssigneeName('user-1')).toBe('Loading...');
    });
  });

  describe('Modal Management', () => {
    it('should open create modal', () => {
      component.openCreateModal();
      
      expect(component.showCreateModal).toBe(true);
    });

    it('should close create modal and reset form', () => {
      component.showCreateModal = true;
      component.createTaskForm = { title: 'Test', description: 'Test' };
      
      component.closeCreateModal();
      
      expect(component.showCreateModal).toBe(false);
      expect(component.createTaskForm.title).toBe('');
      expect(component.createTaskForm.description).toBe('');
    });

    it('should open edit modal with task data', () => {
      component.onEditTask(mockTask);
      
      expect(component.showEditModal).toBe(true);
      expect(component.selectedTask).toBe(mockTask);
      expect(component.editTaskForm.title).toBe(mockTask.title);
    });

    it('should open delete modal', () => {
      component.onDeleteTask(mockTask);
      
      expect(component.showDeleteModal).toBe(true);
      expect(component.selectedTask).toBe(mockTask);
    });
  });

  describe('Component Cleanup', () => {
    it('should unsubscribe from subscriptions on destroy', () => {
      spyOn(component.subscriptions, 'unsubscribe');
      
      component.ngOnDestroy();
      
      expect(component.subscriptions.unsubscribe).toHaveBeenCalled();
    });
  });
});
