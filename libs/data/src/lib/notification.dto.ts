export interface NotificationDto {
  id: string;
  userId: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'invitation';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
}

export interface CreateNotificationDto {
  userId: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'invitation';
  title: string;
  message: string;
  data?: any;
}

export interface UpdateNotificationDto {
  read?: boolean;
}

export interface NotificationListDto {
  notifications: NotificationDto[];
  unreadCount: number;
  totalCount: number;
}
