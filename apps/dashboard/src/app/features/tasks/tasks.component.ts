import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { AngularAuthService, Permission, Role } from '@challenge/auth/frontend';
import { TaskDto, CreateTaskDto, UpdateTaskDto, TaskFilterDto, TaskStatus, TaskPriority } from '@challenge/data';
import { MembersService, Member } from '../../services/members.service';
import { WorkspaceService, WorkspaceDto } from '../../services/workspace.service';

interface Organization {
  id: string;
  name: string;
  role: string;
}

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit, OnDestroy {
  Permission = Permission;
  Role = Role;
  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;

  // Data
  tasks: TaskDto[] = [];
  filteredTasks: TaskDto[] = [];
  organizations: WorkspaceDto[] = [];
  currentOrganization: WorkspaceDto | null = null;
  currentUser: any = null;

  // UI State
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showOrganizationDropdown = false;
  isLoading = false;
  
  // Assignee search
  assigneeSearchQuery = '';
  showAssigneeDropdown = false;
  filteredAssignees: any[] = [];
  allMembers: any[] = [];
  selectedTask: TaskDto | null = null;

  // Filters
  filter: TaskFilterDto = {
    status: [],
    priority: [],
    search: ''
  };

  // Form data
  createTaskForm: CreateTaskDto = {
    title: '',
    description: '',
    priority: TaskPriority.MEDIUM,
    status: TaskStatus.TODO,
    assigneeId: undefined
  };

  editTaskForm: UpdateTaskDto = {
    title: '',
    description: '',
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM
  };

  // Subscriptions
  private subscriptions: Subscription = new Subscription();

  constructor(
    private taskService: TaskService,
    public authService: AngularAuthService,
    private router: Router,
    private membersService: MembersService,
    private workspaceService: WorkspaceService
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.loadOrganizations();
    this.loadTasks();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    // Restore body scroll when component is destroyed
    document.body.style.overflow = 'auto';
  }

  private loadUserData(): void {
    this.currentUser = this.authService.getCurrentUser();
  }

  private loadOrganizations(): void {
    const subscription = this.workspaceService.getUserWorkspaces().subscribe({
      next: (workspaces: WorkspaceDto[]) => {
        this.organizations = workspaces;
        // Set current organization to the one marked as current
        this.currentOrganization = workspaces.find(w => w.isCurrent) || workspaces[0] || null;
        
        if (this.currentOrganization) {
          // Load tasks for the current organization
          this.loadTasks();
        }
      },
      error: (error) => {
        console.error('Error loading organizations:', error);
      }
    });
    this.subscriptions.add(subscription);
  }

  private loadTasks(): void {
    if (!this.currentOrganization) return;

    this.isLoading = true;
    const subscription = this.taskService.getTasks(this.filter).subscribe({
      next: (tasks: TaskDto[]) => {
        this.tasks = tasks;
        this.applyFilters();
        this.taskService.updateTasksList(tasks);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading tasks:', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.add(subscription);
  }

  private applyFilters(): void {
    let filtered = [...this.tasks];

    // Apply status filter
    if (this.filter.status && this.filter.status.length > 0) {
      filtered = filtered.filter(task => this.filter.status!.includes(task.status));
    }

    // Apply priority filter
    if (this.filter.priority && this.filter.priority.length > 0) {
      filtered = filtered.filter(task => this.filter.priority!.includes(task.priority));
    }

    // Apply search filter
    if (this.filter.search) {
      const searchTerm = this.filter.search.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description && task.description.toLowerCase().includes(searchTerm))
      );
    }

    this.filteredTasks = filtered;
  }

  // Organization switching
  switchOrganization(org: WorkspaceDto): void {
    this.showOrganizationDropdown = false;
    
    // If already the current organization, do nothing
    if (this.currentOrganization?.id === org.id) {
      return;
    }
    
    // Switch workspace via API
    const subscription = this.workspaceService.switchWorkspace(org.id).subscribe({
      next: () => {
        this.currentOrganization = org;
        this.loadTasks();
        this.loadMembers();
      },
      error: (error) => {
        console.error('Error switching workspace:', error);
      }
    });
    this.subscriptions.add(subscription);
  }

  // Task CRUD operations
  onCreateTask(): void {
    console.log('Opening create task modal...');
    this.createTaskForm = {
      title: '',
      description: '',
      priority: TaskPriority.MEDIUM,
      status: TaskStatus.TODO,
      assigneeId: undefined
    };
    this.assigneeSearchQuery = '';
    this.showAssigneeDropdown = false;
    this.loadMembers();
    this.showCreateModal = true;
    // Prevent body scroll when modal is open
    if (this.showCreateModal) {
      document.body.style.overflow = 'hidden';
    }
    console.log('showCreateModal set to:', this.showCreateModal);
  }

  onEditTask(task: TaskDto): void {
    if (!this.authService.hasPermission(Permission.TASK_UPDATE)) {
      return;
    }

    this.selectedTask = task;
    this.editTaskForm = {
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority
    };
    this.showEditModal = true;
  }

  onDeleteTask(task: TaskDto): void {
    if (!this.authService.hasPermission(Permission.TASK_DELETE)) {
      return;
    }

    this.selectedTask = task;
    this.showDeleteModal = true;
  }

  // Modal actions
  createTask(): void {
    if (!this.createTaskForm.title.trim()) return;

    this.isLoading = true;
    const subscription = this.taskService.createTask(this.createTaskForm).subscribe({
      next: (newTask: TaskDto) => {
        this.tasks.unshift(newTask);
        this.applyFilters();
        this.taskService.updateTasksList(this.tasks);
        this.showCreateModal = false;
        this.isLoading = false;
        // Restore body scroll when modal is closed after successful creation
        document.body.style.overflow = 'auto';
      },
      error: (error: any) => {
        console.error('Error creating task:', error);
        this.isLoading = false;
        // Restore body scroll even if there's an error
        document.body.style.overflow = 'auto';
      }
    });
    this.subscriptions.add(subscription);
  }

  updateTask(): void {
    if (!this.selectedTask || !this.editTaskForm.title?.trim()) return;

    this.isLoading = true;
    const subscription = this.taskService.updateTask(this.selectedTask.id, this.editTaskForm).subscribe({
      next: (updatedTask: TaskDto) => {
        const index = this.tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
          this.applyFilters();
          this.taskService.updateTasksList(this.tasks);
        }
        this.showEditModal = false;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error updating task:', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.add(subscription);
  }

  deleteTask(): void {
    if (!this.selectedTask) return;

    this.isLoading = true;
    const subscription = this.taskService.deleteTask(this.selectedTask.id).subscribe({
      next: () => {
        this.tasks = this.tasks.filter(t => t.id !== this.selectedTask!.id);
        this.applyFilters();
        this.taskService.updateTasksList(this.tasks);
        this.showDeleteModal = false;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error deleting task:', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.add(subscription);
  }

  // Filter methods
  onFilterChange(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.filter = {
      status: [],
      priority: [],
      search: ''
    };
    this.applyFilters();
  }

  // Helper methods
  getStatusClass(status: TaskStatus): string {
    const statusClasses = {
      [TaskStatus.DRAFT]: 'bg-gray-100 text-gray-800',
      [TaskStatus.TODO]: 'bg-blue-100 text-blue-800',
      [TaskStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
      [TaskStatus.REVIEW]: 'bg-purple-100 text-purple-800',
      [TaskStatus.DONE]: 'bg-green-100 text-green-800',
      [TaskStatus.ARCHIVED]: 'bg-gray-100 text-gray-600'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getPriorityClass(priority: TaskPriority): string {
    const priorityClasses = {
      [TaskPriority.CRITICAL]: 'bg-red-100 text-red-800',
      [TaskPriority.HIGH]: 'bg-orange-100 text-orange-800',
      [TaskPriority.MEDIUM]: 'bg-yellow-100 text-yellow-800',
      [TaskPriority.LOW]: 'bg-green-100 text-green-800'
    };
    return priorityClasses[priority] || 'bg-gray-100 text-gray-800';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  // Modal close methods
  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedTask = null;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedTask = null;
  }

  // Helper methods for stats
  getTasksByStatus(status: TaskStatus): TaskDto[] {
    return this.tasks.filter(task => task.status === status);
  }

  // Task interaction methods
  onTaskClick(task: TaskDto): void {
    // For now, just open the edit modal
    this.onEditTask(task);
  }

  // Permission checking methods
  canEditTask(task: TaskDto): boolean {
    // Owners and admins can edit any task
    if (this.authService.hasRole(Role.OWNER) || this.authService.hasRole(Role.ADMIN)) {
      return true;
    }
    
    // Members can edit tasks they created
    if (this.authService.hasRole(Role.MEMBER) && task.creatorId === this.currentUser?.id) {
      return true;
    }
    
    return false;
  }

  canDeleteTask(task: TaskDto): boolean {
    // Only owners and admins can delete tasks
    return this.authService.hasRole(Role.OWNER) || this.authService.hasRole(Role.ADMIN);
  }

  canMarkAsComplete(task: TaskDto): boolean {
    // Users can mark tasks as complete if:
    // 1. The task is assigned to them
    // 2. The task is not already completed
    // 3. They have at least member role
    return (
      this.authService.hasRole(Role.MEMBER) || 
      this.authService.hasRole(Role.ADMIN) || 
      this.authService.hasRole(Role.OWNER)
    ) && 
    task.assigneeId === this.currentUser?.id && 
    task.status !== TaskStatus.DONE;
  }

  // Mark task as complete
  markTaskAsComplete(task: TaskDto): void {
    if (!this.canMarkAsComplete(task)) {
      return;
    }

    const updateData: UpdateTaskDto = {
      status: TaskStatus.DONE,
      completedAt: new Date()
    };

    this.isLoading = true;
    const subscription = this.taskService.updateTask(task.id, updateData).subscribe({
      next: (updatedTask: TaskDto) => {
        // Update the task in the local array
        const index = this.tasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
          this.applyFilters();
          this.taskService.updateTasksList(this.tasks);
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error marking task as complete:', error);
        this.isLoading = false;
      }
    });
    this.subscriptions.add(subscription);
  }

  // Assignee search methods
  loadMembers(): void {
    if (!this.currentOrganization?.id) return;
    
    this.membersService.getOrganizationMembers().subscribe({
      next: (members: Member[]) => {
        this.allMembers = members;
        this.filteredAssignees = [...members];
      },
      error: (error) => {
        console.error('Error loading members:', error);
        // Fallback to empty array if API fails
        this.allMembers = [];
        this.filteredAssignees = [];
      }
    });
  }

  searchAssignees(): void {
    if (!this.assigneeSearchQuery.trim()) {
      this.filteredAssignees = [...this.allMembers];
      return;
    }

    const query = this.assigneeSearchQuery.toLowerCase();
    this.filteredAssignees = this.allMembers.filter(member => 
      member.firstName.toLowerCase().includes(query) ||
      member.lastName.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  }

  selectAssignee(member: any): void {
    this.createTaskForm.assigneeId = member.id;
    this.assigneeSearchQuery = `${member.firstName} ${member.lastName}`;
    this.showAssigneeDropdown = false;
  }

  clearAssignee(): void {
    this.createTaskForm.assigneeId = undefined;
    this.assigneeSearchQuery = '';
    this.showAssigneeDropdown = false;
  }

  getSelectedAssignee(): any {
    if (!this.createTaskForm.assigneeId) return null;
    return this.allMembers.find(member => member.id === this.createTaskForm.assigneeId);
  }

  closeCreateModal(): void {
    this.showCreateModal = false;
    this.assigneeSearchQuery = '';
    this.showAssigneeDropdown = false;
    this.createTaskForm.assigneeId = undefined;
    // Restore body scroll when modal is closed
    document.body.style.overflow = 'auto';
  }
}