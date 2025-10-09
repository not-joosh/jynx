import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AngularAuthService, Permission, Role } from '@challenge/auth/frontend';
import { UserDto, NotificationDto } from '@challenge/data';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../services/notification.service';
import { NotificationsApiService } from '../../services/notifications-api.service';
import { InvitationService } from '../../services/invitation.service';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent implements OnInit, OnDestroy {
  Permission = Permission;
  Role = Role;

  sidebarCollapsed = false;
  isMobile = false;
  notificationsOpen = false;
  unreadNotificationCount = 0; // Real count from API
  notifications: NotificationDto[] = []; // Notifications for dropdown
  currentUser: UserDto | null = null;
  private userSubscription: Subscription = new Subscription();
  private notificationSubscription: Subscription = new Subscription();

  constructor(
    public authService: AngularAuthService,
    private router: Router,
    private notificationService: NotificationService,
    private notificationsApiService: NotificationsApiService,
    private invitationService: InvitationService
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    // Get current user immediately
    this.currentUser = this.authService.getCurrentUser();

    // Check if mobile
    this.checkMobile();
    window.addEventListener('resize', () => this.checkMobile());

    // Load unread notification count
    this.loadUnreadNotificationCount();
    
    // Load recent notifications for dropdown
    this.loadRecentNotifications();
  }

  ngOnDestroy(): void {
    this.userSubscription.unsubscribe();
    this.notificationSubscription.unsubscribe();
    window.removeEventListener('resize', () => this.checkMobile());
  }

  toggleSidebar(): void {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  closeSidebar(): void {
    if (this.isMobile) {
      this.sidebarCollapsed = true;
    }
  }

  toggleNotifications(): void {
    this.notificationsOpen = !this.notificationsOpen;
  }

  closeNotifications(): void {
    this.notificationsOpen = false;
  }

  openInviteModal(): void {
    console.log('Open invite modal');
    // TODO: Implement invite modal
  }

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    return (this.currentUser.firstName?.[0] || '') + (this.currentUser.lastName?.[0] || '');
  }

  getCurrentPageTitle(): string {
    const url = this.router.url;
    if (url.includes('/tasks')) return 'Tasks';
    if (url.includes('/members')) return 'Members';
    if (url.includes('/notifications')) return 'Notifications';
    if (url.includes('/settings')) return 'Settings';
    if (url.includes('/analytics')) return 'Analytics';
    return 'Dashboard';
  }

  private loadUnreadNotificationCount(): void {
    this.notificationSubscription = this.notificationsApiService.getUnreadCount().subscribe({
      next: (response) => {
        this.unreadNotificationCount = response.count;
      },
      error: (error) => {
        console.error('Error loading unread notification count:', error);
        this.unreadNotificationCount = 0;
      }
    });
  }

  private checkMobile(): void {
    this.isMobile = window.innerWidth <= 768;
    if (this.isMobile) {
      this.sidebarCollapsed = true;
    }
  }

  // Notification dropdown methods
  private loadRecentNotifications(): void {
    this.notificationsApiService.getNotifications(1, 10, false).subscribe({
      next: (response) => {
        this.notifications = response.notifications;
      },
      error: (error) => {
        console.error('Error loading recent notifications:', error);
        this.notifications = [];
      }
    });
  }

  markAsRead(notification: NotificationDto): void {
    this.notificationsApiService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
        this.unreadNotificationCount = Math.max(0, this.unreadNotificationCount - 1);
      },
      error: (error) => {
        console.error('Error marking notification as read:', error);
      }
    });
  }

  markAllAsRead(): void {
    this.notificationsApiService.markAllAsRead().subscribe({
      next: (response) => {
        this.notifications.forEach(notification => {
          notification.read = true;
        });
        this.unreadNotificationCount = 0;
      },
      error: (error) => {
        console.error('Error marking all notifications as read:', error);
      }
    });
  }

  clearAllNotifications(): void {
    if (!confirm('Are you sure you want to delete all notifications?')) {
      return;
    }
    
    this.notificationsApiService.deleteAllNotifications().subscribe({
      next: () => {
        this.notifications = [];
        this.unreadNotificationCount = 0;
      },
      error: (error) => {
        console.error('Error clearing all notifications:', error);
      }
    });
  }

  removeNotification(notification: NotificationDto): void {
    this.notificationsApiService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        if (!notification.read) {
          this.unreadNotificationCount = Math.max(0, this.unreadNotificationCount - 1);
        }
      },
      error: (error) => {
        console.error('Error deleting notification:', error);
      }
    });
  }

  acceptInvitation(notification: NotificationDto): void {
    if (!notification.data?.organizationId || !notification.data?.invitationId) {
      console.error('Missing organization ID or invitation ID in notification');
      return;
    }

    this.invitationService.acceptInvitationById(
      notification.data.organizationId,
      notification.data.invitationId
    ).subscribe({
      next: (response: any) => {
        this.markAsRead(notification);
        alert(`Invitation accepted! Welcome to ${response.organization.name}.`);
        this.removeNotification(notification);
      },
      error: (error: any) => {
        console.error('Error accepting invitation:', error);
        alert('Failed to accept invitation. Please try again.');
      }
    });
  }

  declineInvitation(notification: NotificationDto): void {
    if (!confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    if (!notification.data?.organizationId || !notification.data?.invitationId) {
      console.error('Missing organization ID or invitation ID in notification');
      return;
    }

    this.invitationService.declineInvitationById(
      notification.data.organizationId,
      notification.data.invitationId
    ).subscribe({
      next: () => {
        this.markAsRead(notification);
        alert('Invitation declined.');
        this.removeNotification(notification);
      },
      error: (error: any) => {
        console.error('Error declining invitation:', error);
        alert('Failed to decline invitation. Please try again.');
      }
    });
  }

  goToNotificationsPage(): void {
    this.closeNotifications();
    this.router.navigate(['/notifications']);
  }

  getNotificationIconClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-600';
      case 'error': return 'bg-red-100 text-red-600';
      case 'warning': return 'bg-yellow-100 text-yellow-600';
      case 'info':
      case 'invitation': return 'bg-blue-100 text-blue-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  trackByNotificationId(index: number, notification: NotificationDto): string {
    return notification.id;
  }
}