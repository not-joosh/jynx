import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NotificationsApiService } from '../../services/notifications-api.service';
import { InvitationService } from '../../services/invitation.service';
import { NotificationDto } from '@challenge/data';

@Component({
  selector: 'app-notifications-inbox',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './notifications-inbox.component.html'
})
export class NotificationsInboxComponent implements OnInit, OnDestroy {
  notifications: NotificationDto[] = [];
  unreadCount = 0;
  totalCount = 0;
  isLoading = false;
  filterUnreadOnly = false;
  currentPage = 1;
  hasMore = true;
  
  private subscriptions: Subscription = new Subscription();

  constructor(
    private notificationsApiService: NotificationsApiService,
    private invitationService: InvitationService
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.loadUnreadCount();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadNotifications(): void {
    this.isLoading = true;
    
    const subscription = this.notificationsApiService.getNotifications(
      this.currentPage,
      20,
      this.filterUnreadOnly
    ).subscribe({
      next: (response: any) => {
        if (this.currentPage === 1) {
          this.notifications = response.notifications;
        } else {
          this.notifications = [...this.notifications, ...response.notifications];
        }
        
        this.totalCount = response.totalCount;
        this.unreadCount = response.unreadCount;
        this.hasMore = response.notifications.length === 20;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading notifications:', error);
        this.isLoading = false;
      }
    });
    
    this.subscriptions.add(subscription);
  }

  loadUnreadCount(): void {
    const subscription = this.notificationsApiService.getUnreadCount().subscribe({
      next: (response: any) => {
        this.unreadCount = response.count;
      },
      error: (error: any) => {
        console.error('Error loading unread count:', error);
      }
    });
    
    this.subscriptions.add(subscription);
  }

  toggleFilter(): void {
    this.filterUnreadOnly = !this.filterUnreadOnly;
    this.currentPage = 1;
    this.loadNotifications();
  }

  loadMore(): void {
    this.currentPage++;
    this.loadNotifications();
  }

  markAsRead(notification: NotificationDto): void {
    const subscription = this.notificationsApiService.markAsRead(notification.id).subscribe({
      next: () => {
        notification.read = true;
        this.unreadCount = Math.max(0, this.unreadCount - 1);
      },
      error: (error: any) => {
        console.error('Error marking notification as read:', error);
      }
    });
    
    this.subscriptions.add(subscription);
  }

  markAllAsRead(): void {
    this.isLoading = true;
    
    const subscription = this.notificationsApiService.markAllAsRead().subscribe({
      next: (response: any) => {
        // Mark all notifications as read in the UI
        this.notifications.forEach(notification => {
          notification.read = true;
        });
        
        this.unreadCount = 0;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error marking all notifications as read:', error);
        this.isLoading = false;
      }
    });
    
    this.subscriptions.add(subscription);
  }

  deleteNotification(notification: NotificationDto): void {
    const subscription = this.notificationsApiService.deleteNotification(notification.id).subscribe({
      next: () => {
        this.notifications = this.notifications.filter(n => n.id !== notification.id);
        this.totalCount--;
        
        if (!notification.read) {
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        }
      },
      error: (error: any) => {
        console.error('Error deleting notification:', error);
      }
    });
    
    this.subscriptions.add(subscription);
  }

  clearAll(): void {
    if (!confirm('Are you sure you want to delete all notifications? This action cannot be undone.')) {
      return;
    }
    
    this.isLoading = true;
    
    const subscription = this.notificationsApiService.deleteAllNotifications().subscribe({
      next: () => {
        this.notifications = [];
        this.totalCount = 0;
        this.unreadCount = 0;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error clearing all notifications:', error);
        this.isLoading = false;
      }
    });
    
    this.subscriptions.add(subscription);
  }

  acceptInvitation(notification: NotificationDto): void {
    if (!notification.data?.organizationId || !notification.data?.invitationId) {
      console.error('Missing organization ID or invitation ID in notification');
      return;
    }

    const subscription = this.invitationService.acceptInvitationById(
      notification.data.organizationId,
      notification.data.invitationId
    ).subscribe({
      next: (response: any) => {
        // Mark notification as read
        this.markAsRead(notification);
        
        // Show success message
        alert(`Invitation accepted! Welcome to ${response.organization.name}.`);
        
        // Remove the notification from the list
        this.deleteNotification(notification);
      },
      error: (error: any) => {
        console.error('Error accepting invitation:', error);
        alert('Failed to accept invitation. Please try again.');
      }
    });
    
    this.subscriptions.add(subscription);
  }

  declineInvitation(notification: NotificationDto): void {
    if (!confirm('Are you sure you want to decline this invitation?')) {
      return;
    }

    if (!notification.data?.organizationId || !notification.data?.invitationId) {
      console.error('Missing organization ID or invitation ID in notification');
      return;
    }

    const subscription = this.invitationService.declineInvitationById(
      notification.data.organizationId,
      notification.data.invitationId
    ).subscribe({
      next: () => {
        // Mark notification as read
        this.markAsRead(notification);
        
        // Show success message
        alert('Invitation declined.');
        
        // Remove the notification from the list
        this.deleteNotification(notification);
      },
      error: (error: any) => {
        console.error('Error declining invitation:', error);
        alert('Failed to decline invitation. Please try again.');
      }
    });
    
    this.subscriptions.add(subscription);
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'success': return 'bg-green-100 text-green-600';
      case 'error': return 'bg-red-100 text-red-600';
      case 'warning': return 'bg-yellow-100 text-yellow-600';
      case 'info': return 'bg-blue-100 text-blue-600';
      case 'invitation': return 'bg-purple-100 text-purple-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  }

  getIconPath(type: string): string {
    switch (type) {
      case 'success': return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'error': return 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'warning': return 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z';
      case 'info': return 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'invitation': return 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z';
      default: return 'M15 17h5l-5 5v-5zM4.5 19.5h15a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 6v12a1.5 1.5 0 001.5 1.5z';
    }
  }

  formatDate(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return d.toLocaleDateString();
  }

  trackByNotificationId(index: number, notification: NotificationDto): string {
    return notification.id;
  }
}
