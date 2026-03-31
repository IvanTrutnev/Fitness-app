// src/kafka/eventPublisher.ts
import { v4 as uuidv4 } from 'uuid';
import { producer, TOPICS, KAFKA_ENABLED } from './config';
import type {
  BaseEvent,
  BalanceEvent,
  VisitEvent,
  UserEvent,
  NotificationEvent,
  AnalyticsEvent,
  AuditEvent,
} from './config';

export class EventPublisher {
  private static isConnected = false;

  static async connect() {
    if (!this.isConnected) {
      await producer.connect();
      this.isConnected = true;
      console.log('✅ Kafka Producer connected');
    }
  }

  static async disconnect() {
    if (this.isConnected) {
      await producer.disconnect();
      this.isConnected = false;
      console.log('🔌 Kafka Producer disconnected');
    }
  }

  private static createBaseEvent(
    userId?: string,
    source: string = 'fitness-app',
  ): BaseEvent {
    return {
      id: uuidv4(),
      timestamp: new Date(),
      userId,
      version: '1.0',
      source,
    };
  }

  private static async publish(topic: string, event: any) {
    if (!KAFKA_ENABLED) {
      return;
    }

    try {
      await this.connect();

      await producer.send({
        topic,
        messages: [
          {
            key: event.id,
            value: JSON.stringify(event),
            timestamp: event.timestamp.getTime().toString(),
          },
        ],
      });

      console.log(`📤 Event published to ${topic}:`, {
        id: event.id,
        type: topic,
        userId: event.userId,
      });
    } catch (error) {
      console.error(`❌ Failed to publish event to ${topic}:`, error);
    }
  }

  // Balance Events
  static async publishBalanceCreated(data: {
    userId: string;
    balanceId: string;
    visits: number;
    dueDate: Date;
    price?: number;
    notes?: string;
  }) {
    const event: BalanceEvent = {
      ...this.createBaseEvent(data.userId),
      balanceId: data.balanceId,
      visits: data.visits,
      dueDate: data.dueDate,
      price: data.price,
      notes: data.notes,
    };

    await this.publish(TOPICS.BALANCE.CREATED, event);
  }

  static async publishBalanceVisitUsed(data: {
    userId: string;
    balanceId: string;
    previousVisits: number;
    remainingVisits: number;
    notes?: string;
  }) {
    const event: BalanceEvent = {
      ...this.createBaseEvent(data.userId),
      balanceId: data.balanceId,
      visits: data.remainingVisits,
      previousVisits: data.previousVisits,
      notes: data.notes,
    };

    await this.publish(TOPICS.BALANCE.VISIT_USED, event);
  }

  static async publishBalanceExpired(data: {
    userId: string;
    balanceId: string;
    visits: number;
    dueDate: Date;
  }) {
    const event: BalanceEvent = {
      ...this.createBaseEvent(data.userId),
      balanceId: data.balanceId,
      visits: data.visits,
      dueDate: data.dueDate,
    };

    await this.publish(TOPICS.BALANCE.EXPIRED, event);
  }

  // Visit Events
  static async publishVisitCreated(data: {
    userId: string;
    visitId: string;
    balanceId?: string;
    trainerId?: string;
    wasBalanceUsed: boolean;
    price?: number;
    notes?: string;
  }) {
    const event: VisitEvent = {
      ...this.createBaseEvent(data.userId),
      visitId: data.visitId,
      balanceId: data.balanceId,
      trainerId: data.trainerId,
      wasBalanceUsed: data.wasBalanceUsed,
      price: data.price,
      notes: data.notes,
    };

    await this.publish(TOPICS.VISIT.CREATED, event);
  }

  // User Events
  static async publishUserRegistered(data: {
    userId: string;
    userEmail: string;
    role: string;
  }) {
    const event: UserEvent = {
      ...this.createBaseEvent(data.userId),
      userEmail: data.userEmail,
      role: data.role,
      action: 'register',
    };

    await this.publish(TOPICS.USER.REGISTERED, event);
  }

  static async publishUserLogin(data: { userId: string; userEmail: string }) {
    const event: UserEvent = {
      ...this.createBaseEvent(data.userId),
      userEmail: data.userEmail,
      action: 'login',
    };

    await this.publish(TOPICS.USER.LOGIN, event);
  }

  // Notification Events
  static async publishNotification(data: {
    userId?: string;
    recipient: string;
    type:
      | 'balance_low'
      | 'balance_expired'
      | 'visit_reminder'
      | 'welcome'
      | 'custom';
    subject?: string;
    message: string;
    metadata?: Record<string, any>;
  }) {
    const event: NotificationEvent = {
      ...this.createBaseEvent(data.userId),
      recipient: data.recipient,
      type: data.type,
      subject: data.subject,
      message: data.message,
      metadata: data.metadata,
    };

    const topic = data.type.includes('email')
      ? TOPICS.NOTIFICATIONS.EMAIL
      : TOPICS.NOTIFICATIONS.PUSH;

    await this.publish(topic, event);
  }

  // Analytics Events
  static async publishAnalytics(data: {
    userId?: string;
    eventType: string;
    data: Record<string, any>;
  }) {
    const event: AnalyticsEvent = {
      ...this.createBaseEvent(data.userId),
      eventType: data.eventType,
      data: data.data,
    };

    await this.publish(TOPICS.ANALYTICS.USER_ACTIVITY, event);
  }

  // Audit Events
  static async publishAudit(data: {
    userId?: string;
    action: string;
    resource: string;
    resourceId?: string;
    previousState?: Record<string, any>;
    newState?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
  }) {
    const event: AuditEvent = {
      ...this.createBaseEvent(data.userId),
      action: data.action,
      resource: data.resource,
      resourceId: data.resourceId,
      previousState: data.previousState,
      newState: data.newState,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    };

    await this.publish(TOPICS.AUDIT.USER_ACTION, event);
  }
}
