import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../../services/notification.service';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      <!-- Header with Mark All Read button -->
      <div *ngIf="notifications.length > 0" class="flex items-center justify-between bg-white rounded-xl shadow-lg border border-gray-200 p-3">
        <h3 class="text-sm font-semibold text-gray-900">Notifications</h3>
        <div class="flex items-center space-x-2">
          <button 
            (click)="markAllAsRead()"
            class="text-xs text-blue-600 hover:text-blue-700 transition-colors underline">
            Mark all as read
          </button>
          <button 
            (click)="clearAll()"
            class="text-xs text-gray-500 hover:text-gray-700 transition-colors underline">
            Clear all
          </button>
        </div>
      </div>
      
      <div 
        *ngFor="let notification of notifications; trackBy: trackByNotificationId" 
        class="bg-white rounded-xl shadow-lg border border-gray-200 p-4 transform transition-all duration-300 ease-in-out"
        [class]="getNotificationClass(notification.type)"
        [class.opacity-0]="notification.read"
        [class.scale-95]="notification.read"
        [class.animate-slide-in]="!notification.read">
        
        <!-- Header -->
        <div class="flex items-start justify-between mb-2">
          <div class="flex items-center space-x-3">
            <!-- Icon -->
            <div class="flex-shrink-0">
              <div [class]="getIconClass(notification.type)" class="w-6 h-6 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path *ngIf="notification.type === 'success'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                  <path *ngIf="notification.type === 'error'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                  <path *ngIf="notification.type === 'warning'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                  <path *ngIf="notification.type === 'info'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
            
            <!-- Title -->
            <h4 class="text-sm font-semibold text-gray-900">{{ notification.title }}</h4>
          </div>
          
          <!-- Close Button -->
          <button 
            (click)="removeNotification(notification.id)"
            class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        
        <!-- Message -->
        <p class="text-sm text-gray-600 mb-3">{{ notification.message }}</p>
        
        <!-- Action Button -->
        <div *ngIf="notification.action" class="mb-2">
          <button 
            (click)="notification.action?.callback()"
            class="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors underline">
            {{ notification.action.label }}
          </button>
        </div>
        
        <!-- Timestamp -->
        <p class="text-xs text-gray-400">{{ formatTime(notification.timestamp) }}</p>
      </div>
    </div>
  `
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription.add(
      this.notificationService.notifications$.subscribe(notifications => {
        this.notifications = notifications;
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  removeNotification(id: string): void {
    this.notificationService.removeNotification(id);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  clearAll(): void {
    this.notificationService.clearAll();
  }

  getNotificationClass(type: string): string {
    switch (type) {
      case 'success':
        return 'border-l-4 border-l-green-500';
      case 'error':
        return 'border-l-4 border-l-red-500';
      case 'warning':
        return 'border-l-4 border-l-yellow-500';
      case 'info':
        return 'border-l-4 border-l-blue-500';
      default:
        return 'border-l-4 border-l-gray-500';
    }
  }

  getIconClass(type: string): string {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-600';
      case 'error':
        return 'bg-red-100 text-red-600';
      case 'warning':
        return 'bg-yellow-100 text-yellow-600';
      case 'info':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  trackByNotificationId(index: number, notification: Notification): string {
    return notification.id;
  }

  formatTime(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
