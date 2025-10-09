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
  template: `
    <div class="max-w-4xl mx-auto space-y-6">
      <!-- Header -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Notifications</h1>
            <p class="text-gray-600 mt-1">Stay updated with your latest activities</p>
          </div>
          
          <div class="flex items-center space-x-3">
            <!-- Filter Toggle -->
            <div class="flex items-center space-x-2">
              <button 
                (click)="toggleFilter()"
                [class]="filterUnreadOnly ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'"
                class="px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                {{ filterUnreadOnly ? 'Unread Only' : 'All Notifications' }}
              </button>
            </div>
            
            <!-- Actions -->
            <div class="flex items-center space-x-2">
              <button 
                (click)="markAllAsRead()"
                [disabled]="isLoading || unreadCount === 0"
                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors">
                Mark All Read
              </button>
              
              <button 
                (click)="clearAll()"
                [disabled]="isLoading || notifications.length === 0"
                class="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg text-sm font-medium transition-colors">
                Clear All
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="p-3 bg-blue-100 rounded-lg">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4.5 19.5h15a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 6v12a1.5 1.5 0 001.5 1.5z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Total Notifications</p>
              <p class="text-2xl font-bold text-gray-900">{{ totalCount }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="p-3 bg-yellow-100 rounded-lg">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Unread</p>
              <p class="text-2xl font-bold text-gray-900">{{ unreadCount }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div class="flex items-center">
            <div class="p-3 bg-green-100 rounded-lg">
              <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-600">Read</p>
              <p class="text-2xl font-bold text-gray-900">{{ totalCount - unreadCount }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Notifications List -->
      <div class="bg-white rounded-xl shadow-sm border border-gray-200">
        <div class="p-6 border-b border-gray-200">
          <h2 class="text-lg font-semibold text-gray-900">
            {{ filterUnreadOnly ? 'Unread Notifications' : 'All Notifications' }}
          </h2>
        </div>
        
        <div *ngIf="isLoading" class="p-8 text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p class="text-gray-600 mt-2">Loading notifications...</p>
        </div>
        
        <div *ngIf="!isLoading && notifications.length === 0" class="p-8 text-center">
          <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-5 5v-5zM4.5 19.5h15a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5h-15A1.5 1.5 0 003 6v12a1.5 1.5 0 001.5 1.5z"></path>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
          <p class="text-gray-600">
            {{ filterUnreadOnly ? 'You have no unread notifications.' : 'You have no notifications yet.' }}
          </p>
        </div>
        
        <div *ngIf="!isLoading && notifications.length > 0" class="divide-y divide-gray-200">
          <div *ngFor="let notification of notifications; trackBy: trackByNotificationId" 
               class="p-6 hover:bg-gray-50 transition-colors">
            <div class="flex items-start space-x-4">
              <!-- Icon -->
              <div class="flex-shrink-0">
                <div [class]="getIconClass(notification.type)" 
                     class="w-10 h-10 rounded-full flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="getIconPath(notification.type)"></path>
                  </svg>
                </div>
              </div>
              
              <!-- Content -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center justify-between">
                  <h3 class="text-sm font-medium text-gray-900">{{ notification.title }}</h3>
                  <div class="flex items-center space-x-2">
                    <!-- Read Status -->
                    <span *ngIf="!notification.read" class="w-2 h-2 bg-blue-600 rounded-full"></span>
                    
                    <!-- Time -->
                    <span class="text-xs text-gray-500">{{ formatDate(notification.createdAt) }}</span>
                  </div>
                </div>
                
                <p class="text-sm text-gray-600 mt-1">{{ notification.message }}</p>
                
                <!-- Actions -->
                <div class="flex items-center space-x-3 mt-3">
                  <button 
                    *ngIf="!notification.read"
                    (click)="markAsRead(notification)"
                    class="text-xs text-blue-600 hover:text-blue-800 font-medium">
                    Mark as read
                  </button>
                  
                  <!-- Invitation Actions -->
                  <div *ngIf="notification.type === 'invitation' && notification.data?.type === 'invitation'" class="flex items-center space-x-2">
                    <button 
                      (click)="acceptInvitation(notification)"
                      class="text-xs text-green-600 hover:text-green-800 font-medium bg-green-50 hover:bg-green-100 px-2 py-1 rounded">
                      Accept
                    </button>
                    <button 
                      (click)="declineInvitation(notification)"
                      class="text-xs text-red-600 hover:text-red-800 font-medium bg-red-50 hover:bg-red-100 px-2 py-1 rounded">
                      Decline
                    </button>
                  </div>
                  
                  <button 
                    (click)="deleteNotification(notification)"
                    class="text-xs text-red-600 hover:text-red-800 font-medium">
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Load More -->
        <div *ngIf="!isLoading && notifications.length > 0 && hasMore" class="p-6 border-t border-gray-200 text-center">
          <button 
            (click)="loadMore()"
            class="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors">
            Load More
          </button>
        </div>
      </div>
    </div>
  `
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
