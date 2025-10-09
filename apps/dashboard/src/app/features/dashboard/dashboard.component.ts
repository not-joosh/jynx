import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserDto, TaskDto, TaskStatus, TaskPriority } from '@challenge/data';
import { StringUtils, DateUtils } from '@challenge/utils';
import { environment } from '../../../environments/environment';
import { AngularAuthService, Permission, Role } from '@challenge/auth/frontend';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { TaskService } from '../../services/task.service';
import { MembersService } from '../../services/members.service';
import { WorkspaceService } from '../../services/workspace.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // RBAC enums for template usage
  Permission = Permission;
  Role = Role;
  TaskStatus = TaskStatus;
  TaskPriority = TaskPriority;

  configLoaded = !!environment.supabase.url;
  sampleString = StringUtils.capitalize('hello world');
  formattedDate = DateUtils.formatDate(new Date(), 'long');
  currentUser: UserDto | null = null;
  isAuthenticated = false;
  private userSubscription: Subscription = new Subscription();

  // Real data for the dashboard
  quickStats = {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    teamMembers: 0
  };

  recentTasks: TaskDto[] = [];
  loading = true;

  constructor(
    public authService: AngularAuthService,
    private router: Router,
    private taskService: TaskService,
    private membersService: MembersService,
    private workspaceService: WorkspaceService
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = this.authService.isAuthenticated();
      
      if (this.isAuthenticated) {
        this.loadDashboardData();
      }
    });

    // Also get current user immediately
    this.currentUser = this.authService.getCurrentUser();
    this.isAuthenticated = this.authService.isAuthenticated();
    
    if (this.isAuthenticated) {
      this.loadDashboardData();
    }
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
  }

  loadDashboardData(): void {
    this.loading = true;
    
    // Load organizations first
    this.workspaceService.getUserWorkspaces().subscribe({
      next: (workspaces) => {
        if (workspaces.length > 0) {
          const currentOrg = workspaces[0]; // Use first organization
          this.loadTasksAndMembers(currentOrg.id);
        } else {
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error loading workspaces:', error);
        this.loading = false;
      }
    });
  }

  loadTasksAndMembers(organizationId: string): void {
    // Load tasks
    this.taskService.getTasks().subscribe({
      next: (tasks) => {
        this.recentTasks = tasks.slice(0, 5); // Get 5 most recent tasks
        this.updateQuickStats(tasks);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tasks:', error);
        this.loading = false;
      }
    });

    // Load members
    this.membersService.getOrganizationMembers().subscribe({
      next: (members) => {
        this.quickStats.teamMembers = members.length;
      },
      error: (error) => {
        console.error('Error loading members:', error);
      }
    });
  }

  updateQuickStats(tasks: TaskDto[]): void {
    this.quickStats.totalTasks = tasks.length;
    this.quickStats.completedTasks = tasks.filter(task => task.status === TaskStatus.COMPLETED).length;
    this.quickStats.inProgressTasks = tasks.filter(task => task.status === TaskStatus.IN_PROGRESS).length;
  }

  onUserAction() {
    console.log('User action clicked!');
    // Example of using the shared DTOs
    const user: UserDto = {
      id: '1',
      email: 'user@example.com',
      firstName: 'John',
      lastName: 'Doe',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log('User:', user);
  }

  onCreateTask() {
    console.log('Create task clicked!');
    this.router.navigate(['/tasks']);
  }

  onTeamAction() {
    console.log('Team management clicked!');
    this.router.navigate(['/members']);
  }

  openInviteModal() {
    console.log('Open invite modal clicked!');
    this.router.navigate(['/members']);
  }

  formatDate(date: Date): string {
    return DateUtils.formatDate(date, 'short');
  }

  getPriorityClass(priority: string): string {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'todo': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}