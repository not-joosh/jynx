import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { NotificationDto, NotificationListDto } from '@challenge/data';

@Injectable({
  providedIn: 'root'
})
export class NotificationsApiService {
  private readonly apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  /**
   * Get all notifications for the current user
   */
  getNotifications(
    page: number = 1,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Observable<NotificationListDto> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    if (unreadOnly) {
      params = params.set('unreadOnly', 'true');
    }

    return this.http.get<NotificationListDto>(this.apiUrl, { params });
  }

  /**
   * Get unread count for the current user
   */
  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/unread-count`);
  }

  /**
   * Get a specific notification by ID
   */
  getNotificationById(id: string): Observable<NotificationDto> {
    return this.http.get<NotificationDto>(`${this.apiUrl}/${id}`);
  }

  /**
   * Mark a notification as read
   */
  markAsRead(id: string): Observable<NotificationDto> {
    return this.http.patch<NotificationDto>(`${this.apiUrl}/${id}/read`, {});
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<{ count: number }> {
    return this.http.patch<{ count: number }>(`${this.apiUrl}/read-all`, {});
  }

  /**
   * Delete a specific notification
   */
  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Delete all notifications for the current user
   */
  deleteAllNotifications(): Observable<{ count: number }> {
    return this.http.delete<{ count: number }>(this.apiUrl);
  }
}
