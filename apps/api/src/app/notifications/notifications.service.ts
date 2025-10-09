import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { BackendSupabaseService } from '../supabase/supabase.service';
import { NotificationDto, CreateNotificationDto, UpdateNotificationDto, NotificationListDto } from '@challenge/data/backend';

@Injectable()
export class NotificationsService {
  constructor(private supabaseService: BackendSupabaseService) {}

  /**
   * Get all notifications for a user with pagination and filtering
   */
  async getNotifications(
    userId: string,
    page: number = 1,
    limit: number = 50,
    unreadOnly: boolean = false
  ): Promise<NotificationListDto> {
    try {
      const offset = (page - 1) * limit;
      
      let query = this.supabaseService.getClient()
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const { data: notifications, error, count } = await query;

      if (error) {
        console.error('❌ Failed to get notifications:', error);
        throw new UnauthorizedException('Failed to get notifications');
      }

      // Get unread count separately
      const { count: unreadCount } = await this.supabaseService.getClient()
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      return {
        notifications: notifications.map(this.mapNotificationToDto),
        unreadCount: unreadCount || 0,
        totalCount: count || 0
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('❌ Get notifications failed:', error);
      throw new UnauthorizedException('Failed to get notifications');
    }
  }

  /**
   * Get a single notification by ID
   */
  async getNotificationById(notificationId: string, userId: string): Promise<NotificationDto> {
    try {
      const { data: notification, error } = await this.supabaseService.getClient()
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .eq('user_id', userId)
        .single();

      if (error || !notification) {
        throw new NotFoundException('Notification not found');
      }

      return this.mapNotificationToDto(notification);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('❌ Get notification by ID failed:', error);
      throw new UnauthorizedException('Failed to get notification');
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string, userId: string): Promise<NotificationDto> {
    try {
      const { data: notification, error } = await this.supabaseService.getClient()
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error || !notification) {
        throw new NotFoundException('Notification not found');
      }

      return this.mapNotificationToDto(notification);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('❌ Mark notification as read failed:', error);
      throw new UnauthorizedException('Failed to mark notification as read');
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<{ count: number }> {
    try {
      // First get the count of unread notifications
      const { count: unreadCount } = await this.supabaseService.getClient()
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      // Then update them
      const { error } = await this.supabaseService.getClient()
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('❌ Mark all notifications as read failed:', error);
        throw new UnauthorizedException('Failed to mark all notifications as read');
      }

      return { count: unreadCount || 0 };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('❌ Mark all notifications as read failed:', error);
      throw new UnauthorizedException('Failed to mark all notifications as read');
    }
  }

  /**
   * Delete a single notification
   */
  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabaseService.getClient()
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Delete notification failed:', error);
        throw new UnauthorizedException('Failed to delete notification');
      }
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('❌ Delete notification failed:', error);
      throw new UnauthorizedException('Failed to delete notification');
    }
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<{ count: number }> {
    try {
      // First get the count of all notifications
      const { count: totalCount } = await this.supabaseService.getClient()
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Then delete them
      const { error } = await this.supabaseService.getClient()
        .from('notifications')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Delete all notifications failed:', error);
        throw new UnauthorizedException('Failed to delete all notifications');
      }

      return { count: totalCount || 0 };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('❌ Delete all notifications failed:', error);
      throw new UnauthorizedException('Failed to delete all notifications');
    }
  }

  /**
   * Create a new notification (for internal use)
   */
  async createNotification(createDto: CreateNotificationDto): Promise<NotificationDto> {
    try {
      const { data: notification, error } = await this.supabaseService.getClient()
        .from('notifications')
        .insert({
          user_id: createDto.userId,
          type: createDto.type,
          title: createDto.title,
          message: createDto.message,
          data: createDto.data,
          read: false,
          created_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        console.error('❌ Failed to create notification:', error);
        throw new UnauthorizedException('Failed to create notification');
      }

      return this.mapNotificationToDto(notification);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      console.error('❌ Create notification failed:', error);
      throw new UnauthorizedException('Failed to create notification');
    }
  }

  /**
   * Get unread count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabaseService.getClient()
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('❌ Failed to get unread count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ Get unread count failed:', error);
      return 0;
    }
  }

  /**
   * Map database notification to DTO
   */
  private mapNotificationToDto(notification: any): NotificationDto {
    return {
      id: notification.id,
      userId: notification.user_id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data,
      read: notification.read,
      createdAt: new Date(notification.created_at)
    };
  }
}
