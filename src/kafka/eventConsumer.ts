// src/kafka/eventConsumer.ts
import { consumer, TOPICS } from './config';
import type {
  BalanceEvent,
  VisitEvent,
  UserEvent,
  NotificationEvent,
  AnalyticsEvent,
  AuditEvent,
} from './config';

export class EventConsumer {
  private static isConnected = false;

  static async connect() {
    if (!this.isConnected) {
      await consumer.connect();
      this.isConnected = true;
      console.log('✅ Kafka Consumer connected');
    }
  }

  static async disconnect() {
    if (this.isConnected) {
      await consumer.disconnect();
      this.isConnected = false;
      console.log('🔌 Kafka Consumer disconnected');
    }
  }

  static async subscribeToTopics() {
    await this.connect();

    // Подписуемся на все топики
    const allTopics = Object.values(TOPICS).flatMap((category) =>
      typeof category === 'object' ? Object.values(category) : [category],
    );

    await consumer.subscribe({
      topics: allTopics,
      fromBeginning: false, // Читаем только новые сообщения
    });

    console.log('📥 Subscribed to topics:', allTopics);
  }

  static async startConsumer() {
    await this.subscribeToTopics();

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          if (!message.value) return;

          console.log(`📨 Received message from ${topic}:`, {
            partition,
            offset: message.offset,
            timestamp: message.timestamp,
          });

          const event = JSON.parse(message.value.toString());
          await this.handleEvent(topic, event);
        } catch (error) {
          console.error(`❌ Error processing message from ${topic}:`, error);
        }
      },
    });
  }

  private static async handleEvent(topic: string, event: any) {
    try {
      switch (topic) {
        // Balance Events
        case TOPICS.BALANCE.CREATED:
          await this.handleBalanceCreated(event as BalanceEvent);
          break;

        case TOPICS.BALANCE.VISIT_USED:
          await this.handleBalanceVisitUsed(event as BalanceEvent);
          break;

        case TOPICS.BALANCE.EXPIRED:
          await this.handleBalanceExpired(event as BalanceEvent);
          break;

        // Visit Events
        case TOPICS.VISIT.CREATED:
          await this.handleVisitCreated(event as VisitEvent);
          break;

        // User Events
        case TOPICS.USER.REGISTERED:
          await this.handleUserRegistered(event as UserEvent);
          break;

        case TOPICS.USER.LOGIN:
          await this.handleUserLogin(event as UserEvent);
          break;

        // Notification Events
        case TOPICS.NOTIFICATIONS.EMAIL:
        case TOPICS.NOTIFICATIONS.PUSH:
          await this.handleNotification(event as NotificationEvent);
          break;

        // Analytics Events
        case TOPICS.ANALYTICS.USER_ACTIVITY:
          await this.handleAnalytics(event as AnalyticsEvent);
          break;

        // Audit Events
        case TOPICS.AUDIT.USER_ACTION:
          await this.handleAudit(event as AuditEvent);
          break;

        default:
          console.log(`⚠️ No handler for topic: ${topic}`);
      }
    } catch (error) {
      console.error(`❌ Error handling event for topic ${topic}:`, error);
    }
  }

  // Balance Event Handlers
  private static async handleBalanceCreated(event: BalanceEvent) {
    console.log(`💰 Balance created for user ${event.userId}:`, {
      balanceId: event.balanceId,
      visits: event.visits,
      dueDate: event.dueDate,
    });

    // Здесь можно добавить логику:
    // - Отправка welcome email
    // - Логирование в analytics
    // - Создание напоминаний
  }

  private static async handleBalanceVisitUsed(event: BalanceEvent) {
    console.log(`🏃 Visit used by user ${event.userId}:`, {
      balanceId: event.balanceId,
      remainingVisits: event.visits,
      previousVisits: event.previousVisits,
    });

    // Логика:
    // - Проверка остатка посещений
    // - Отправка уведомления при низком балансе
    if (event.visits !== undefined && event.visits <= 2) {
      console.log(
        `⚠️ Low balance warning for user ${event.userId}: ${event.visits} visits remaining`,
      );
      // Здесь можно отправить уведомление о низком балансе
    }
  }

  private static async handleBalanceExpired(event: BalanceEvent) {
    console.log(`⏰ Balance expired for user ${event.userId}:`, {
      balanceId: event.balanceId,
      expiredVisits: event.visits,
    });

    // Логика:
    // - Отправка уведомления об истечении
    // - Предложение покупки нового баланса
  }

  // Visit Event Handlers
  private static async handleVisitCreated(event: VisitEvent) {
    console.log(`🏋️ Visit created for user ${event.userId}:`, {
      visitId: event.visitId,
      wasBalanceUsed: event.wasBalanceUsed,
      trainerId: event.trainerId,
    });

    // Логика:
    // - Analytics tracking
    // - Trainer notifications
    // - Revenue calculations
  }

  // User Event Handlers
  private static async handleUserRegistered(event: UserEvent) {
    console.log(`👤 New user registered: ${event.userEmail}`);

    // Логика:
    // - Welcome email
    // - Onboarding sequence
    // - Analytics tracking
  }

  private static async handleUserLogin(event: UserEvent) {
    console.log(`👤 User login: ${event.userEmail}`);

    // Логика:
    // - Activity tracking
    // - Security monitoring
  }

  // Notification Handler
  private static async handleNotification(event: NotificationEvent) {
    console.log(`📬 Notification to send:`, {
      recipient: event.recipient,
      type: event.type,
      subject: event.subject,
    });

    // Здесь интеграция с email/SMS провайдерами:
    // - SendGrid, Mailgun для email
    // - Twilio для SMS
    // - Firebase для push notifications
  }

  // Analytics Handler
  private static async handleAnalytics(event: AnalyticsEvent) {
    console.log(`📊 Analytics event:`, {
      eventType: event.eventType,
      userId: event.userId,
      data: event.data,
    });

    // Логика:
    // - Сохранение в аналитическую БД
    // - Отправка в Google Analytics
    // - Расчет метрик
  }

  // Audit Handler
  private static async handleAudit(event: AuditEvent) {
    console.log(`🔍 Audit event:`, {
      action: event.action,
      resource: event.resource,
      userId: event.userId,
    });

    // Логика:
    // - Сохранение в audit log БД
    // - Security monitoring
    // - Compliance tracking
  }
}
