export type NotificationType =
  | 'balance_created'
  | 'balance_low'
  | 'balance_empty'
  | 'balance_expiry_warning'
  | 'balance_expired';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface NotificationsResponse {
  success: boolean;
  data: Notification[];
  unreadCount: number;
}
