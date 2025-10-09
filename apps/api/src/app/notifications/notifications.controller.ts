import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationDto, UpdateNotificationDto } from '@challenge/data/backend';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  /**
   * GET /notifications - Get all notifications for the current user
   */
  @Get()
  async getNotifications(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('unreadOnly') unreadOnly?: string
  ): Promise<{ notifications: NotificationDto[]; unreadCount: number; totalCount: number }> {
    const userId = req.user.id;
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const unreadOnlyBool = unreadOnly === 'true';

    return this.notificationsService.getNotifications(userId, pageNum, limitNum, unreadOnlyBool);
  }

  /**
   * GET /notifications/unread-count - Get unread count for the current user
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req: any): Promise<{ count: number }> {
    const userId = req.user.id;
    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  /**
   * GET /notifications/:id - Get a specific notification
   */
  @Get(':id')
  async getNotificationById(@Request() req: any, @Param('id') id: string): Promise<NotificationDto> {
    const userId = req.user.id;
    return this.notificationsService.getNotificationById(id, userId);
  }

  /**
   * PATCH /notifications/:id/read - Mark a notification as read
   */
  @Patch(':id/read')
  async markAsRead(@Request() req: any, @Param('id') id: string): Promise<NotificationDto> {
    const userId = req.user.id;
    return this.notificationsService.markAsRead(id, userId);
  }

  /**
   * PATCH /notifications/read-all - Mark all notifications as read
   */
  @Patch('read-all')
  async markAllAsRead(@Request() req: any): Promise<{ count: number }> {
    const userId = req.user.id;
    return this.notificationsService.markAllAsRead(userId);
  }

  /**
   * DELETE /notifications/:id - Delete a specific notification
   */
  @Delete(':id')
  async deleteNotification(@Request() req: any, @Param('id') id: string): Promise<void> {
    const userId = req.user.id;
    return this.notificationsService.deleteNotification(id, userId);
  }

  /**
   * DELETE /notifications - Delete all notifications for the current user
   */
  @Delete()
  async deleteAllNotifications(@Request() req: any): Promise<{ count: number }> {
    const userId = req.user.id;
    return this.notificationsService.deleteAllNotifications(userId);
  }
}
