import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserDto, TaskDto } from '@challenge/data';
import { StringUtils, DateUtils } from '@challenge/utils';
import { environment } from '../../../environments/environment';
import { AngularAuthService, Permission, Role } from '@challenge/auth/frontend';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

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

  configLoaded = !!environment.supabase.url;
  sampleString = StringUtils.capitalize('hello world');
  formattedDate = DateUtils.formatDate(new Date(), 'long');
  currentUser: UserDto | null = null;
  isAuthenticated = false;
  private userSubscription: Subscription = new Subscription();

  // Mock data for the new dashboard
  quickStats = {
    totalTasks: 24,
    completedTasks: 18,
    inProgressTasks: 6,
    teamMembers: 5
  };

  recentTasks: TaskDto[] = [
    {
      id: '1',
      title: 'Design new landing page',
      description: 'Create a modern landing page design',
      status: 'in_progress' as any,
      priority: 'high' as any,
      organizationId: '1',
      creatorId: '1',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date()
    },
    {
      id: '2',
      title: 'Update user documentation',
      description: 'Revise the user guide with new features',
      status: 'todo' as any,
      priority: 'medium' as any,
      organizationId: '1',
      creatorId: '1',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: new Date()
    },
    {
      id: '3',
      title: 'Fix authentication bug',
      description: 'Resolve login issue on mobile devices',
      status: 'completed' as any,
      priority: 'high' as any,
      organizationId: '1',
      creatorId: '1',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date()
    }
  ];

  teamActivities = [
    {
      user: 'John Doe',
      description: 'Completed task "Fix authentication bug"',
      time: '2 hours ago'
    },
    {
      user: 'Sarah Wilson',
      description: 'Created new task "Design new landing page"',
      time: '4 hours ago'
    },
    {
      user: 'Mike Chen',
      description: 'Updated project documentation',
      time: '6 hours ago'
    },
    {
      user: 'Emily Davis',
      description: 'Joined the team',
      time: '1 day ago'
    }
  ];

  constructor(
    public authService: AngularAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isAuthenticated = this.authService.isAuthenticated();
    });

    // Also get current user immediately
    this.currentUser = this.authService.getCurrentUser();
    this.isAuthenticated = this.authService.isAuthenticated();
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
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

  onTaskAction() {
    console.log('Task action clicked!');
    // Example of using the shared DTOs
    const task: TaskDto = {
      id: '1',
      title: 'Sample Task',
      description: 'This is a sample task',
      status: 'todo' as any,
      priority: 'medium' as any,
      organizationId: '1',
      creatorId: '1',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log('Task:', task);
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  onAdminAction() {
    console.log('Admin action clicked!');
    this.router.navigate(['/admin']);
  }

  onCreateTask() {
    console.log('Create task clicked!');
    // Navigate to task creation or open modal
  }

  onTeamAction() {
    console.log('Team management clicked!');
    // Navigate to team management
  }

  openInviteModal() {
    console.log('Open invite modal clicked!');
    // Open invitation modal
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

  getActivityInitials(user: string): string {
    return user.split(' ').map(name => name[0]).join('').toUpperCase();
  }
}