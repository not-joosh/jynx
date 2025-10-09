import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    callback: () => void;
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor() {
    // Load any stored notifications
    this.loadStoredNotifications();
  }

  // Add a new notification
  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): void {
    const newNotification: Notification = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date(),
      read: false
    };

    const currentNotifications = this.notificationsSubject.value;
    const updatedNotifications = [newNotification, ...currentNotifications].slice(0, 50); // Keep only last 50
    
    this.notificationsSubject.next(updatedNotifications);
    this.saveNotifications(updatedNotifications);
  }

  // Mark notification as read
  markAsRead(notificationId: string): void {
    const notifications = this.notificationsSubject.value;
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    );
    
    this.notificationsSubject.next(updatedNotifications);
    this.saveNotifications(updatedNotifications);
  }

  // Mark all notifications as read
  markAllAsRead(): void {
    const notifications = this.notificationsSubject.value;
    const updatedNotifications = notifications.map(notification => 
      ({ ...notification, read: true })
    );
    
    this.notificationsSubject.next(updatedNotifications);
    this.saveNotifications(updatedNotifications);
  }

  // Remove a notification
  removeNotification(notificationId: string): void {
    const notifications = this.notificationsSubject.value;
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);
    
    this.notificationsSubject.next(updatedNotifications);
    this.saveNotifications(updatedNotifications);
  }

  // Clear all notifications
  clearAll(): void {
    this.notificationsSubject.next([]);
    this.saveNotifications([]);
  }

  // Get unread count
  getUnreadCount(): Observable<number> {
    return new Observable(observer => {
      this.notifications$.subscribe(notifications => {
        const unreadCount = notifications.filter(n => !n.read).length;
        observer.next(unreadCount);
      });
    });
  }

  // Helper methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  private saveNotifications(notifications: Notification[]): void {
    try {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }

  private loadStoredNotifications(): void {
    try {
      const stored = localStorage.getItem('notifications');
      if (stored) {
        const notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        this.notificationsSubject.next(notifications);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }

  // Convenience methods for different notification types
  success(title: string, message: string, action?: { label: string; callback: () => void }): void {
    this.addNotification({ type: 'success', title, message, action });
  }

  error(title: string, message: string, action?: { label: string; callback: () => void }): void {
    this.addNotification({ type: 'error', title, message, action });
  }

  warning(title: string, message: string, action?: { label: string; callback: () => void }): void {
    this.addNotification({ type: 'warning', title, message, action });
  }

  info(title: string, message: string, action?: { label: string; callback: () => void }): void {
    this.addNotification({ type: 'info', title, message, action });
  }
}
