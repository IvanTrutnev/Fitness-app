import { Notification, type NotificationType } from '../models/Notification';
import { SSEManager } from '../sse/sseManager';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export class NotificationService {
  static async create(input: CreateNotificationInput) {
    const doc = await Notification.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      isRead: false,
      metadata: input.metadata ?? {},
    });

    const payload = {
      id: doc._id.toString(),
      type: doc.type,
      title: doc.title,
      message: doc.message,
      isRead: doc.isRead,
      metadata: doc.metadata as Record<string, unknown>,
      createdAt: doc.createdAt.toISOString(),
    };

    SSEManager.sendToUser(input.userId, payload);

    return doc;
  }

  static async createBalanceCreated(data: {
    userId: string;
    visits: number;
    dueDate: Date;
  }) {
    return this.create({
      userId: data.userId,
      type: 'balance_created',
      title: 'Balance topped up',
      message: `+${data.visits} visits added. Valid until ${formatDate(data.dueDate)}.`,
      metadata: {
        visits: data.visits,
        dueDate: data.dueDate.toISOString(),
      },
    });
  }

  static async createBalanceLow(data: {
    userId: string;
    remainingVisits: number;
    balanceId: string;
  }) {
    return this.create({
      userId: data.userId,
      type: 'balance_low',
      title: 'Low balance',
      message: `Only ${data.remainingVisits} visit(s) remaining on your balance.`,
      metadata: {
        remainingVisits: data.remainingVisits,
        balanceId: data.balanceId,
      },
    });
  }

  static async createBalanceEmpty(data: {
    userId: string;
    balanceId: string;
  }) {
    return this.create({
      userId: data.userId,
      type: 'balance_empty',
      title: 'No visits left',
      message: 'Your prepaid visits have run out. Please top up your balance.',
      metadata: { balanceId: data.balanceId },
    });
  }

  static async createBalanceExpiryWarning(data: {
    userId: string;
    visits: number;
    dueDate: Date;
    balanceId: string;
    daysLeft: number;
  }) {
    return this.create({
      userId: data.userId,
      type: 'balance_expiry_warning',
      title: 'Balance expiring soon',
      message: `Your balance (${data.visits} visit(s)) expires in ${data.daysLeft} day(s) — ${formatDate(data.dueDate)}.`,
      metadata: {
        visits: data.visits,
        dueDate: data.dueDate.toISOString(),
        balanceId: data.balanceId,
        daysLeft: data.daysLeft,
      },
    });
  }

  static async createBalanceExpired(data: {
    userId: string;
    visits: number;
    dueDate: Date;
    balanceId: string;
  }) {
    return this.create({
      userId: data.userId,
      type: 'balance_expired',
      title: 'Balance expired',
      message: `Your balance expired on ${formatDate(data.dueDate)}. Unused visits: ${data.visits}.`,
      metadata: {
        visits: data.visits,
        dueDate: data.dueDate.toISOString(),
        balanceId: data.balanceId,
      },
    });
  }

  static async getForUser(
    userId: string,
    options: { limit?: number; unreadOnly?: boolean } = {},
  ) {
    const { limit = 50, unreadOnly = false } = options;
    const filter: Record<string, unknown> = { userId };
    if (unreadOnly) filter.isRead = false;

    return Notification.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  static async getUnreadCount(userId: string) {
    return Notification.countDocuments({ userId, isRead: false });
  }

  static async markRead(notificationId: string, userId: string) {
    return Notification.findOneAndUpdate(
      { _id: notificationId, userId },
      { $set: { isRead: true } },
      { new: true },
    );
  }

  static async markAllRead(userId: string) {
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { $set: { isRead: true } },
    );
    return result.modifiedCount;
  }

  /** Skip duplicate expiry warnings for same balance on the same calendar day */
  static async hasRecentExpiryWarning(
    userId: string,
    balanceId: string,
    withinHours = 24,
  ) {
    const since = new Date(Date.now() - withinHours * 60 * 60 * 1000);
    const existing = await Notification.findOne({
      userId,
      type: 'balance_expiry_warning',
      'metadata.balanceId': balanceId,
      createdAt: { $gte: since },
    });
    return !!existing;
  }
}
