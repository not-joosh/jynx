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
import { NotificationService } from '../../services/notification.service';

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
  
  // Edit assignee search
  editAssigneeSearchQuery = '';
  showEditAssigneeDropdown = false;
  filteredEditAssignees: any[] = [];

  // Filters
  filter: TaskFilterDto = {
    status: [],
    priority: [],
    search: ''
  };
  showCompleted: boolean = false;
  
  // Single value filters for dropdowns
  selectedStatus: string = '';
  selectedPriority: string = '';

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
    private workspaceService: WorkspaceService,
    private notificationService: NotificationService
  ) {}

  // Debug method to force show completed tasks
  forceShowCompleted(): void {
    console.log('=== FORCE SHOWING COMPLETED TASKS ===');
    this.showCompleted = true;
    this.applyFilters();
    console.log('showCompleted set to true, applied filters');
  }

  // Debug method to refresh tasks and show completed
  debugRefreshTasks(): void {
    console.log('=== DEBUG REFRESH TASKS ===');
    this.loadTasks();
    this.showCompleted = true;
    console.log('Refreshed tasks and set showCompleted to true');
  }

  // Make this method available globally for debugging
  ngOnInit(): void {
    this.loadUserData();
    this.loadOrganizations();
    
    // Make debug methods available globally
    (window as any).forceShowCompleted = () => this.forceShowCompleted();
    (window as any).debugRefreshTasks = () => this.debugRefreshTasks();
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
          // Update user's role to match current organization
          const currentUser = this.authService.getCurrentUser();
          if (currentUser) {
            const updatedUser = {
              ...currentUser,
              role: this.currentOrganization.role,
              organizationId: this.currentOrganization.id
            };
            this.authService.updateCurrentUser(updatedUser);
          }
          
          // Load members and tasks for the current organization
          this.loadMembers();
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

    console.log('=== LOADING TASKS ===');
    console.log('Current organization:', this.currentOrganization);
    console.log('Filter:', this.filter);

    this.isLoading = true;
    const subscription = this.taskService.getTasks(this.filter).subscribe({
      next: (tasks: TaskDto[]) => {
        console.log('Loaded tasks from API:', tasks.length);
        console.log('Task details:', tasks.map(t => `${t.title} (${t.status}) - Completed: ${t.completedAt}`));
        console.log('Task statuses:', tasks.map(t => ({ title: t.title, status: t.status, statusType: typeof t.status })));
        
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

    console.log('=== APPLYING FILTERS ===');
    console.log('Total tasks:', this.tasks.length);
    console.log('showCompleted:', this.showCompleted);
    console.log('selectedStatus:', this.selectedStatus);
    console.log('selectedPriority:', this.selectedPriority);
    console.log('All tasks:', this.tasks.map(t => `${t.title} (${t.status})`));

    // Hide completed tasks by default unless showCompleted is true
    if (!this.showCompleted) {
      console.log('Hiding completed tasks...');
      filtered = filtered.filter(task => {
        const statusStr = String(task.status);
        const isCompleted = task.status === TaskStatus.COMPLETED || statusStr === 'done' || statusStr === 'completed';
        console.log(`Task "${task.title}" (${task.status}) - isCompleted: ${isCompleted}`);
        return !isCompleted;
      });
      console.log('After hiding completed:', filtered.length);
    } else {
      console.log('Showing all tasks including completed');
    }

    // Apply status filter (single value from dropdown)
    if (this.selectedStatus) {
      console.log('Applying status filter:', this.selectedStatus);
      filtered = filtered.filter(task => task.status === this.selectedStatus);
      console.log('After status filter:', filtered.length);
    }

    // Apply priority filter (single value from dropdown)
    if (this.selectedPriority) {
      console.log('Applying priority filter:', this.selectedPriority);
      filtered = filtered.filter(task => task.priority === this.selectedPriority);
      console.log('After priority filter:', filtered.length);
    }

    // Apply search filter
    if (this.filter.search) {
      const searchTerm = this.filter.search.toLowerCase();
      console.log('Applying search filter:', searchTerm);
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm) ||
        (task.description && task.description.toLowerCase().includes(searchTerm))
      );
      console.log('After search filter:', filtered.length);
    }

    console.log('Final filtered tasks:', filtered.length);
    console.log('Filtered task titles:', filtered.map(t => `${t.title} (${t.status})`));
    console.log('=== END FILTERING ===');

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
    // Check if user has permission to edit this specific task
    if (!this.canEditTask(task)) {
      console.warn('User does not have permission to edit this task');
      return;
    }

    this.selectedTask = task;
    this.editTaskForm = {
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId
    };
    
    // Initialize edit assignee search
    if (task.assigneeId) {
      const assignee = this.allMembers.find(member => member.id === task.assigneeId);
      if (assignee) {
        this.editAssigneeSearchQuery = `${assignee.firstName} ${assignee.lastName}`;
      }
    } else {
      this.editAssigneeSearchQuery = '';
    }
    
    // Initialize filtered assignees
    this.filteredEditAssignees = [...this.allMembers];
    
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
    
    // Check if user has permission to edit this task
    if (!this.canEditTask(this.selectedTask)) {
      console.warn('User does not have permission to edit this task');
      this.showEditModal = false;
      return;
    }

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
    this.showCompleted = false;
    this.selectedStatus = '';
    this.selectedPriority = '';
    this.applyFilters();
  }

  // Helper methods
  getStatusClass(status: TaskStatus): string {
    const statusClasses = {
      [TaskStatus.TODO]: 'bg-blue-100 text-blue-800',
      [TaskStatus.IN_PROGRESS]: 'bg-yellow-100 text-yellow-800',
      [TaskStatus.BLOCKED]: 'bg-red-100 text-red-800',
      [TaskStatus.COMPLETED]: 'bg-green-100 text-green-800',
      // Handle old status values
      'done': 'bg-green-100 text-green-800',
      'draft': 'bg-blue-100 text-blue-800',
      'review': 'bg-red-100 text-red-800',
      'archived': 'bg-green-100 text-green-800'
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

  getAssigneeName(assigneeId: string): string {
    if (!assigneeId) return 'Unassigned';
    
    const assignee = this.allMembers.find(member => member.id === assigneeId);
    if (assignee) {
      return `${assignee.firstName} ${assignee.lastName}`;
    }
    
    // If member not found in allMembers, try to find in tasks data
    // This handles cases where members are loaded after tasks
    return 'Loading...';
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString();
  }

  getStatusDisplayName(status: string): string {
    const statusMap: { [key: string]: string } = {
      'todo': 'To Do',
      'in_progress': 'In Progress',
      'blocked': 'Blocked',
      'completed': 'Completed',
      // Handle old status values
      'done': 'Completed',
      'draft': 'To Do',
      'review': 'Blocked',
      'archived': 'Completed'
    };
    return statusMap[status] || status;
  }

  // Debug method to check task status
  isTaskCompleted(task: TaskDto): boolean {
    console.log('Task status check:', {
      taskId: task.id,
      status: task.status,
      isCompleted: task.status === TaskStatus.COMPLETED,
      TaskStatusCompleted: TaskStatus.COMPLETED,
      statusType: typeof task.status,
      enumType: typeof TaskStatus.COMPLETED
    });
    
    // Handle both old and new status values
    const statusStr = String(task.status);
    const isCompleted = task.status === TaskStatus.COMPLETED || statusStr === 'done' || statusStr === 'completed';
    console.log('Final isCompleted result:', isCompleted);
    
    return isCompleted;
  }

  // Modal close methods
  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedTask = null;
    this.editAssigneeSearchQuery = '';
    this.showEditAssigneeDropdown = false;
    this.editTaskForm.assigneeId = undefined;
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
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    // Only owners and admins can edit tasks
    // Members can only complete tasks (use canMarkAsComplete instead)
    return this.authService.hasRole(Role.OWNER) || this.authService.hasRole(Role.ADMIN);
  }

  canDeleteTask(task: TaskDto): boolean {
    // Only owners and admins can delete tasks
    return this.authService.hasRole(Role.OWNER) || this.authService.hasRole(Role.ADMIN);
  }

  canReassignTask(): boolean {
    // Only owners and admins can reassign tasks
    return this.authService.hasRole(Role.OWNER) || this.authService.hasRole(Role.ADMIN);
  }

  canCreateTask(): boolean {
    // Only owners and admins can create tasks
    return this.authService.hasRole(Role.OWNER) || this.authService.hasRole(Role.ADMIN);
  }

  canMarkAsComplete(task: TaskDto): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    // Only members can use the "Complete" button
    // Admins/owners should use the "Update" button instead
    return (
      this.authService.hasRole(Role.MEMBER) && 
      task.assigneeId === currentUser.id && 
      task.status !== TaskStatus.COMPLETED
    );
  }

  // Mark task as complete
  markTaskAsComplete(task: TaskDto): void {
    if (!this.canMarkAsComplete(task)) {
      return;
    }

    const updateData: UpdateTaskDto = {
      status: TaskStatus.COMPLETED,
      completedAt: new Date()
    };

    console.log('Marking task as complete:', {
      taskId: task.id,
      taskTitle: task.title,
      updateData: updateData
    });

    this.isLoading = true;
    const subscription = this.taskService.updateTask(task.id, updateData).subscribe({
      next: (updatedTask: TaskDto) => {
        console.log('Task completed successfully:', {
          originalTask: task,
          updatedTask: updatedTask
        });
        
        // Update the task in the local array
        const index = this.tasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
          console.log('Updated task in local array:', this.tasks[index]);
          this.applyFilters();
          this.taskService.updateTasksList(this.tasks);
        }
        
        // Show success notification
        this.notificationService.success(
          'Task Completed!',
          `"${task.title}" has been marked as completed`,
          { label: 'View Completed', callback: () => { this.showCompleted = true; this.applyFilters(); } }
        );
        
        // Automatically show completed tasks after completion
        this.showCompleted = true;
        this.applyFilters();
        
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

  // Edit assignee methods
  searchEditAssignees(): void {
    if (!this.editAssigneeSearchQuery.trim()) {
      this.filteredEditAssignees = [...this.allMembers];
      return;
    }

    const query = this.editAssigneeSearchQuery.toLowerCase();
    this.filteredEditAssignees = this.allMembers.filter(member => 
      member.firstName.toLowerCase().includes(query) ||
      member.lastName.toLowerCase().includes(query) ||
      member.email.toLowerCase().includes(query)
    );
  }

  filterEditAssignees(): void {
    this.searchEditAssignees();
  }

  selectEditAssignee(member: any): void {
    this.editTaskForm.assigneeId = member.id;
    this.editAssigneeSearchQuery = `${member.firstName} ${member.lastName}`;
    this.showEditAssigneeDropdown = false;
  }

  clearEditAssignee(): void {
    this.editTaskForm.assigneeId = undefined;
    this.editAssigneeSearchQuery = '';
    this.showEditAssigneeDropdown = false;
  }

  getEditSelectedAssignee(): any {
    if (!this.editTaskForm.assigneeId) return null;
    return this.allMembers.find(member => member.id === this.editTaskForm.assigneeId);
  }

  hideEditAssigneeDropdown(): void {
    setTimeout(() => {
      this.showEditAssigneeDropdown = false;
    }, 200);
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